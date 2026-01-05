/**
 * Test Apify SDK directly
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { ApifyClient } from 'apify-client';

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN || '';

async function testSDK() {
  console.log('🔍 Testing Apify SDK...\n');
  
  if (!APIFY_API_TOKEN) {
    console.error('❌ APIFY_API_TOKEN not found in .env.local');
    process.exit(1);
  }
  
  console.log('✅ API Token found:', APIFY_API_TOKEN.substring(0, 20) + '...\n');
  
  const client = new ApifyClient({
    token: APIFY_API_TOKEN,
  });
  
  // Test 1: Get user info
  console.log('Test 1: Getting user info via SDK...');
  try {
    const user = await client.user().get();
    console.log('✅ SUCCESS! User authenticated:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Plan: ${user.plan || 'Free'}\n`);
  } catch (error: any) {
    console.error('❌ Failed to get user info');
    console.error('   Error:', error.message);
    console.error('\n📋 Please check:');
    console.error('   1. Your API token is correct');
    console.error('   2. Get it from: https://console.apify.com/account/integrations\n');
    process.exit(1);
  }
  
  // Test 2: List actors
  console.log('Test 2: Checking available actors...');
  try {
    const actorsList = await client.actors().list();
    console.log(`✅ Found ${actorsList.total} actors available\n`);
    
    // Check for our target actor
    const targetActorId = 'fantastic-jobs~career-site-job-listing-api';
    const foundActor = actorsList.items.find((a: any) => 
      a.id === targetActorId || `${a.username}~${a.name}` === targetActorId
    );
    
    if (foundActor) {
      console.log('✅ Target actor found!');
      console.log(`   ID: ${foundActor.id}`);
      console.log(`   Name: ${foundActor.name}`);
      console.log('   Ready to use!\n');
    } else {
      console.log('⚠️  Target actor NOT found in available actors');
      console.log(`   Looking for: ${targetActorId}`);
      console.log('   \n📋 You need to:');
      console.log('   1. Visit: https://apify.com/fantastic-jobs/career-site-job-listing-api');
      console.log('   2. Click "Try for free" or subscribe to a plan');
      console.log('   3. Wait a moment for it to activate');
      console.log('   4. Run this test again\n');
    }
  } catch (error: any) {
    console.error('❌ Error listing actors:', error.message);
  }
  
  // Test 3: Try to access the specific actor
  console.log('\nTest 3: Checking if actor is accessible...');
  const actorId = 'fantastic-jobs~career-site-job-listing-api';
  try {
    const actor = await client.actor(actorId).get();
    console.log('✅ Actor is accessible!');
    console.log(`   Name: ${actor.name}`);
    console.log(`   Description: ${actor.description?.substring(0, 100)}...`);
    console.log('   \n🎉 You\'re all set to run the populate script!\n');
  } catch (error: any) {
    if (error.statusCode === 404 || error.message?.includes('not found')) {
      console.log('❌ Actor not accessible (404)');
      console.log('   \n📋 Required action:');
      console.log('   1. Visit: https://apify.com/fantastic-jobs/career-site-job-listing-api');
      console.log('   2. Click "Try for free" to subscribe');
      console.log('   3. After subscribing, run this test again\n');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testSDK();

