import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Client-side Supabase instance
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  prompt: string;
  songs: Song[];
  spotify_playlist_id?: string;
  created_at: string;
}

export interface Song {
  title: string;
  artist: string;
  genre?: string;
  mood?: string;
  justification?: string;
  spotify_id?: string;
  preview_url?: string;
  album_art?: string;
}

export async function savePlaylist(playlist: Omit<Playlist, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('playlists')
    .insert([playlist])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPlaylists(userId: string) {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPlaylist(id: string) {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
} 