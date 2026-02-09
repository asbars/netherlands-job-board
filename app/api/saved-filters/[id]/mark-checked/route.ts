import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/saved-filters/[id]/mark-checked
 * Update last_checked_at timestamp when user applies filter
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

    // Update last_checked_at to current timestamp
    const { data, error } = await supabaseAdmin
      .from('jobmarket_user_saved_filters')
      .update({ last_checked_at: new Date().toISOString() })
      .eq('id', params.id)
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

    return NextResponse.json({ success: true, last_checked_at: data.last_checked_at });
  } catch (error) {
    console.error('Error in POST /api/saved-filters/[id]/mark-checked:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
