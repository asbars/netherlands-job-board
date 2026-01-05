'use client';

import { useState } from 'react';
import { Job } from '@/types/job';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {job.title}
          </h3>
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
                {job.employment_type[0]}
              </span>
            )}
            {job.ai_experience_level && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md">
                {job.ai_experience_level}
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
          {formatDate(job.first_seen_date)}
        </div>
      </div>

      {(job.ai_salary_minvalue || job.ai_salary_value) && (
        <div className="mb-4 text-sm font-semibold text-green-600">
          {job.ai_salary_minvalue && job.ai_salary_maxvalue 
            ? `€${job.ai_salary_minvalue.toLocaleString()} - €${job.ai_salary_maxvalue.toLocaleString()} ${job.ai_salary_unittext || ''}`
            : job.ai_salary_value 
            ? `€${job.ai_salary_value.toLocaleString()} ${job.ai_salary_unittext || ''}`
            : null
          }
        </div>
      )}

      {job.description_html && (
        <div className="mb-4">
          <div 
            className={`prose prose-sm max-w-none text-gray-700 overflow-hidden transition-all duration-300 ${
              isExpanded ? 'max-h-none' : 'max-h-[4.5rem]'
            }`}
            dangerouslySetInnerHTML={{ __html: job.description_html }}
          />
          {job.description_html.length > 200 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {job.linkedin_org_size && (
        <div className="mb-3 text-sm text-gray-600">
          <span className="font-medium">Company size:</span> {job.linkedin_org_size}
        </div>
      )}

      {job.linkedin_org_industry && (
        <div className="mb-3 text-sm text-gray-600">
          <span className="font-medium">Industry:</span> {job.linkedin_org_industry}
        </div>
      )}

      <div className="flex items-center gap-4">
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            Apply Now
            <svg 
              className="ml-1 w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
              />
            </svg>
          </a>
        )}
        
        {job.linkedin_org_slug && (
          <a
            href={`https://www.linkedin.com/company/${job.linkedin_org_slug}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-gray-600 hover:text-gray-700 text-sm transition-colors"
          >
            View Company
            <svg 
              className="ml-1 w-4 h-4" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

