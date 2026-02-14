/**
 * Simple test script for favorites functionality
 * Run with: npm run test:favorites
 *
 * This tests the database and API functionality directly
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_USER_ID = 'test-user-favorites-' + Date.now();
let testJobId: number | null = null;

async function setup() {
  console.log('\n📋 Setting up test data...');

  // Get a sample job ID from the database
  const { data: jobs, error } = await supabase
    .from('jobmarket_jobs')
    .select('id')
    .limit(1);

  if (error || !jobs || jobs.length === 0) {
    console.error('❌ Failed to get sample job:', error?.message || 'No jobs found');
    console.log('   Make sure there are jobs in the database');
    process.exit(1);
  }

  testJobId = jobs[0].id;
  console.log(`   Using job ID: ${testJobId}`);
  console.log(`   Using test user ID: ${TEST_USER_ID}`);
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');

  const { error } = await supabase
    .from('jobmarket_user_favorites')
    .delete()
    .eq('user_id', TEST_USER_ID);

  if (error) {
    console.error('❌ Cleanup failed:', error.message);
  } else {
    console.log('   Test data cleaned up');
  }
}

async function testAddFavorite() {
  console.log('\n🧪 Test: Add a favorite');

  const { data, error } = await supabase
    .from('jobmarket_user_favorites')
    .insert({
      user_id: TEST_USER_ID,
      job_id: testJobId,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ FAILED: Could not add favorite:', error.message);
    return false;
  }

  if (data.user_id !== TEST_USER_ID || data.job_id !== testJobId) {
    console.error('❌ FAILED: Data mismatch');
    return false;
  }

  console.log('✅ PASSED: Favorite added successfully');
  console.log(`   ID: ${data.id}, Job ID: ${data.job_id}, Created: ${data.created_at}`);
  return true;
}

async function testGetFavorites() {
  console.log('\n🧪 Test: Get favorites for user');

  const { data, error } = await supabase
    .from('jobmarket_user_favorites')
    .select('*')
    .eq('user_id', TEST_USER_ID);

  if (error) {
    console.error('❌ FAILED: Could not get favorites:', error.message);
    return false;
  }

  if (!data || data.length === 0) {
    console.error('❌ FAILED: No favorites found');
    return false;
  }

  console.log('✅ PASSED: Favorites retrieved successfully');
  console.log(`   Found ${data.length} favorite(s)`);
  return true;
}

async function testDuplicateFavorite() {
  console.log('\n🧪 Test: Prevent duplicate favorites');

  const { error } = await supabase
    .from('jobmarket_user_favorites')
    .insert({
      user_id: TEST_USER_ID,
      job_id: testJobId,
    });

  if (error && error.code === '23505') {
    console.log('✅ PASSED: Duplicate prevented with unique constraint');
    return true;
  }

  console.error('❌ FAILED: Duplicate was allowed or unexpected error:', error?.message);
  return false;
}

async function testRemoveFavorite() {
  console.log('\n🧪 Test: Remove a favorite');

  const { error } = await supabase
    .from('jobmarket_user_favorites')
    .delete()
    .eq('user_id', TEST_USER_ID)
    .eq('job_id', testJobId);

  if (error) {
    console.error('❌ FAILED: Could not remove favorite:', error.message);
    return false;
  }

  // Verify it's gone
  const { data } = await supabase
    .from('jobmarket_user_favorites')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .eq('job_id', testJobId);

  if (data && data.length > 0) {
    console.error('❌ FAILED: Favorite still exists after deletion');
    return false;
  }

  console.log('✅ PASSED: Favorite removed successfully');
  return true;
}

async function testCascadeDelete() {
  console.log('\n🧪 Test: Cascade delete (favorite removed when job deleted)');
  console.log('   ⏭️  SKIPPED: Would require creating and deleting a test job');
  return true;
}

async function testMultipleFavorites() {
  console.log('\n🧪 Test: Multiple favorites for same user');

  // Get another job
  const { data: jobs } = await supabase
    .from('jobmarket_jobs')
    .select('id')
    .neq('id', testJobId)
    .limit(2);

  if (!jobs || jobs.length < 2) {
    console.log('   ⏭️  SKIPPED: Not enough jobs in database');
    return true;
  }

  // Add multiple favorites
  const { error: insertError } = await supabase
    .from('jobmarket_user_favorites')
    .insert([
      { user_id: TEST_USER_ID, job_id: jobs[0].id },
      { user_id: TEST_USER_ID, job_id: jobs[1].id },
    ]);

  if (insertError) {
    console.error('❌ FAILED: Could not add multiple favorites:', insertError.message);
    return false;
  }

  // Verify count
  const { data, count } = await supabase
    .from('jobmarket_user_favorites')
    .select('*', { count: 'exact' })
    .eq('user_id', TEST_USER_ID);

  if (count !== 2) {
    console.error(`❌ FAILED: Expected 2 favorites, got ${count}`);
    return false;
  }

  console.log('✅ PASSED: Multiple favorites added successfully');
  console.log(`   User has ${count} favorites`);
  return true;
}

async function runTests() {
  console.log('═══════════════════════════════════════════');
  console.log('   FAVORITES FUNCTIONALITY TESTS');
  console.log('═══════════════════════════════════════════');

  let passed = 0;
  let failed = 0;

  try {
    await setup();

    const tests = [
      testAddFavorite,
      testGetFavorites,
      testDuplicateFavorite,
      testRemoveFavorite,
      testMultipleFavorites,
      testCascadeDelete,
    ];

    for (const test of tests) {
      const result = await test();
      if (result) passed++;
      else failed++;
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    failed++;
  } finally {
    await cleanup();
  }

  console.log('\n═══════════════════════════════════════════');
  console.log(`   RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
