'use client';

import { useEffect, useState } from 'react';
import { Job, FilterState } from '@/types/job';
import { fetchJobs } from '@/lib/supabase';
import JobCard from './JobCard';

interface JobListProps {
  filters: FilterState;
}

export default function JobList({ filters }: JobListProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchJobs();
        setJobs(data);
      } catch (err) {
        setError('Failed to load jobs. Please check your connection and try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const titleMatch = !filters.title || 
      job.title.toLowerCase().includes(filters.title.toLowerCase());
    
    const organizationMatch = !filters.organization || 
      job.organization.toLowerCase().includes(filters.organization.toLowerCase());
    
    const locationMatch = !filters.location || 
      (job.location && job.location.toLowerCase().includes(filters.location.toLowerCase()));
    
    const jobTypeMatch = !filters.job_type || 
      job.job_type === filters.job_type;
    
    const experienceMatch = !filters.experience_level || 
      job.experience_level === filters.experience_level;
    
    const remoteMatch = filters.remote_allowed === null || 
      job.remote_allowed === filters.remote_allowed;
    
    const descriptionMatch = !filters.description || 
      job.description_html.toLowerCase().includes(filters.description.toLowerCase());

    return titleMatch && organizationMatch && locationMatch && 
           jobTypeMatch && experienceMatch && remoteMatch && descriptionMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-medium mb-2">Error Loading Jobs</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (filteredJobs.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-600 text-lg font-medium mb-2">No jobs found</p>
        <p className="text-gray-500 text-sm">
          {jobs.length === 0 
            ? 'There are no jobs in the database yet. Check back soon!' 
            : 'Try adjusting your filters to see more results.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredJobs.length}</span> {filteredJobs.length === 1 ? 'job' : 'jobs'}
          {jobs.length !== filteredJobs.length && <span> (filtered from {jobs.length} total)</span>}
        </p>
      </div>
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

