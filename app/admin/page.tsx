/**
 * Admin Dashboard
 * Shows Apify sync status and database statistics
 */

'use client';

import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserButton } from '@clerk/nextjs';
import { userButtonAppearance } from '@/lib/clerk-appearance';

interface AdminStats {
  lastApifyRun: {
    date: string;
    jobsReturned: number;
    actor: string;
    status: string;
    cost: string;
  } | null;
  lastDbUpdate: string | null;
  newJobsAdded: number;
  totalActiveJobs: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch admin stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin stats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Job Board System Status</p>
          </div>
          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <a
              href="/"
              className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              Back to Jobs
            </a>
            <UserButton appearance={userButtonAppearance} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Last Apify Run */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">🔄</span>
              Last Apify Run
            </h2>
            {stats?.lastApifyRun ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">When</p>
                  <p className="text-lg font-medium">
                    {new Date(stats.lastApifyRun.date).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jobs Returned</p>
                  <p className="text-2xl font-bold text-primary">
                    {stats.lastApifyRun.jobsReturned.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actor</p>
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {stats.lastApifyRun.actor}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={`font-medium ${
                      stats.lastApifyRun.status === 'success'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stats.lastApifyRun.status.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cost</p>
                    <p className="font-medium">${stats.lastApifyRun.cost}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No Apify runs recorded</p>
            )}
          </div>

          {/* Database Status */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">💾</span>
              Database Status
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Last Update</p>
                <p className="text-lg font-medium">
                  {stats?.lastDbUpdate
                    ? new Date(stats.lastDbUpdate).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Jobs Added</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  +{stats?.newJobsAdded.toLocaleString() ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  (after deduplication)
                </p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Total Active Jobs</p>
                <p className="text-2xl font-bold text-primary">
                  {stats?.totalActiveJobs.toLocaleString() ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="mt-6 bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">ℹ️</span>
            System Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Sync Frequency</p>
              <p className="font-medium">Daily (24h)</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data Source</p>
              <p className="font-medium">Apify Career Site API</p>
            </div>
            <div>
              <p className="text-muted-foreground">Deduplication</p>
              <p className="font-medium">By external_id</p>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Refresh Stats
          </button>
          <p className="text-xs text-muted-foreground mt-2">
            Last refreshed: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </main>
  );
}
