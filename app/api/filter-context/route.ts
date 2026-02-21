/**
 * API Route: Filter Context
 * GET - Get active filter viewing context for cross-device "New" badge persistence
 * DELETE - Clear active filter context
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/filter-context - Get active filter context
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('jobmarket_active_filter_context')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Error fetching filter context:', error);
      return NextResponse.json({ error: 'Failed to fetch filter context' }, { status: 500 });
    }

    // Check if expired
    if (data && new Date(data.expires_at) < new Date()) {
      // Delete expired context
      await supabaseAdmin
        .from('jobmarket_active_filter_context')
        .delete()
        .eq('user_id', userId);
      return NextResponse.json(null);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/filter-context:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/filter-context - Clear active filter context
export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from('jobmarket_active_filter_context')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting filter context:', error);
      return NextResponse.json({ error: 'Failed to delete filter context' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/filter-context:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
