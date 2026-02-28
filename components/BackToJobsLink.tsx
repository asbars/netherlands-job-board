'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function BackToJobsLinkInner() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  return (
    <a
      href={from || '/'}
      className="inline-flex items-center text-primary hover:text-primary/80 mb-6"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to jobs
    </a>
  );
}

export default function BackToJobsLink() {
  return (
    <Suspense fallback={
      <a href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to jobs
      </a>
    }>
      <BackToJobsLinkInner />
    </Suspense>
  );
}
