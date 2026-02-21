import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

const CONTEXT_DURATION_HOURS = 12;

/**
 * POST /api/saved-filters/[id]/mark-checked
 * Update last_checked_at timestamp when user applies filter
 * Also stores the viewing context for cross-device "New" badge persistence
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

    // First, get the current filter to capture last_checked_at before updating
    const { data: currentFilter, error: fetchError } = await supabaseAdmin
      .from('jobmarket_user_saved_filters')
      .select('last_checked_at')
      .eq('id', filterId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !currentFilter) {
      console.error('Error fetching filter:', fetchError);
      return NextResponse.json({ error: 'Filter not found' }, { status: 404 });
    }

    const previousLastChecked = currentFilter.last_checked_at;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CONTEXT_DURATION_HOURS * 60 * 60 * 1000);

    // Store the viewing context for cross-device "New" badge persistence
    // Use upsert to handle both insert and update cases
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
        // Don't fail the request, just log the error
      }
    }

    // Update last_checked_at to current timestamp
    const { data, error } = await supabaseAdmin
      .from('jobmarket_user_saved_filters')
      .update({ last_checked_at: now.toISOString() })
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
      viewing_since: previousLastChecked,
    });
  } catch (error) {
    console.error('Error in POST /api/saved-filters/[id]/mark-checked:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
