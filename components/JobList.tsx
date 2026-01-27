/**
 * Job List Component
 * Displays job listings with server-side pagination
 */

'use client';

import { useEffect, useState } from 'react';
import { Job } from '@/types/job';
import { FilterCondition } from '@/types/filters';
import { fetchJobsPaginated } from '@/lib/supabase';
import JobCard from './JobCard';

const DEFAULT_PAGE_SIZE = 20;

interface JobListProps {
  filters: FilterCondition[];
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
    <div className="flex items-center justify-between border-t border-gray-200 py-4">
      <div className="text-sm text-gray-500">
        Showing {startIndex + 1}-{endIndex} of {totalCount.toLocaleString()}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages.toLocaleString()}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function JobList({ filters }: JobListProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  // Fetch jobs when page changes
  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchJobsPaginated(currentPage, pageSize);
        setJobs(result.jobs);
        setTotalCount(result.totalCount);
      } catch (err) {
        setError('Failed to load jobs. Please check your connection and try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-800 font-medium mb-2">Error Loading Jobs</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-700 text-lg font-medium mb-2">No jobs yet</p>
        <p className="text-gray-500 text-sm">
          The database is empty. Run the populate script to add jobs.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">All Jobs</h2>
          <div className="text-sm text-gray-500">
            {totalCount.toLocaleString()} {totalCount === 1 ? 'job' : 'jobs'}
          </div>
        </div>
      </div>

      {/* Top Pagination */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />

      <div className="space-y-4 my-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {/* Bottom Pagination */}
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
