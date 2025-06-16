import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

export async function POST(req: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, numSongs } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(
      `Generate a playlist of ${numSongs} songs based on this prompt: "${prompt}". 
      Return ONLY a JSON array of objects with "title" and "artist" properties. 
      Do not include any markdown formatting, code blocks, or additional text. 
      Example format: [{"title": "Song Name", "artist": "Artist Name"}]`
    );

    const response = await result.response;
    const text = response.text();
    
    // Clean the response text to ensure it's valid JSON
    const cleanedText = text
      .replace(/```json\n?/g, '') // Remove ```json
      .replace(/```\n?/g, '')     // Remove ```
      .trim();                    // Remove extra whitespace

    const songs = JSON.parse(cleanedText);
    console.log('Generated songs:', songs);

    // Fetch album art for each song using Last.fm API
    const songsWithArt = await Promise.all(
      songs.map(async (song: { title: string; artist: string }) => {
        try {
          const searchQuery = `${song.title} ${song.artist}`;
          console.log('Searching Last.fm for:', searchQuery);

          const lastFmUrl = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(song.artist)}&track=${encodeURIComponent(song.title)}&format=json`;
          console.log('Last.fm URL:', lastFmUrl);

          const searchResponse = await fetch(lastFmUrl);

          if (!searchResponse.ok) {
            const errorText = await searchResponse.text();
            console.error('Last.fm API error:', {
              status: searchResponse.status,
              statusText: searchResponse.statusText,
              error: errorText,
              song: searchQuery,
            });
            return {
              ...song,
              albumArt: null,
            };
          }

          const data = await searchResponse.json();
          console.log('Last.fm response for', searchQuery, ':', JSON.stringify(data, null, 2));
          
          if (!data.track || !data.track.album || !data.track.album.image) {
            console.log(`No album art found for: ${searchQuery}`);
            return {
              ...song,
              albumArt: null,
            };
          }

          // Get the largest image (usually the last one in the array)
          const albumImage = data.track.album.image[data.track.album.image.length - 1]['#text'];
          console.log('Found album art URL:', albumImage);

          console.log('Found track:', {
            name: data.track.name,
            artist: data.track.artist.name,
            hasAlbumArt: !!albumImage,
          });

          return {
            ...song,
            albumArt: albumImage || null,
          };
        } catch (error) {
          console.error('Error fetching album art for song:', song.title, error);
          return {
            ...song,
            albumArt: null,
          };
        }
      })
    );

    console.log('Songs with art:', songsWithArt.map(s => ({
      title: s.title,
      hasArt: !!s.albumArt,
      albumArtUrl: s.albumArt,
    })));

    return NextResponse.json(songsWithArt);
  } catch (error) {
    console.error('Error generating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to generate playlist' },
      { status: 500 }
    );
  }
} 