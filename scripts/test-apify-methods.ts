/**
 * Test different Apify API authentication methods
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN || '';

async function testMethods() {
  console.log('🔍 Testing Apify API Authentication Methods\n');
  
  const methods = [
    {
      name: 'Method 1: Bearer Token in Header',
      url: 'https://api.apify.com/v2/user',
      options: {
        headers: {
          'Authorization': `Bearer ${APIFY_API_TOKEN}`,
        },
      },
    },
    {
      name: 'Method 2: Token as Query Parameter',
      url: `https://api.apify.com/v2/user?token=${APIFY_API_TOKEN}`,
      options: {},
    },
    {
      name: 'Method 3: Token in Header (non-Bearer)',
      url: 'https://api.apify.com/v2/user',
      options: {
        headers: {
          'Authorization': APIFY_API_TOKEN,
        },
      },
    },
  ];
  
  for (const method of methods) {
    console.log(`Testing: ${method.name}`);
    console.log(`   URL: ${method.url.replace(APIFY_API_TOKEN, '***TOKEN***')}`);
    
    try {
      const response = await fetch(method.url, method.options);
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS!`);
        console.log(`   User: ${data.data?.username || data.data?.email || 'N/A'}`);
        console.log(`   \n   👉 This is the correct method!\n`);
        return true;
      } else {
        const text = await response.text();
        console.log(`   ❌ Failed: ${text.substring(0, 100)}...\n`);
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  
  console.log('\n❌ All methods failed!');
  console.log('\n📋 Please verify:');
  console.log('   1. Your API token is correct (check https://console.apify.com/account/integrations)');
  console.log('   2. Your Apify account is active');
  console.log('   3. You have API access enabled\n');
  
  return false;
}

testMethods();

