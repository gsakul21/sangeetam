'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Song {
  title: string;
  artist: string;
  album_art?: string | null;
  spotify_id?: string | null;
}

interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  created_at: string;
  prompt: string;
}

const PlaylistCover = ({ name, isExpanded = false }: { name: string; isExpanded?: boolean }) => {
  // Generate a consistent gradient based on the playlist name
  const getGradientColors = (name: string) => {
    const colors = [
      ['from-purple-500', 'to-pink-500'],
      ['from-blue-500', 'to-purple-500'],
      ['from-pink-500', 'to-orange-500'],
      ['from-green-500', 'to-teal-500'],
      ['from-yellow-500', 'to-red-500'],
    ];
    
    // Use the name to pick a consistent gradient
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const [fromColor, toColor] = getGradientColors(name);

  return (
    <div className="relative w-full aspect-square max-w-[300px] mx-auto mb-8">
      {isExpanded ? (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br ${fromColor} ${toColor} rounded-2xl transform rotate-3`} />
          <div className={`absolute inset-0 bg-gradient-to-br ${fromColor} ${toColor} rounded-2xl opacity-90`} />
        </>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${fromColor} ${toColor} rounded-2xl`} />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <div className={`${isExpanded ? 'w-16 h-16 mb-4' : 'w-12 h-12 mb-2'} text-white/90`}>
          <MusicalNoteIcon className="w-full h-full" />
        </div>
        <h2 className={`${isExpanded ? 'text-xl' : 'text-sm'} font-bold text-white/90 line-clamp-2`}>{name}</h2>
      </div>
    </div>
  );
};

// SVGs for platform logos
const SpotifyLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#1DB954"/>
    <path d="M17.25 16.13c-.29 0-.47-.09-.67-.22-1.82-1.12-4.11-1.37-6.81-.74-.32.07-.63-.13-.7-.45-.07-.32.13-.63.45-.7 2.97-.68 5.48-.4 7.5.84.29.18.38.56.2.85-.12.19-.32.3-.53.3zm.93-2.36c-.36 0-.57-.13-.77-.25-2.08-1.27-5.25-1.64-7.7-.89-.39.11-.8-.11-.91-.5-.11-.39.11-.8.5-.91 2.77-.82 6.26-.41 8.62 1.03.36.22.47.69.25 1.05-.14.23-.38.37-.62.37zm1.01-2.41c-.44 0-.7-.17-.93-.3-2.38-1.43-6.32-1.56-8.61-.85-.48.14-.99-.13-1.13-.61-.14-.48.13-.99.61-1.13 2.65-.77 7.01-.62 9.77 1.01.45.27.6.86.33 1.31-.18.29-.48.46-.81.46z" fill="#fff"/>
  </svg>
);
const AppleLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#000"/>
    <path d="M16.68 13.36c-.02-1.6 1.31-2.36 1.37-2.39-.75-1.1-1.92-1.25-2.33-1.27-1-.1-1.95.59-2.46.59-.5 0-1.27-.57-2.09-.56-.98.01-1.89.57-2.39 1.45-1.02 1.77-.26 4.39.73 5.83.49.71 1.07 1.5 1.84 1.47.74-.03 1.02-.48 1.91-.48.89 0 1.14.48 1.92.47.79-.01 1.29-.72 1.77-1.43.56-.81.79-1.6.8-1.64-.02-.01-1.53-.59-1.55-2.34zm-1.47-4.36c.45-.54.76-1.29.68-2.04-.66.03-1.45.44-1.92.98-.42.48-.79 1.25-.65 1.99.7.05 1.44-.39 1.89-.93z" fill="#fff"/>
  </svg>
);
const TidalLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#000"/>
    <rect x="6.5" y="10.5" width="3" height="3" transform="rotate(45 8 12)" fill="#fff"/>
    <rect x="14.5" y="10.5" width="3" height="3" transform="rotate(45 16 12)" fill="#fff"/>
    <rect x="10.5" y="6.5" width="3" height="3" transform="rotate(45 12 8)" fill="#fff"/>
    <rect x="10.5" y="14.5" width="3" height="3" transform="rotate(45 12 16)" fill="#fff"/>
  </svg>
);

export default function PlaylistPage({ params }: { params: { id: string } }) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/signin');
          return;
        }

        const { data, error } = await supabase
          .from('playlists')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        setPlaylist(data);
      } catch (error) {
        console.error('Error fetching playlist:', error);
        toast.error('Failed to load playlist');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylist();
  }, [params.id, router, supabase]);

  const savePlaylist = async () => {
    if (!playlist) return;

    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to save playlists');
        return;
      }

      // Generate a name for the playlist based on the prompt
      const playlistName = playlist.prompt.length > 50 
        ? `${playlist.prompt.substring(0, 47)}...`
        : playlist.prompt;

      const response = await fetch('/api/save-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlistName,
          songs: playlist.songs,
          prompt: playlist.prompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save playlist');
      }

      toast.success('Playlist saved successfully!', {
        duration: 3000,
        icon: '🎵',
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid #333',
          padding: '16px',
          borderRadius: '8px',
        },
      });
    } catch (error) {
      console.error('Error saving playlist:', error);
      toast.error('Failed to save playlist. Please try again.', {
        duration: 4000,
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid #333',
          padding: '16px',
          borderRadius: '8px',
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const exportPlaylist = async (platform: string) => {
    if (!playlist) return;

    try {
      setIsExporting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to export playlists');
        return;
      }

      const response = await fetch('/api/export-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlist.name,
          songs: playlist.songs,
          platform,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error === 'Spotify not connected') {
          // Redirect to Spotify auth
          window.location.href = '/api/auth/spotify';
          return;
        }
        throw new Error(data.error || 'Failed to export playlist');
      }

      const data = await response.json();
      toast.success(`Playlist exported to ${platform} successfully!`, {
        duration: 3000,
        icon: '🎵',
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid #333',
          padding: '16px',
          borderRadius: '8px',
        },
      });
      setShowExportOptions(false);
    } catch (error) {
      console.error('Error exporting playlist:', error);
      toast.error('Failed to export playlist. Please try again.', {
        duration: 4000,
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid #333',
          padding: '16px',
          borderRadius: '8px',
        },
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Playlist not found</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PlaylistCover name={playlist.name} isExpanded={true} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{playlist.name}</h1>
          <p className="text-zinc-400">Created on {new Date(playlist.created_at).toLocaleDateString()}</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-8 shadow-xl border border-zinc-800">
          <div className="space-y-4">
            <AnimatePresence>
              {playlist.songs.map((song, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-black rounded-lg border border-zinc-800 hover:border-purple-500/50 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    {song.album_art ? (
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
                        <img
                          src={song.album_art}
                          alt={`${song.title} album art`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                        <MusicalNoteIcon className="w-6 h-6 text-purple-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{song.title}</p>
                      <p className="text-zinc-400 text-sm truncate">{song.artist}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-8 flex space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={savePlaylist}
            disabled={isSaving}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </div>
            ) : (
              'Save Playlist'
            )}
          </motion.button>

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowExportOptions(!showExportOptions)}
              disabled={isExporting}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </div>
              ) : (
                'Export Playlist'
              )}
            </motion.button>
            <AnimatePresence>
              {showExportOptions && (
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-4 flex space-x-4 z-20"
                >
                  <button
                    onClick={() => exportPlaylist('spotify')}
                    className="flex items-center px-4 py-2 rounded-lg font-medium shadow-lg transition-all duration-200 focus:outline-none"
                    style={{ background: '#1DB954', color: '#fff' }}
                  >
                    <SpotifyLogo />
                    <span className="ml-2">Spotify</span>
                  </button>
                  <button
                    onClick={() => exportPlaylist('apple')}
                    className="flex items-center px-4 py-2 rounded-lg font-medium shadow-lg transition-all duration-200 focus:outline-none"
                    style={{ background: '#000', color: '#fff' }}
                  >
                    <AppleLogo />
                    <span className="ml-2">Apple Music</span>
                  </button>
                  <button
                    onClick={() => exportPlaylist('tidal')}
                    className="flex items-center px-4 py-2 rounded-lg font-medium shadow-lg transition-all duration-200 focus:outline-none"
                    style={{ background: '#000', color: '#fff', border: '2px solid #fff' }}
                  >
                    <TidalLogo />
                    <span className="ml-2">Tidal</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
} 