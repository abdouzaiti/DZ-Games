import { supabase } from '../lib/supabase';

export interface UserAccount {
  id: string;
  username: string;
  avatar: string;
  has_password: boolean;
  created_at: string;
}

export const authService = {
  async hashPassword(password: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async login(username: string, password?: string): Promise<UserAccount> {
    if (!supabase) throw new Error('Supabase not configured');

    const cleanUsername = username.trim();
    if (!cleanUsername) throw new Error('Username is required');

    // 1. Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, username, password_hash, avatar, created_at')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!user) {
      // 2. Sign up (Create new user)
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          username: cleanUsername,
          avatar: '👤',
        })
        .select()
        .single();

      if (createError) throw createError;

      return {
        id: newUser.id,
        username: newUser.username,
        avatar: newUser.avatar,
        has_password: false,
        created_at: newUser.created_at,
      };
    }

    // 3. User exists - check password if needed
    if (user.password_hash) {
      if (!password) {
        throw new Error('PASSWORD_REQUIRED');
      }
      const hashed = await this.hashPassword(password);
      if (hashed !== user.password_hash) {
        throw new Error('INVALID_PASSWORD');
      }
    }

    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar || '👤',
      has_password: !!user.password_hash,
      created_at: user.created_at,
    };
  },

  async updatePassword(userId: string, password: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    const password_hash = await this.hashPassword(password);
    const { error } = await supabase
      .from('users')
      .update({ password_hash })
      .eq('id', userId);

    if (error) throw error;
  },

  async updateAvatar(userId: string, avatar: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase
      .from('users')
      .update({ avatar })
      .eq('id', userId);

    if (error) throw error;
  },

  async updateUsername(userId: string, username: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase
      .from('users')
      .update({ username })
      .eq('id', userId);

    if (error) throw error;
  }
};
