'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

interface Song {
  title: string;
  artist: string;
  album_art?: string;
  spotify_id?: string;
}

interface Playlist {
  id: string;
  name: string;
  prompt: string;
  songs: Song[];
  created_at: string;
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
    <div className="relative w-full aspect-square">
      {isExpanded ? (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br ${fromColor} ${toColor} rounded-xl transform rotate-3`} />
          <div className={`absolute inset-0 bg-gradient-to-br ${fromColor} ${toColor} rounded-xl opacity-90`} />
        </>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${fromColor} ${toColor} rounded-xl`} />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
        <div className={`${isExpanded ? 'w-16 h-16 mb-4' : 'w-12 h-12 mb-2'} text-white/90`}>
          <MusicalNoteIcon className="w-full h-full" />
        </div>
        <h2 className={`${isExpanded ? 'text-xl' : 'text-sm'} font-bold text-white/90 line-clamp-2`}>{name}</h2>
      </div>
    </div>
  );
};

export default function Profile() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/signin');
          return;
        }

        const { data, error } = await supabase
          .from('playlists')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPlaylists(data || []);
      } catch (error) {
        console.error('Error fetching playlists:', error);
        toast.error('Failed to load playlists');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [router, supabase]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPlaylists(playlists.filter(p => p.id !== id));
      toast.success('Playlist deleted');
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast.error('Failed to delete playlist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white pt-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-zinc-800 rounded mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-zinc-900 rounded-xl overflow-hidden">
                  <div className="aspect-square bg-zinc-800"></div>
                  <div className="p-4">
                    <div className="h-6 w-48 bg-zinc-800 rounded mb-2"></div>
                    <div className="h-4 w-32 bg-zinc-800 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Playlists</h1>
        
        {playlists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-4">You haven't created any playlists yet</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
            >
              Create Your First Playlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {playlists.map((playlist) => (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative bg-zinc-900 rounded-xl overflow-hidden hover:bg-zinc-800 transition-all duration-300"
              >
                <div 
                  className="aspect-square relative cursor-pointer"
                  onClick={() => router.push(`/playlist/${playlist.id}`)}
                >
                  <PlaylistCover name={playlist.name} isExpanded={false} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-medium">View Playlist</span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h2 className="text-lg font-bold mb-1 truncate">{playlist.name}</h2>
                  <p className="text-sm text-zinc-400 line-clamp-2 mb-2">{playlist.prompt}</p>
                  <p className="text-sm text-zinc-500">{playlist.songs.length} songs</p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(playlist.id);
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 