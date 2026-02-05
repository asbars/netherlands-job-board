/**
 * Admin Stats API
 * Returns system statistics for the admin dashboard
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  // Verify authentication (defense in depth - middleware also checks this)
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  try {
    // 1. Get the most recent Apify run
    const { data: lastRun, error: runError } = await supabaseAdmin
      .from('jobmarket_apify_usage_logs')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (runError && runError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is ok
      console.error('Error fetching last Apify run:', runError);
    }

    // 2. Get the most recent database update (last_updated from jobs table)
    const { data: lastUpdate, error: updateError } = await supabaseAdmin
      .from('jobmarket_jobs')
      .select('last_updated')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();

    if (updateError && updateError.code !== 'PGRST116') {
      console.error('Error fetching last update:', updateError);
    }

    // 3. Count new jobs added on the date of the last Apify run
    let newJobsCount = 0;
    if (lastRun) {
      const runDate = new Date(lastRun.date);
      const startOfDay = new Date(runDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(runDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { count, error: countError } = await supabaseAdmin
        .from('jobmarket_jobs')
        .select('*', { count: 'exact', head: true })
        .gte('first_seen_date', startOfDay.toISOString())
        .lte('first_seen_date', endOfDay.toISOString());

      if (countError) {
        console.error('Error counting new jobs:', countError);
      } else {
        newJobsCount = count || 0;
      }
    }

    // 4. Count total active jobs
    const { count: totalActive, error: activeError } = await supabaseAdmin
      .from('jobmarket_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (activeError) {
      console.error('Error counting active jobs:', activeError);
    }

    // Construct response
    const stats = {
      lastApifyRun: lastRun
        ? {
            date: lastRun.date,
            jobsReturned: lastRun.job_count,
            actor: lastRun.actor,
            status: lastRun.run_status,
            cost: lastRun.cost,
          }
        : null,
      lastDbUpdate: lastUpdate?.last_updated || null,
      newJobsAdded: newJobsCount,
      totalActiveJobs: totalActive || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in admin stats API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
