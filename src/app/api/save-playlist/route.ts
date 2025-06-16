import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface Song {
  title: string;
  artist: string;
  albumArt?: string | null;
  spotifyId?: string | null;
}

export async function POST(req: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, songs, prompt } = await req.json();

    // Ensure songs have the correct property names
    const formattedSongs = songs.map((song: Song) => ({
      title: song.title,
      artist: song.artist,
      album_art: song.albumArt || null, // Convert albumArt to album_art for database
      spotify_id: song.spotifyId || null, // Convert spotifyId to spotify_id for database
    }));

    console.log('Saving playlist with songs:', formattedSongs.map((s: { title: string; album_art: string | null }) => ({
      title: s.title,
      hasAlbumArt: !!s.album_art
    })));

    // Save to Supabase
    const { data: playlist, error } = await supabase
      .from('playlists')
      .insert([{
        user_id: session.user.id,
        name,
        prompt,
        songs: formattedSongs,
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.json({ 
      playlist,
      message: 'Playlist saved successfully'
    });

    /* Spotify integration temporarily commented out
    // Create playlist in Spotify
    const createPlaylistResponse = await fetch(
      'https://api.spotify.com/v1/me/playlists',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.provider_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          public: false,
        }),
      }
    );

    if (!createPlaylistResponse.ok) {
      throw new Error('Failed to create Spotify playlist');
    }

    const { id: spotifyPlaylistId } = await createPlaylistResponse.json();

    // Search for each song and get its Spotify ID
    const trackUris = await Promise.all(
      songs.map(async (song: { title: string; artist: string }) => {
        const searchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(
            `${song.title} ${song.artist}`
          )}&type=track&limit=1`,
          {
            headers: {
              Authorization: `Bearer ${session.provider_token}`,
            },
          }
        );

        if (!searchResponse.ok) return null;

        const data = await searchResponse.json();
        return data.tracks.items[0]?.uri;
      })
    );

    // Add tracks to playlist
    const validTrackUris = trackUris.filter(Boolean);
    if (validTrackUris.length > 0) {
      const addTracksResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/tracks`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.provider_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: validTrackUris,
          }),
        }
      );

      if (!addTracksResponse.ok) {
        throw new Error('Failed to add tracks to Spotify playlist');
      }
    }
    */
  } catch (error) {
    console.error('Error saving playlist:', error);
    return NextResponse.json(
      { error: 'Failed to save playlist' },
      { status: 500 }
    );
  }
} 