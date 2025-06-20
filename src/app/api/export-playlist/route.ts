import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';

interface Song {
  title: string;
  artist: string;
  spotify_id?: string | null;
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { songs, name, platform } = await request.json();

    if (!songs || !name || !platform) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    switch (platform) {
      case 'spotify':
        return await handleSpotifyExport(songs, name, session, supabase);
      case 'apple':
        return NextResponse.json({ error: 'Apple Music export not implemented yet' }, { status: 501 });
      case 'tidal':
        return NextResponse.json({ error: 'Tidal export not implemented yet' }, { status: 501 });
      default:
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error exporting playlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleSpotifyExport(songs: Song[], name: string, session: any, supabase: SupabaseClient) {
  // Get Spotify access token from Supabase
  const { data: spotifyToken } = await supabase
    .from('user_tokens')
    .select('spotify_access_token, spotify_refresh_token')
    .eq('user_id', session.user.id)
    .single();

  if (!spotifyToken?.spotify_access_token) {
    return NextResponse.json({ error: 'Spotify not connected' }, { status: 401 });
  }

  // Create a new playlist
  const createPlaylistResponse = await fetch('https://api.spotify.com/v1/me/playlists', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${spotifyToken.spotify_access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description: 'Created with Sangeetam',
      public: false,
    }),
  });

  if (!createPlaylistResponse.ok) {
    return NextResponse.json({ error: 'Failed to create Spotify playlist' }, { status: 500 });
  }

  const { id: playlistId } = await createPlaylistResponse.json();

  // Search for each song on Spotify and collect URIs
  const trackUris = [];
  for (const song of songs) {
    if (song.spotify_id) {
      trackUris.push(`spotify:track:${song.spotify_id}`);
    } else {
      // Search for the song if we don't have the Spotify ID
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(`${song.title} ${song.artist}`)}&type=track&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${spotifyToken.spotify_access_token}`,
          },
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.tracks.items.length > 0) {
          trackUris.push(searchData.tracks.items[0].uri);
        }
      }
    }
  }

  // Add tracks to the playlist
  if (trackUris.length > 0) {
    const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${spotifyToken.spotify_access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: trackUris,
      }),
    });

    if (!addTracksResponse.ok) {
      return NextResponse.json({ error: 'Failed to add tracks to Spotify playlist' }, { status: 500 });
    }
  }

  return NextResponse.json({ 
    success: true, 
    playlistId,
    tracksAdded: trackUris.length,
  });
} 