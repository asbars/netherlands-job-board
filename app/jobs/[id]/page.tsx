import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchJobById } from '@/lib/supabase';
import {
  formatEmploymentType,
  formatRelativeDate,
  formatSalaryRange,
} from '@/lib/formatters';

interface JobPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobPage({ params }: JobPageProps) {
  const { id } = await params;
  const job = await fetchJobById(Number(id));

  if (!job) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to jobs
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
            <p className="text-xl text-gray-700 mb-4">{job.organization}</p>

            <div className="flex flex-wrap gap-3 text-sm">
              {job.cities_derived && job.cities_derived.length > 0 && (
                <span className="flex items-center text-gray-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {Array.isArray(job.cities_derived) ? job.cities_derived.join(', ') : job.cities_derived}
                </span>
              )}
              {job.employment_type && job.employment_type.length > 0 && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md">
                  {job.employment_type.map(formatEmploymentType).join(', ')}
                </span>
              )}
              {job.ai_experience_level && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md">
                  {job.ai_experience_level} years experience
                </span>
              )}
              {job.remote_derived && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md">
                  Remote
                </span>
              )}
            </div>
          </div>

          {/* Salary */}
          {(job.ai_salary_minvalue || job.ai_salary_value) && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <p className="text-lg font-semibold text-green-700">
                {formatSalaryRange(
                  job.ai_salary_minvalue,
                  job.ai_salary_maxvalue,
                  job.ai_salary_value,
                  job.ai_salary_currency,
                  job.ai_salary_unittext
                )}
              </p>
            </div>
          )}

          {/* Key Skills */}
          {job.ai_key_skills && job.ai_key_skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Key Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.ai_key_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Job Description */}
          {job.description_text && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{job.description_text}</p>
              </div>
            </div>
          )}

          {/* AI Summary sections */}
          {job.ai_core_responsibilities && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Core Responsibilities</h2>
              <p className="text-gray-700">{job.ai_core_responsibilities}</p>
            </div>
          )}

          {job.ai_requirements_summary && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h2>
              <p className="text-gray-700">{job.ai_requirements_summary}</p>
            </div>
          )}

          {/* Benefits */}
          {job.ai_benefits && job.ai_benefits.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {job.ai_benefits.map((benefit, idx) => (
                  <li key={idx}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Company Info */}
          {(job.linkedin_org_industry || job.linkedin_org_size || job.linkedin_org_description) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About {job.organization}</h2>
              {job.linkedin_org_industry && (
                <p className="text-gray-700 mb-2">
                  <span className="font-medium">Industry:</span> {job.linkedin_org_industry}
                </p>
              )}
              {job.linkedin_org_size && (
                <p className="text-gray-700 mb-2">
                  <span className="font-medium">Company size:</span> {job.linkedin_org_size}
                </p>
              )}
              {job.linkedin_org_description && (
                <p className="text-gray-700 mt-3">{job.linkedin_org_description}</p>
              )}
            </div>
          )}

          {/* Apply Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-4">
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Now
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            {job.linkedin_org_slug && (
              <a
                href={`https://www.linkedin.com/company/${job.linkedin_org_slug}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Company on LinkedIn
                <svg className="ml-2 w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            )}
          </div>

          {/* Posted date */}
          <div className="mt-6 text-sm text-gray-500">
            Posted {formatRelativeDate(job.first_seen_date)}
          </div>
        </div>
      </div>
    </main>
  );
}
