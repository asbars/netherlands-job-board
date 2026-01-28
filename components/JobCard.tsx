'use client';

import Link from 'next/link';
import { Job } from '@/types/job';
import {
  formatEmploymentType,
  formatRelativeDate,
  formatSalaryRange,
} from '@/lib/formatters';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Link href={`/jobs/${job.id}`}>
            <h3 className="text-xl font-semibold text-blue-600 hover:text-blue-800 hover:underline mb-1 cursor-pointer">
              {job.title}
            </h3>
          </Link>
          <p className="text-base font-medium text-gray-700 mb-2">
            {job.organization}
          </p>
          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
            {job.cities_derived && job.cities_derived.length > 0 && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {Array.isArray(job.cities_derived) ? job.cities_derived.slice(0, 2).join(', ') : JSON.stringify(job.cities_derived).replace(/[\[\]"]/g, '')}
              </span>
            )}
            {job.employment_type && job.employment_type.length > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
                {formatEmploymentType(job.employment_type[0])}
              </span>
            )}
            {job.ai_experience_level && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md">
                {job.ai_experience_level} years
              </span>
            )}
            {job.remote_derived && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md">
                Remote
              </span>
            )}
          </div>
        </div>
        <div className="text-right text-sm text-gray-500 ml-4">
          {formatRelativeDate(job.first_seen_date)}
        </div>
      </div>

      {(job.ai_salary_minvalue || job.ai_salary_value) && (
        <div className="mb-3 text-sm font-semibold text-green-600">
          {formatSalaryRange(
            job.ai_salary_minvalue,
            job.ai_salary_maxvalue,
            job.ai_salary_value,
            job.ai_salary_currency,
            job.ai_salary_unittext
          )}
        </div>
      )}

      {job.ai_benefits && job.ai_benefits.length > 0 && (
        <div className="mb-3 text-sm text-gray-600">
          <span className="font-medium">Benefits:</span> {job.ai_benefits.slice(0, 3).join(', ')}
          {job.ai_benefits.length > 3 && ` +${job.ai_benefits.length - 3} more`}
        </div>
      )}

      {job.linkedin_org_industry && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Industry:</span> {job.linkedin_org_industry}
        </div>
      )}
    </div>
  );
}
