import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin, countNewJobsForFilter } from '@/lib/supabase';
import { FilterCondition } from '@/types/filters';

/**
 * POST /api/saved-filters/[id]/mark-checked
 * Update last_checked_at timestamp when user applies filter.
 * Stores new_jobs_since boundary, badge snapshot, and cross-device context.
 *
 * If the badge is still valid (non-expired), returns existing data without changes.
 * Accepts optional `expires_at` from client (for 4am local-time expiry).
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filterId = parseInt(params.id, 10);

    // Parse optional client-supplied expiry (for 4am local time support)
    let clientExpiresAt: string | null = null;
    try {
      const body = await request.json();
      clientExpiresAt = body?.expires_at || null;
    } catch {
      // No body or invalid JSON - use default 12h expiry
    }

    // Get the current filter state
    const { data: currentFilter, error: fetchError } = await supabaseAdmin
      .from('jobmarket_user_saved_filters')
      .select('last_checked_at, filters, badge_count_snapshot, badge_count_expires_at, new_jobs_since')
      .eq('id', filterId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !currentFilter) {
      console.error('Error fetching filter:', fetchError);
      return NextResponse.json({ error: 'Filter not found' }, { status: 404 });
    }

    const now = new Date();

    // If badge is still valid, return existing data without re-marking
    const hasValidBadge =
      currentFilter.badge_count_expires_at &&
      new Date(currentFilter.badge_count_expires_at) > now &&
      currentFilter.new_jobs_since !== null;

    if (hasValidBadge) {
      return NextResponse.json({
        success: true,
        already_valid: true,
        last_checked_at: currentFilter.last_checked_at,
        new_jobs_since: currentFilter.new_jobs_since,
        badge_count_snapshot: currentFilter.badge_count_snapshot,
        badge_count_expires_at: currentFilter.badge_count_expires_at,
      });
    }

    // Badge expired or never set - create new snapshot
    const previousLastChecked = currentFilter.last_checked_at;

    // Calculate expiry: use client-supplied value (min of 12h and next 4am)
    // or fall back to 12h from now
    let expiresAt: Date;
    if (clientExpiresAt) {
      const clientDate = new Date(clientExpiresAt);
      // Validate: must be in the future and at most 12h from now
      const maxExpiry = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      if (clientDate > now && clientDate <= maxExpiry) {
        expiresAt = clientDate;
      } else {
        expiresAt = maxExpiry;
      }
    } else {
      expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    }

    // Calculate the new job count BEFORE updating last_checked_at
    let badgeCountSnapshot = 0;
    if (previousLastChecked) {
      try {
        const filterConditions = currentFilter.filters as FilterCondition[];
        badgeCountSnapshot = await countNewJobsForFilter(filterConditions, previousLastChecked);
      } catch (err) {
        console.error('Error calculating badge snapshot:', err);
      }
    }

    // Store the viewing context for cross-device "New" badge persistence
    if (previousLastChecked) {
      const { error: contextError } = await supabaseAdmin
        .from('jobmarket_active_filter_context')
        .upsert(
          {
            user_id: userId,
            saved_filter_id: filterId,
            viewing_since: previousLastChecked,
            expires_at: expiresAt.toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (contextError) {
        console.error('Error storing filter context:', contextError);
      }
    }

    // Update the saved filter: move last_checked_at forward, store badge snapshot
    // and new_jobs_since (the boundary for "new" detection)
    const { data, error } = await supabaseAdmin
      .from('jobmarket_user_saved_filters')
      .update({
        last_checked_at: now.toISOString(),
        badge_count_snapshot: badgeCountSnapshot,
        badge_count_expires_at: expiresAt.toISOString(),
        new_jobs_since: previousLastChecked,
      })
      .eq('id', filterId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error marking filter as checked:', error);
      return NextResponse.json({ error: 'Failed to mark filter as checked' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Filter not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      last_checked_at: data.last_checked_at,
      new_jobs_since: previousLastChecked,
      badge_count_snapshot: badgeCountSnapshot,
      badge_count_expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error in POST /api/saved-filters/[id]/mark-checked:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
