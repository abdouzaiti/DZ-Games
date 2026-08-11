import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || (window as any)._env_?.SUPABASE_URL || '';
const supabaseKey = (import.meta.env.VITE_SUPABASE_KEY as string) || (window as any)._env_?.SUPABASE_KEY || '';

const isValidUrl = (url: string) => {
  return url && (url.startsWith('https://') || url.startsWith('http://'));
};

if (!isValidUrl(supabaseUrl) || !supabaseKey) {
  console.info('Supabase credentials not found or invalid. Online multiplayer is in setup mode.');
}

export const supabase = (isValidUrl(supabaseUrl) && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
