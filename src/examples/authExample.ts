/**
 * Example usage of OAuth/OIDC authentication in Flowise Chat Embed
 * 
 * This file demonstrates how to configure and use the authentication system
 * to check for valid tokens in the web cache.
 */

import { AuthenticationConfig, AuthConfig } from '../types/auth';
import { validateCachedTokens, getCachedTokens, storeCachedTokens } from '../utils/auth';

// Example OAuth configuration for a typical OIDC provider
const exampleOAuthConfig: AuthConfig = {
  clientId: 'your-client-id',
  authority: 'https://your-oidc-provider.com', // e.g., https://accounts.google.com, https://login.microsoftonline.com/tenant-id
  redirectUri: window.location.origin + '/callback',
  scope: 'openid profile email',
  responseType: 'code',
  prompt: 'select_account',
};

// Example authentication configuration
const exampleAuthConfig: AuthenticationConfig = {
  mode: 'optional', // 'required' | 'optional' | 'disabled'
  oauth: exampleOAuthConfig,
  promptConfig: {
    title: 'Sign In Required',
    message: 'Please sign in to access the full chat experience.',
    loginButtonText: 'Sign In',
    skipButtonText: 'Continue as Guest',
  },
  tokenStorageKey: 'flowise_oauth_tokens',
  autoRefresh: true,
  refreshThreshold: 300, // 5 minutes
};

/**
 * Example function to check for valid tokens
 */
export async function checkAuthenticationStatus(): Promise<{
  isAuthenticated: boolean;
  hasValidTokens: boolean;
  error?: string;
}> {
  try {
    console.log('🔍 Checking for cached tokens...');
    
    // Check if tokens exist in cache
    const tokens = getCachedTokens();
    if (!tokens) {
      console.log('❌ No tokens found in cache');
      return {
        isAuthenticated: false,
        hasValidTokens: false,
        error: 'No tokens found',
      };
    }

    console.log('✅ Tokens found in cache:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      hasIdToken: !!tokens.id_token,
      expiresAt: tokens.expires_at ? new Date(tokens.expires_at).toISOString() : 'unknown',
    });

    // Validate the tokens
    console.log('🔍 Validating tokens...');
    const validation = await validateCachedTokens(exampleOAuthConfig);
    
    if (validation.isValid) {
      console.log('✅ Tokens are valid and not expired');
      return {
        isAuthenticated: true,
        hasValidTokens: true,
      };
    } else {
      console.log('❌ Token validation failed:', validation.error);
      return {
        isAuthenticated: false,
        hasValidTokens: false,
        error: validation.error,
      };
    }
  } catch (error) {
    console.error('❌ Error checking authentication status:', error);
    return {
      isAuthenticated: false,
      hasValidTokens: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Example function to simulate storing tokens (for testing)
 */
export function simulateTokenStorage(): void {
  console.log('🧪 Simulating token storage for testing...');
  
  const mockTokens = {
    access_token: 'mock_access_token_' + Date.now(),
    token_type: 'Bearer',
    expires_in: 3600,
    expires_at: Date.now() + 3600 * 1000, // 1 hour from now
    refresh_token: 'mock_refresh_token_' + Date.now(),
    id_token: 'mock_id_token_' + Date.now(),
    scope: 'openid profile email',
  };

  storeCachedTokens(mockTokens);
  console.log('✅ Mock tokens stored successfully');
}

/**
 * Example function to test the complete authentication flow
 */
export async function testAuthenticationFlow(): Promise<void> {
  console.log('🚀 Starting authentication flow test...');
  
  // Step 1: Check initial state (should be no tokens)
  console.log('\n📋 Step 1: Check initial authentication state');
  let status = await checkAuthenticationStatus();
  console.log('Initial status:', status);
  
  // Step 2: Simulate storing tokens
  console.log('\n📋 Step 2: Simulate token storage');
  simulateTokenStorage();
  
  // Step 3: Check authentication status again
  console.log('\n📋 Step 3: Check authentication status after token storage');
  status = await checkAuthenticationStatus();
  console.log('Status after token storage:', status);
  
  // Step 4: Test token expiration
  console.log('\n📋 Step 4: Test expired tokens');
  const expiredTokens = {
    access_token: 'expired_access_token',
    token_type: 'Bearer',
    expires_in: 3600,
    expires_at: Date.now() - 1000, // 1 second ago (expired)
    refresh_token: 'expired_refresh_token',
    scope: 'openid profile email',
  };
  
  storeCachedTokens(expiredTokens);
  console.log('✅ Expired tokens stored for testing');
  
  status = await checkAuthenticationStatus();
  console.log('Status with expired tokens:', status);
  
  console.log('\n✅ Authentication flow test completed!');
}

// Export the configuration for use in components
export { exampleAuthConfig };

// Example usage in a chat component:
/*
import { exampleAuthConfig } from './examples/authExample';

// In your component:
<Bot
  chatflowid="your-chatflow-id"
  apiHost="https://your-flowise-api.com"
  authentication={exampleAuthConfig}
  // ... other props
/>
*/