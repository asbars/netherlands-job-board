/**
 * Test Apify API Access
 * This script helps diagnose Apify API connection issues
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN || '';

async function testApifyAccess() {
  console.log('🔍 Testing Apify API Access...\n');
  
  if (!APIFY_API_TOKEN) {
    console.error('❌ APIFY_API_TOKEN not found in .env.local');
    process.exit(1);
  }
  
  console.log('✅ API Token found:', APIFY_API_TOKEN.substring(0, 15) + '...\n');
  
  // Test 1: Check if API token is valid
  console.log('Test 1: Validating API token...');
  console.log('   URL: https://api.apify.com/v2/user');
  console.log('   Token format:', APIFY_API_TOKEN.substring(0, 20) + '...\n');
  
  try {
    const userResponse = await fetch('https://api.apify.com/v2/user', {
      headers: {
        'Authorization': `Bearer ${APIFY_API_TOKEN}`,
      },
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ API token is valid');
      console.log(`   User: ${userData.data.username || userData.data.email}`);
      console.log(`   Plan: ${userData.data.plan || 'N/A'}\n`);
    } else {
      console.error('❌ API token is invalid');
      console.error('   Status:', userResponse.status);
      console.error('   Response:', await userResponse.text());
      return;
    }
  } catch (error: any) {
    console.error('❌ Error checking token:', error.message);
    return;
  }
  
  // Test 2: List available actors
  console.log('Test 2: Checking available actors...');
  try {
    const actorsResponse = await fetch('https://api.apify.com/v2/acts', {
      headers: {
        'Authorization': `Bearer ${APIFY_API_TOKEN}`,
      },
    });
    
    if (actorsResponse.ok) {
      const actorsData = await actorsResponse.json();
      console.log(`✅ Found ${actorsData.data.total} actors available\n`);
      
      // Check if our actor is in the list
      const targetActor = 'fantastic-jobs/career-site-job-listing-api';
      const hasActor = actorsData.data.items.some((a: any) => 
        a.id === targetActor || a.username + '/' + a.name === targetActor
      );
      
      if (hasActor) {
        console.log('✅ Target actor found in your available actors!');
      } else {
        console.log('⚠️  Target actor NOT found in your available actors');
        console.log('   You may need to subscribe to it first\n');
      }
    }
  } catch (error: any) {
    console.error('❌ Error listing actors:', error.message);
  }
  
  // Test 3: Try to get actor details directly
  console.log('\nTest 3: Checking actor details...');
  const actorIds = [
    'fantastic-jobs/career-site-job-listing-api',
    'fantastic-jobs~career-site-job-listing-api', // Alternative format
  ];
  
  for (const actorId of actorIds) {
    try {
      console.log(`   Trying: ${actorId}`);
      const actorResponse = await fetch(
        `https://api.apify.com/v2/acts/${actorId}`,
        {
          headers: {
            'Authorization': `Bearer ${APIFY_API_TOKEN}`,
          },
        }
      );
      
      if (actorResponse.ok) {
        const actorData = await actorResponse.json();
        console.log(`   ✅ Found actor!`);
        console.log(`      ID: ${actorData.data.id}`);
        console.log(`      Name: ${actorData.data.name}`);
        console.log(`      Username: ${actorData.data.username}`);
        console.log(`      Correct format: ${actorData.data.username}~${actorData.data.name}`);
        break;
      } else {
        console.log(`   ❌ Not found (${actorResponse.status})`);
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Test 4: Show subscription URL
  console.log('\n📋 Next Steps:');
  console.log('   1. Visit: https://apify.com/fantastic-jobs/career-site-job-listing-api');
  console.log('   2. Click "Try for free" or "Subscribe"');
  console.log('   3. Choose a plan (Free trial available)');
  console.log('   4. Run this test script again\n');
}

testApifyAccess();

