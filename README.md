# AI Playlist Generator

Generate personalized playlists using AI and save them to your Spotify account.

## Features

- Generate playlists using AI (Gemini)
- Save playlists to Spotify
- User authentication with Spotify and Google
- View and manage your saved playlists
- Dark mode support
- Responsive design

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- NextAuth.js
- Supabase
- Google Gemini AI
- Spotify Web API
- Last.fm API (for album art)

## Prerequisites

- Node.js 18+ and npm
- Spotify Developer Account (optional)
- Google Cloud Account (for Gemini API)
- Supabase Account
- Last.fm API Key (free)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# API Keys
GEMINI_API_KEY=your_gemini_api_key_here
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
LASTFM_API_KEY=your_lastfm_api_key_here

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Supabase
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-playlist-generator.git
   cd ai-playlist-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables in `.env.local`

4. Create a Supabase project and set up the following table:
   ```sql
   create table playlists (
     id uuid default uuid_generate_v4() primary key,
     user_id text not null,
     name text not null,
     prompt text not null,
     songs jsonb not null,
     spotify_playlist_id text,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Getting a Last.fm API Key

1. Go to [Last.fm API](https://www.last.fm/api/account/create)
2. Create a free account if you don't have one
3. Create a new API application
4. Copy the API key to your `.env.local` file

## Spotify Setup (Optional)

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Add your redirect URI (e.g., `http://localhost:3000/auth/callback`)
4. Copy the Client ID and Client Secret to your `.env.local` file

## Google Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable the Gemini API
4. Create credentials and copy the API key to your `.env.local` file

## License

MIT
