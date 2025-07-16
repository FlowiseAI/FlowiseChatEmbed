#!/usr/bin/env node

/**
 * Test script for server-side authentication configuration
 * Run this to verify the OAuth config endpoint is working correctly
 */

const https = require('https');
const http = require('http');

// Test configuration
const TEST_CONFIG = {
  apiHost: 'http://localhost:3001',
  apiKey: 'your-secure-oauth-api-key-here',
  chatflows: ['chatflow_1', 'support_bot', 'public_bot', 'nonexistent_chatflow']
};

/**
 * Make HTTP request to test OAuth config endpoint
 */
function testOAuthConfig(chatflowId) {
  return new Promise((resolve, reject) => {
    const url = `${TEST_CONFIG.apiHost}/api/auth/config/${chatflowId}`;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'x-oauth-api-key': TEST_CONFIG.apiKey,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Test invalid API key
 */
function testInvalidApiKey(chatflowId) {
  return new Promise((resolve, reject) => {
    const url = `${TEST_CONFIG.apiHost}/api/auth/config/${chatflowId}`;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'x-oauth-api-key': 'invalid-key',
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            body: data ? JSON.parse(data) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Testing Server-Side Authentication Configuration\n');
  console.log(`📡 API Host: ${TEST_CONFIG.apiHost}`);
  console.log(`🔑 API Key: ${TEST_CONFIG.apiKey}\n`);

  // Test 1: Valid chatflows with different modes
  console.log('📋 Test 1: Valid Chatflows');
  console.log('=' .repeat(50));
  
  for (const chatflowId of TEST_CONFIG.chatflows.slice(0, 3)) { // Skip nonexistent for now
    try {
      console.log(`\n🔍 Testing chatflow: ${chatflowId}`);
      const response = await testOAuthConfig(chatflowId);
      
      if (response.status === 200) {
        console.log(`✅ Status: ${response.status}`);
        console.log(`🎯 Mode: ${response.body.mode}`);
        console.log(`🔐 Client ID: ${response.body.oauth.clientId}`);
        console.log(`🏛️  Authority: ${response.body.oauth.authority}`);
        console.log(`📝 Token Storage: ${response.body.tokenStorageKey}`);
      } else {
        console.log(`❌ Status: ${response.status}`);
        console.log(`📄 Response: ${JSON.stringify(response.body, null, 2)}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  // Test 2: Nonexistent chatflow
  console.log('\n\n📋 Test 2: Nonexistent Chatflow');
  console.log('=' .repeat(50));
  
  try {
    console.log(`\n🔍 Testing nonexistent chatflow: nonexistent_chatflow`);
    const response = await testOAuthConfig('nonexistent_chatflow');
    
    if (response.status === 404) {
      console.log(`✅ Status: ${response.status} (Expected)`);
      console.log(`📄 Error: ${response.body.error}`);
    } else {
      console.log(`❌ Unexpected Status: ${response.status}`);
      console.log(`📄 Response: ${JSON.stringify(response.body, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 3: Invalid API key
  console.log('\n\n📋 Test 3: Invalid API Key');
  console.log('=' .repeat(50));
  
  try {
    console.log(`\n🔍 Testing with invalid API key`);
    const response = await testInvalidApiKey('chatflow_1');
    
    if (response.status === 401) {
      console.log(`✅ Status: ${response.status} (Expected)`);
      console.log(`📄 Error: ${response.body.error}`);
    } else {
      console.log(`❌ Unexpected Status: ${response.status}`);
      console.log(`📄 Response: ${JSON.stringify(response.body, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 4: No API key
  console.log('\n\n📋 Test 4: Missing API Key');
  console.log('=' .repeat(50));
  
  try {
    console.log(`\n🔍 Testing without API key`);
    // Modify the test to not include the API key header
    const url = `${TEST_CONFIG.apiHost}/api/auth/config/chatflow_1`;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // No x-oauth-api-key header
      }
    };

    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              body: data ? JSON.parse(data) : null
            });
          } catch (error) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    if (response.status === 401) {
      console.log(`✅ Status: ${response.status} (Expected)`);
      console.log(`📄 Error: ${response.body.error}`);
    } else {
      console.log(`❌ Unexpected Status: ${response.status}`);
      console.log(`📄 Response: ${JSON.stringify(response.body, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 5: Public chatbot config endpoint
  console.log('\n\n📋 Test 5: Public Chatbot Config');
  console.log('=' .repeat(50));
  
  try {
    console.log(`\n🔍 Testing public chatbot config: chatflow_1`);
    const url = `${TEST_CONFIG.apiHost}/api/v1/public-chatbotConfig/chatflow_1`;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // Note: This endpoint doesn't require OAuth API key
      }
    };

    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              body: data ? JSON.parse(data) : null
            });
          } catch (error) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    
    if (response.status === 200) {
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Config Keys: ${Object.keys(response.body || {}).join(', ')}`);
    } else {
      console.log(`❌ Status: ${response.status}`);
      console.log(`📄 Response: ${JSON.stringify(response.body, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('\n\n🎉 Testing Complete!');
  console.log('\n💡 Next Steps:');
  console.log('1. Start the proxy server: cd proxy-server && node server.js');
  console.log('2. Run this test: node test-server-auth-config.js');
  console.log('3. Test with a real chatbot client');
  console.log('4. The chatbot should now be able to fetch both OAuth config and chatbot config');
}

// Handle command line execution
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testOAuthConfig, testInvalidApiKey, runTests };