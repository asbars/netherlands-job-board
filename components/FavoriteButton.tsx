'use client';

import { useFavorites } from '@/contexts/FavoritesContext';
import { useUser } from '@clerk/nextjs';

interface FavoriteButtonProps {
  jobId: number;
}

export default function FavoriteButton({ jobId }: FavoriteButtonProps) {
  const { isSignedIn } = useUser();
  const { isFavorited, toggleFavorite } = useFavorites();

  if (!isSignedIn) return null;

  const favorited = isFavorited(jobId);

  return (
    <button
      onClick={() => toggleFavorite(jobId)}
      className={`p-2 rounded-full transition-all hover:bg-muted ${
        favorited
          ? 'text-red-500 opacity-100'
          : 'text-muted-foreground/30 hover:text-red-500 hover:opacity-100'
      }`}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {favorited ? (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
    </button>
  );
}
