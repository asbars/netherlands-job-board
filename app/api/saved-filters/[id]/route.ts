import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * PATCH /api/saved-filters/[id]
 * Update a saved filter (name and/or notifications_enabled)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, notifications_enabled, filters } = body;

    // Must provide at least one field to update
    if (name === undefined && notifications_enabled === undefined && filters === undefined) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      updateData.name = name;
    }

    if (notifications_enabled !== undefined) {
      updateData.notifications_enabled = notifications_enabled;
    }

    if (filters !== undefined) {
      updateData.filters = filters;
    }

    // Update the filter (only if it belongs to the user)
    const { data, error } = await supabaseAdmin
      .from('jobmarket_user_saved_filters')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({
          error: 'A filter with this name already exists'
        }, { status: 409 });
      }
      console.error('Error updating saved filter:', error);
      return NextResponse.json({ error: 'Failed to update saved filter' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Filter not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/saved-filters/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/saved-filters/[id]
 * Delete a saved filter
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the filter (only if it belongs to the user)
    const { error } = await supabaseAdmin
      .from('jobmarket_user_saved_filters')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting saved filter:', error);
      return NextResponse.json({ error: 'Failed to delete saved filter' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/saved-filters/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
