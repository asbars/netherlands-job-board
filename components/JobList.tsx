/**
 * Job List Component
 * Displays job listings with server-side pagination
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Job } from '@/types/job';
import { FilterCondition } from '@/types/filters';
import { FavoriteJob } from '@/types/favorites';
import { fetchJobsPaginated } from '@/lib/supabase';
import JobCard from './JobCard';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@clerk/nextjs';

const DEFAULT_PAGE_SIZE = 20;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

// Helper to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to fetch with retry logic for handling stale connections after inactivity
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchFn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry on last attempt
      if (attempt < retries) {
        console.warn(`Fetch attempt ${attempt + 1} failed, retrying...`, err);
        await delay(RETRY_DELAY_MS * (attempt + 1)); // Exponential backoff
      }
    }
  }

  throw lastError;
}

interface JobListProps {
  filters: FilterCondition[];
  showFavorites?: boolean;
  savedFilterLastChecked?: string | null;
}

function PaginationControls({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between py-4 mt-4 border-t">
      <div className="text-sm text-muted-foreground bg-background px-3 py-1.5 rounded-md w-fit">
        Showing {startIndex + 1}-{endIndex} of {totalCount.toLocaleString()}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground bg-background px-3 py-1.5 rounded-md">
          Page {currentPage} of {totalPages.toLocaleString()}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default function JobList({ filters, showFavorites = false, savedFilterLastChecked }: JobListProps) {
  const { isSignedIn } = useAuth();
  const { isFavorited, toggleFavorite, favoriteIds } = useFavorites();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  // Load jobs function - extracted so it can be called for retry
  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (showFavorites) {
        // Fetch favorite jobs with retry
        const favorites = await fetchWithRetry(async () => {
          const favResponse = await fetch('/api/favorites');
          if (!favResponse.ok) {
            throw new Error('Failed to fetch favorites');
          }
          return favResponse.json() as Promise<FavoriteJob[]>;
        });

        if (favorites.length === 0) {
          setJobs([]);
          setTotalCount(0);
          return;
        }

        // Fetch job details for each favorite
        const jobPromises = favorites.map(async (f) => {
          const response = await fetch(`/api/jobs/${f.job_id}`);
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
        setTotalCount(orderedJobs.length);
      } else {
        // Fetch filtered jobs with retry
        const result = await fetchWithRetry(() =>
          fetchJobsPaginated(currentPage, pageSize, filters)
        );
        setJobs(result.jobs);
        setTotalCount(result.totalCount);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load jobs: ${errorMessage}`);
      console.error('JobList error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters, showFavorites]);

  // Fetch jobs when page or filters change, or when switching to/from favorites view
  useEffect(() => {
    loadJobs();
  }, [loadJobs, favoriteIds.size]);

  // Reset to page 1 when filters change or when toggling favorites view
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, showFavorites]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of job list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4 border-t-2 border-t-transparent"></div>
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 text-destructive mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-destructive font-medium mb-2">Error Loading Jobs</p>
        <p className="text-destructive/80 text-sm mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={loadJobs}>
          Try Again
        </Button>
      </div>
    );
  }

  if (totalCount === 0) {
    if (showFavorites) {
      return (
        <div className="bg-muted border rounded-lg p-12 text-center">
          <svg className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-foreground text-lg font-medium mb-2">No favorites yet</p>
          <p className="text-muted-foreground text-sm">
            Click the heart icon on any job to add it to your favorites.
          </p>
        </div>
      );
    }
    return (
      <div className="bg-muted border rounded-lg p-12 text-center">
        <svg className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p className="text-foreground text-lg font-medium mb-2">No jobs yet</p>
        <p className="text-muted-foreground text-sm">
          The database is empty. Run the populate script to add jobs.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {jobs.map((job, index) => (
          <div
            key={job.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
          >
            <JobCard
              job={job}
              isFavorited={isFavorited(job.id)}
              onToggleFavorite={toggleFavorite}
              isSignedIn={isSignedIn}
              savedFilterLastChecked={savedFilterLastChecked}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
