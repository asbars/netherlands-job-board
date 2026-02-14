'use client';

import { useEffect, useState } from 'react';
import { useAuth, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Job } from '@/types/job';
import { FavoriteJob } from '@/types/favorites';
import JobCard from '@/components/JobCard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FavoritesProvider, useFavorites } from '@/contexts/FavoritesContext';
import { clerkAppearance } from '@/lib/clerk-appearance';

function FavoritesContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const { isFavorited, toggleFavorite, favoriteIds } = useFavorites();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !isLoaded) {
      setLoading(false);
      return;
    }

    async function fetchFavoriteJobs() {
      try {
        setLoading(true);
        setError(null);

        // Get favorites
        const favResponse = await fetch('/api/favorites');
        if (!favResponse.ok) {
          throw new Error('Failed to fetch favorites');
        }
        const favorites: FavoriteJob[] = await favResponse.json();

        if (favorites.length === 0) {
          setJobs([]);
          return;
        }

        // Fetch job details for each favorite
        const jobIds = favorites.map((f) => f.job_id);
        const jobPromises = jobIds.map(async (id) => {
          const response = await fetch(`/api/jobs/${id}`);
          if (response.ok) {
            return response.json();
          }
          return null;
        });

        const jobResults = await Promise.all(jobPromises);
        const validJobs = jobResults.filter((job): job is Job => job !== null);

        // Sort by when they were favorited (most recent first)
        const jobsMap = new Map(validJobs.map((job) => [job.id, job]));
        const orderedJobs = favorites
          .map((f) => jobsMap.get(f.job_id))
          .filter((job): job is Job => job !== undefined);

        setJobs(orderedJobs);
      } catch (err) {
        console.error('Error fetching favorite jobs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load favorites');
      } finally {
        setLoading(false);
      }
    }

    fetchFavoriteJobs();
  }, [isSignedIn, isLoaded, favoriteIds.size]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="bg-muted border rounded-lg p-12 text-center">
        <svg
          className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <p className="text-foreground text-lg font-medium mb-2">Sign in to view your favorites</p>
        <p className="text-muted-foreground text-sm mb-6">
          Save jobs you&apos;re interested in and access them anytime.
        </p>
        <SignInButton mode="modal" appearance={clerkAppearance}>
          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Sign In
          </button>
        </SignInButton>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
        <svg
          className="w-12 h-12 text-destructive mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-destructive font-medium mb-2">Error Loading Favorites</p>
        <p className="text-destructive/80 text-sm">{error}</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-muted border rounded-lg p-12 text-center">
        <svg
          className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <p className="text-foreground text-lg font-medium mb-2">No favorites yet</p>
        <p className="text-muted-foreground text-sm mb-6">
          Click the heart icon on any job to add it to your favorites.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Browse Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          isFavorited={isFavorited(job.id)}
          onToggleFavorite={toggleFavorite}
          isSignedIn={isSignedIn}
        />
      ))}
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <FavoritesProvider>
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <header className="mb-8 flex items-start justify-between">
            <div>
              <Link
                href="/"
                className="inline-flex items-center text-primary hover:text-primary/80 mb-4"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to jobs
              </Link>
              <h1 className="text-3xl font-bold text-foreground mb-2 bg-background px-3 py-2 w-fit rounded-md">
                My Favorites
              </h1>
              <p className="text-muted-foreground bg-background px-3 py-1.5 w-fit rounded-md">
                Jobs you&apos;ve saved for later
              </p>
            </div>
            <div className="flex gap-4 items-center">
              <ThemeToggle />
            </div>
          </header>

          <FavoritesContent />
        </div>
      </main>
    </FavoritesProvider>
  );
}
