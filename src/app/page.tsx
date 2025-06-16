'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

const playlistLengths = [
  { value: 5, label: 'Short (5 songs)' },
  { value: 10, label: 'Medium (10 songs)' },
  { value: 20, label: 'Long (20 songs)' },
  { value: 30, label: 'Extended (30 songs)' }
];

interface TypewriterTextProps {
  text: string;
  delay?: number;
}

const TypewriterText = ({ text, delay = 0 }: TypewriterTextProps) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, text]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      {displayText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-[2px] h-6 bg-white ml-1"
        />
      )}
    </motion.span>
  );
};

interface ScrambleTextProps {
  text: string;
  delay?: number;
}

const ScrambleText = ({ text, delay = 0 }: ScrambleTextProps) => {
  const [displayText, setDisplayText] = useState(text);
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  useEffect(() => {
    let frame = 0;
    const maxFrames = 120;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((_, index) => {
            const correctChars = Math.floor((frame / maxFrames) * text.length);
            if (index < correctChars) {
              return text[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('')
      );

      frame += 1;
      if (frame >= maxFrames) {
        clearInterval(interval);
        setDisplayText(text);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="font-mono"
    >
      {displayText}
    </motion.span>
  );
};

const FadeInText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        delay,
        ease: "easeOut"
      }}
    >
      {text}
    </motion.span>
  );
};

const Logo = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className="flex items-center space-x-2"
  >
    <div className="relative w-8 h-8">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg transform rotate-45" />
      <div className="absolute inset-0 flex items-center justify-center">
        <MusicalNoteIcon className="w-5 h-5 text-white transform -rotate-45" />
      </div>
    </div>
    <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
      Sangeetam
    </span>
  </motion.div>
);

interface Song {
  title: string;
  artist: string;
  albumArt?: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [numSongs, setNumSongs] = useState(10);
  const [songs, setSongs] = useState<Array<{ title: string; artist: string; albumArt?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  const generatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to generate playlists');
        return;
      }

      const response = await fetch('/api/generate-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, numSongs }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate playlist');
      }

      const data = await response.json();
      setSongs(data);
    } catch (error) {
      console.error('Error generating playlist:', error);
      toast.error('Failed to generate playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const savePlaylist = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to save playlists');
        return;
      }

      // Generate a name for the playlist based on the prompt
      const playlistName = prompt.length > 50 
        ? `${prompt.substring(0, 47)}...`
        : prompt;

      const response = await fetch('/api/save-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlistName,
          songs,
          prompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save playlist');
      }

      toast.success('Playlist saved successfully!');
    } catch (error) {
      console.error('Error saving playlist:', error);
      toast.error('Failed to save playlist');
    }
  };

  return (
    <div className="min-h-screen bg-black font-sans">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[url('/images/hero-pattern.svg')] bg-center opacity-[0.03]" />

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-6xl font-bold text-white mb-6"
              >
                <TypewriterText text="Create Your Perfect Playlist" />
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto"
              >
                <ScrambleText text="Let AI craft the perfect playlist for your mood, occasion, or activity." delay={1.5} />
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="relative bg-zinc-900 rounded-2xl p-8 shadow-xl border border-zinc-800">
              <form onSubmit={generatePlaylist} className="space-y-6">
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-zinc-300 mb-2">
                    <FadeInText text="Describe your perfect playlist" delay={0.2} />
                  </label>
                  <div className="relative">
                    <textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., A playlist for a summer road trip with friends, featuring upbeat indie and pop songs"
                      className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                      rows={4}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    <FadeInText text="Playlist Length" delay={0.3} />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {playlistLengths.map((option, index) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => setNumSongs(option.value)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className={`relative px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          numSongs === option.value
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-black text-zinc-300 hover:bg-zinc-900'
                        }`}
                      >
                        {option.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="relative w-full group"
                >
                  <span className="relative flex items-center justify-center w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        Generate Playlist
                      </>
                    )}
                  </span>
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="relative bg-zinc-900 rounded-2xl p-8 shadow-xl border border-zinc-800">
              {songs && songs.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">
                      Generated Playlist
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={savePlaylist}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
                    >
                      Save Playlist
                    </motion.button>
                  </div>

                  <div className="relative">
                    <div className="max-h-[500px] overflow-y-auto pr-4 space-y-2 custom-scrollbar">
                      <AnimatePresence>
                        {songs.map((song, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 bg-black rounded-lg border border-zinc-800 hover:border-purple-500/50 transition-colors duration-200"
                          >
                            <div className="flex items-center space-x-4">
                              {song.albumArt ? (
                                <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
                                  <img
                                    src={song.albumArt}
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
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 text-purple-400">
                    <MusicalNoteIcon className="w-full h-full" />
                  </div>
                  <h3 className="text-xl font-medium text-zinc-300 mb-2">
                    <FadeInText text="No playlist yet" delay={0.2} />
                  </h3>
                  <p className="text-zinc-500">
                    <FadeInText text="Generate a playlist to see it here" delay={0.3} />
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
