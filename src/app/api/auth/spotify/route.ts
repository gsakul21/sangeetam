import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/spotify/callback`;

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    // Generate Spotify authorization URL
    const scope = 'playlist-modify-public playlist-modify-private';
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID!);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('state', session.user.id);

    return NextResponse.redirect(authUrl.toString());
  }

  // Exchange code for access token
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.json({ error: 'Failed to get Spotify access token' }, { status: 500 });
  }

  const { access_token, refresh_token } = await tokenResponse.json();

  // Store tokens in Supabase
  const { error } = await supabase
    .from('user_tokens')
    .upsert({
      user_id: session.user.id,
      spotify_access_token: access_token,
      spotify_refresh_token: refresh_token,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json({ error: 'Failed to store Spotify tokens' }, { status: 500 });
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/profile`);
} 