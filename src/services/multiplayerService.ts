import { supabase } from '../lib/supabase';
import { GameSnapshot } from '../domain/gameState';

export interface MatchRoom {
  id: string;
  code: string;
  host_id: string;
  status: 'lobby' | 'playing' | 'finished';
  game_state: GameSnapshot | null;
  created_at: string;
}

export interface PlayerSession {
  id: string;
  match_id: string;
  user_id: string;
  name: string;
  avatar: string;
  slot_index: number;
  is_ready: boolean;
}

export const multiplayerService = {
  checkEnabled() {
    if (!supabase) {
      throw new Error('Supabase credentials are not configured. Please add SUPABASE_URL and SUPABASE_KEY to your environment variables.');
    }
  },

  async createMatch(hostId: string, hostName: string, avatar: string) {
    this.checkEnabled();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data: match, error: matchError } = await supabase!
      .from('matches')
      .insert({
        code,
        host_id: hostId,
        status: 'lobby',
      })
      .select()
      .single();

    if (matchError) throw matchError;

    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        match_id: match.id,
        user_id: hostId,
        name: hostName,
        avatar,
        slot_index: 0,
        is_ready: true,
      })
      .select()
      .single();

    if (playerError) throw playerError;

    return { match, player };
  },

  async joinMatch(code: string, userId: string, name: string, avatar: string) {
    this.checkEnabled();
    const { data: match, error: matchError } = await supabase!
      .from('matches')
      .select()
      .eq('code', code.toUpperCase())
      .single();

    if (matchError) throw new Error('Match not found');
    if (match.status !== 'lobby') throw new Error('Match already started');

    // Get current players to find next slot
    const { data: players } = await supabase
      .from('players')
      .select('slot_index')
      .eq('match_id', match.id);

    const usedSlots = players?.map(p => p.slot_index) || [];
    let nextSlot = 0;
    while (usedSlots.includes(nextSlot)) nextSlot++;

    if (nextSlot >= 4) throw new Error('Match full');

    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        match_id: match.id,
        user_id: userId,
        name,
        avatar,
        slot_index: nextSlot,
        is_ready: false,
      })
      .select()
      .single();

    if (playerError) throw playerError;

    return { match, player };
  },

  async updateGameState(matchId: string, gameState: GameSnapshot) {
    this.checkEnabled();
    const { error } = await supabase!
      .from('matches')
      .update({ game_state: gameState })
      .eq('id', matchId);

    if (error) throw error;
  },

  async setReady(playerId: string, isReady: boolean) {
    this.checkEnabled();
    const { error } = await supabase!
      .from('players')
      .update({ is_ready: isReady })
      .eq('id', playerId);

    if (error) throw error;
  },

  async startMatch(matchId: string, initialState: GameSnapshot) {
    this.checkEnabled();
    const { error } = await supabase!
      .from('matches')
      .update({ 
        status: 'playing',
        game_state: initialState
      })
      .eq('id', matchId);

    if (error) throw error;
  },

  async returnToLobby(matchId: string) {
    this.checkEnabled();
    const { error } = await supabase!
      .from('matches')
      .update({ 
        status: 'lobby',
        game_state: null
      })
      .eq('id', matchId);

    if (error) throw error;
  },

  async getMatch(matchId: string): Promise<MatchRoom | null> {
    this.checkEnabled();
    const { data, error } = await supabase!
      .from('matches')
      .select()
      .eq('id', matchId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getPlayers(matchId: string): Promise<PlayerSession[]> {
    this.checkEnabled();
    const { data, error } = await supabase!
      .from('players')
      .select()
      .eq('match_id', matchId)
      .order('slot_index', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  subscribeToMatch(matchId: string, onUpdate: (match: MatchRoom) => void) {
    if (!supabase) return { unsubscribe: () => {} };
    // Use a unique channel ID to avoid "already subscribed" errors on rapid re-renders
    const channelId = `match:${matchId}:${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        (payload) => onUpdate(payload.new as MatchRoom)
      );

    channel.subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  },

  subscribeToPlayers(matchId: string, onUpdate: (players: PlayerSession[]) => void) {
    if (!supabase) return { unsubscribe: () => {} };
    const channelId = `players:${matchId}:${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `match_id=eq.${matchId}` },
        async () => {
          const { data } = await supabase!
            .from('players')
            .select()
            .eq('match_id', matchId)
            .order('slot_index', { ascending: true });
          if (data) onUpdate(data as PlayerSession[]);
        }
      );

    channel.subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }
};
