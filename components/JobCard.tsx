'use client';

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
}

export default function JobCard({ job }: JobCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <Link href={`/jobs/${job.id}`} target="_blank" rel="noopener noreferrer">
              <h3 className="text-xl font-semibold text-foreground hover:text-muted-foreground hover:underline mb-1 cursor-pointer">
                {job.title}
              </h3>
            </Link>
            <p className="text-base font-medium text-muted-foreground mb-2">
              {job.organization}
            </p>
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
          <div className="text-right text-sm text-muted-foreground ml-4">
            {formatRelativeDate(job.date_posted || job.first_seen_date)}
          </div>
        </div>

        {(job.ai_salary_minvalue || job.ai_salary_value) && (
          <div className="mb-3 text-sm font-semibold text-foreground">
            {formatSalaryRange(
              job.ai_salary_minvalue,
              job.ai_salary_maxvalue,
              job.ai_salary_value,
              job.ai_salary_currency,
              job.ai_salary_unittext
            )}
          </div>
        )}

        {(job.ai_core_responsibilities || job.ai_requirements_summary) && (
          <div className="mb-3 text-sm text-muted-foreground space-y-2">
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
          </div>
        )}

        {job.ai_benefits && job.ai_benefits.length > 0 && (
          <div className="mb-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Benefits:</span> {job.ai_benefits.slice(0, 3).join(', ')}
            {job.ai_benefits.length > 3 && ` +${job.ai_benefits.length - 3} more`}
          </div>
        )}

        {job.linkedin_org_industry && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Industry:</span> {job.linkedin_org_industry}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
