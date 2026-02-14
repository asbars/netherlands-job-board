/**
 * Job List Component
 * Displays job listings with server-side pagination
 */

'use client';

import { useEffect, useState } from 'react';
import { Job } from '@/types/job';
import { FilterCondition } from '@/types/filters';
import { FavoriteJob } from '@/types/favorites';
import { fetchJobsPaginated } from '@/lib/supabase';
import JobCard from './JobCard';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@clerk/nextjs';

const DEFAULT_PAGE_SIZE = 20;

interface JobListProps {
  filters: FilterCondition[];
  showFavorites?: boolean;
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

export default function JobList({ filters, showFavorites = false }: JobListProps) {
  const { isSignedIn } = useAuth();
  const { isFavorited, toggleFavorite, favoriteIds } = useFavorites();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  // Fetch jobs when page or filters change, or when switching to/from favorites view
  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        setError(null);

        if (showFavorites) {
          // Fetch favorite jobs
          const favResponse = await fetch('/api/favorites');
          if (!favResponse.ok) {
            throw new Error('Failed to fetch favorites');
          }
          const favorites: FavoriteJob[] = await favResponse.json();

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
          // Fetch filtered jobs
          const result = await fetchJobsPaginated(currentPage, pageSize, filters);
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
    }

    loadJobs();
  }, [currentPage, pageSize, filters, showFavorites, favoriteIds.size]);

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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
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
        <p className="text-destructive/80 text-sm">{error}</p>
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
