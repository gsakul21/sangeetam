import { motion } from 'framer-motion';
import { Song } from '@/lib/supabase';

interface SongCardProps {
  song: Song;
  onPlay?: () => void;
}

export default function SongCard({ song, onPlay }: SongCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center space-x-4"
    >
      {song.album_art && (
        <img
          src={song.album_art}
          alt={`${song.title} album art`}
          className="w-16 h-16 rounded-md object-cover"
        />
      )}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {song.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">{song.artist}</p>
        {song.genre && (
          <span className="inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300 mr-2">
            {song.genre}
          </span>
        )}
        {song.mood && (
          <span className="inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
            {song.mood}
          </span>
        )}
      </div>
      {song.preview_url && (
        <button
          onClick={onPlay}
          className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      )}
    </motion.div>
  );
} 