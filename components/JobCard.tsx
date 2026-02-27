'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Job } from '@/types/job';
import {
  formatEmploymentType,
  formatRelativeDate,
  formatSalaryRange,
} from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface JobCardProps {
  job: Job;
  isFavorited?: boolean;
  onToggleFavorite?: (jobId: number) => void;
  isSignedIn?: boolean;
  savedFilterLastChecked?: string | null;
}

export default function JobCard({ job, isFavorited, onToggleFavorite, isSignedIn, savedFilterLastChecked }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Determine if job is "new" (added to database after the saved filter was last checked)
  // We use first_seen_date because that's when the job appeared in our system,
  // not date_posted which is when the employer posted it (could be days earlier)
  const isNewJob = (() => {
    if (!savedFilterLastChecked) return false;
    if (!job.first_seen_date) return false;
    return new Date(job.first_seen_date) > new Date(savedFilterLastChecked);
  })();
  // Date element - reused in two places for responsive layout
  // Use first_seen_date (when job appeared in our system) to match sorting and "New" badge logic
  const dateElement = (
    <span className="text-sm text-muted-foreground whitespace-nowrap">
      {formatRelativeDate(job.first_seen_date)}
    </span>
  );

  const hasDetails = job.ai_core_responsibilities || job.ai_requirements_summary || (job.ai_benefits && job.ai_benefits.length > 0) || job.linkedin_org_industry;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="mb-3">
          {/* Title row with heart and date (desktop) */}
          <div className="flex items-start justify-between">
            <Link href={`/jobs/${job.id}`} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
              <h3 className="text-xl font-heading font-semibold text-foreground hover:text-primary transition-colors hover:underline mb-1 cursor-pointer">
                {job.title}
              </h3>
            </Link>
            <div className="text-right ml-4 flex items-center gap-2 flex-shrink-0">
              {isNewJob && (
                <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs px-1.5 py-0.5">
                  New
                </Badge>
              )}
              {isSignedIn && onToggleFavorite && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleFavorite(job.id);
                  }}
                  className={`p-1.5 rounded-full transition-all hover:bg-muted ${
                    isFavorited
                      ? 'text-red-500 opacity-100'
                      : 'text-muted-foreground/30 hover:text-red-500 hover:opacity-100'
                  }`}
                  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorited ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </button>
              )}
              {/* Date on desktop - hidden on mobile */}
              <span className="hidden md:inline">{dateElement}</span>
            </div>
          </div>

          {/* Company row with date (mobile) */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-base font-medium text-muted-foreground">
              {job.organization}
            </p>
            {/* Date on mobile - hidden on desktop */}
            <span className="md:hidden ml-2">{dateElement}</span>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-2 text-sm">
            {job.cities_derived && job.cities_derived.length > 0 && (
              <span className="flex items-center text-muted-foreground">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {Array.isArray(job.cities_derived)
                  ? (() => {
                      const sortedCities = [...job.cities_derived].sort();
                      return sortedCities.slice(0, 2).join(', ') +
                        (sortedCities.length > 2 ? ` and ${sortedCities.length - 2} more` : '');
                    })()
                  : JSON.stringify(job.cities_derived).replace(/[\[\]"]/g, '')}
              </span>
            )}
            {job.ai_employment_type && job.ai_employment_type.length > 0 && (
              <Badge variant="secondary">
                {formatEmploymentType(job.ai_employment_type[0])}
              </Badge>
            )}
            {job.ai_experience_level && (
              <Badge variant="secondary">
                {job.ai_experience_level} years
              </Badge>
            )}
            {job.remote_derived && (
              <Badge variant="secondary">
                Remote
              </Badge>
            )}
          </div>
        </div>

        {(job.ai_salary_minvalue || job.ai_salary_value) && (
          <div className="mb-3 text-sm font-semibold text-primary">
            {formatSalaryRange(
              job.ai_salary_minvalue,
              job.ai_salary_maxvalue,
              job.ai_salary_value,
              job.ai_salary_currency,
              job.ai_salary_unittext
            )}
          </div>
        )}

        {/* Expandable details section */}
        {hasDetails && (
          <>
            {expanded && (
              <div className="mb-3 text-sm text-muted-foreground space-y-2 pt-3 border-t border-border/50">
                {job.ai_core_responsibilities && (
                  <p>
                    <span className="font-medium text-foreground">Responsibilities:</span>{' '}
                    {job.ai_core_responsibilities.length > 200
                      ? job.ai_core_responsibilities.slice(0, 200) + '...'
                      : job.ai_core_responsibilities}
                  </p>
                )}
                {job.ai_requirements_summary && (
                  <p>
                    <span className="font-medium text-foreground">Requirements:</span>{' '}
                    {job.ai_requirements_summary.length > 200
                      ? job.ai_requirements_summary.slice(0, 200) + '...'
                      : job.ai_requirements_summary}
                  </p>
                )}
                {job.ai_benefits && job.ai_benefits.length > 0 && (
                  <p>
                    <span className="font-medium text-foreground">Benefits:</span> {job.ai_benefits.slice(0, 3).join(', ')}
                    {job.ai_benefits.length > 3 && ` +${job.ai_benefits.length - 3} more`}
                  </p>
                )}
                {job.linkedin_org_industry && (
                  <p>
                    <span className="font-medium text-foreground">Industry:</span> {job.linkedin_org_industry}
                  </p>
                )}
              </div>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-primary/70 hover:text-primary transition-colors flex items-center gap-1"
            >
              {expanded ? 'Show less' : 'Show details'}
              <svg
                className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
