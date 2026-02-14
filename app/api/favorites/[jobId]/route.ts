import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * DELETE /api/favorites/[jobId]
 * Remove a job from favorites
 */
export async function DELETE(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = parseInt(params.jobId, 10);
    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('jobmarket_user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('job_id', jobId);

    if (error) {
      console.error('Error removing favorite:', error);
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/favorites/[jobId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
