'use client';

export default function BackToJobsLink() {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // If this tab was opened via target="_blank", close it to return to the original tab
    if (window.opener) {
      window.close();
      return;
    }
    // If there's browser history (e.g., navigated here within the same tab), go back
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    // Last resort: navigate to home
    window.location.href = '/';
  };

  return (
    <a
      href="/"
      onClick={handleClick}
      className="inline-flex items-center text-primary hover:text-primary/80 mb-6"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to jobs
    </a>
  );
}
