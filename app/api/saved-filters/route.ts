import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin, countNewJobsForFilter } from '@/lib/supabase';
import { FilterCondition } from '@/types/filters';

const MAX_SAVED_FILTERS = 25;

/**
 * GET /api/saved-filters
 * List all saved filters for the current user, with new job counts
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('jobmarket_user_saved_filters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved filters:', error);
      return NextResponse.json({ error: 'Failed to fetch saved filters' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json([]);
    }

    // Calculate new job counts for each filter
    // Use badge_count_snapshot if not expired (for 12-hour persistence)
    const now = new Date();
    const filtersWithCounts = await Promise.all(
      data.map(async (filter) => {
        try {
          // Check if we have a valid (non-expired) badge snapshot
          const hasValidSnapshot =
            filter.badge_count_snapshot !== null &&
            filter.badge_count_expires_at &&
            new Date(filter.badge_count_expires_at) > now;

          if (hasValidSnapshot) {
            // Use the snapshotted count
            return {
              ...filter,
              new_job_count: filter.badge_count_snapshot,
            };
          }

          // No valid snapshot - calculate the live count
          const filterConditions = filter.filters as FilterCondition[];
          const newJobCount = await countNewJobsForFilter(
            filterConditions,
            filter.last_checked_at
          );
          return {
            ...filter,
            new_job_count: newJobCount,
          };
        } catch (err) {
          console.error(`Error counting new jobs for filter ${filter.id}:`, err);
          return {
            ...filter,
            new_job_count: 0,
          };
        }
      })
    );

    return NextResponse.json(filtersWithCounts);
  } catch (error) {
    console.error('Error in GET /api/saved-filters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/saved-filters
 * Create a new saved filter
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, filters } = body;

    if (!name || !filters) {
      return NextResponse.json({ error: 'Name and filters are required' }, { status: 400 });
    }

    // Check if user has reached the limit
    const { count, error: countError } = await supabaseAdmin
      .from('jobmarket_user_saved_filters')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('Error counting saved filters:', countError);
      return NextResponse.json({ error: 'Failed to check filter limit' }, { status: 500 });
    }

    if ((count || 0) >= MAX_SAVED_FILTERS) {
      return NextResponse.json({
        error: `Maximum of ${MAX_SAVED_FILTERS} saved filters reached`
      }, { status: 400 });
    }

    // Create the saved filter
    const { data, error } = await supabaseAdmin
      .from('jobmarket_user_saved_filters')
      .insert({
        user_id: userId,
        name,
        filters,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({
          error: 'A filter with this name already exists'
        }, { status: 409 });
      }
      console.error('Error creating saved filter:', error);
      return NextResponse.json({ error: 'Failed to create saved filter' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/saved-filters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
