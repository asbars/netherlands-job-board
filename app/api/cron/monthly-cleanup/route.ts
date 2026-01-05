/**
 * Monthly Cleanup Cron Endpoint
 * 
 * This endpoint is called on the 1st of each month to:
 * 1. Mark expired jobs as inactive
 * 2. Clean up old data
 * 3. Log usage metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  console.log('🧹 Monthly cleanup cron job started');
  
  // Verify authorization
  if (!verifyCronSecret(request)) {
    console.error('❌ Unauthorized cron request');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    // Initialize Supabase with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Mark jobs as expired if they haven't been seen in 30 days
    console.log('🔍 Marking expired jobs...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: expiredJobs, error: expireError } = await supabase
      .from('jobmarket_jobs')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('last_updated', thirtyDaysAgo.toISOString())
      .select('id');
    
    if (expireError) {
      console.error('❌ Error marking expired jobs:', expireError);
      throw expireError;
    }
    
    const expiredCount = expiredJobs?.length || 0;
    console.log(`✅ Marked ${expiredCount} jobs as expired`);
    
    // Delete very old inactive jobs (older than 90 days)
    console.log('🗑️  Deleting old inactive jobs...');
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data: deletedJobs, error: deleteError } = await supabase
      .from('jobmarket_jobs')
      .delete()
      .eq('status', 'expired')
      .lt('last_updated', ninetyDaysAgo.toISOString())
      .select('id');
    
    if (deleteError) {
      console.error('❌ Error deleting old jobs:', deleteError);
      throw deleteError;
    }
    
    const deletedCount = deletedJobs?.length || 0;
    console.log(`✅ Deleted ${deletedCount} old jobs`);
    
    // Get database statistics
    const { count: activeCount } = await supabase
      .from('jobmarket_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    const { count: totalCount } = await supabase
      .from('jobmarket_jobs')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Active jobs: ${activeCount}, Total jobs: ${totalCount}`);
    
    // Log the cleanup
    await supabase.from('jobmarket_apify_usage_logs').insert({
      actor: 'monthly-cleanup',
      job_count: expiredCount + deletedCount,
      cost: 0,
      notes: `Monthly cleanup: ${expiredCount} expired, ${deletedCount} deleted`,
      run_status: 'success',
    });
    
    return NextResponse.json({
      success: true,
      message: 'Monthly cleanup completed successfully',
      expiredJobs: expiredCount,
      deletedJobs: deletedCount,
      activeJobs: activeCount,
      totalJobs: totalCount,
    });
    
  } catch (error: any) {
    console.error('❌ Monthly cleanup error:', error);
    
    // Try to log the failure
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.from('jobmarket_apify_usage_logs').insert({
        actor: 'monthly-cleanup',
        job_count: 0,
        cost: 0,
        notes: `Monthly cleanup failed: ${error.message}`,
        run_status: 'failed',
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Monthly cleanup failed',
      },
      { status: 500 }
    );
  }
}

