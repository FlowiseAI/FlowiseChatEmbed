import * as oauth from 'oauth4webapi';
import { OAuthTokens, TokenValidationResult, AuthConfig, OIDCUserInfo } from '../types/auth';
import { getCookie, setCookie } from './index';
import { debugLogger } from './debugLogger';

/**
 * Default storage key for OAuth tokens
 */
const DEFAULT_TOKEN_STORAGE_KEY = 'flowise_oauth_tokens';

/**
 * Storage keys for different token storage methods
 */
export const STORAGE_KEYS = {
  TOKENS: 'flowise_oauth_tokens',
  USER_INFO: 'flowise_user_info',
  AUTH_STATE: 'flowise_auth_state',
} as const;

/**
 * Validates OAuth tokens stored in browser cache using oauth4webapi
 */
export const validateCachedTokens = async (
  authConfig: AuthConfig,
  storageKey: string = DEFAULT_TOKEN_STORAGE_KEY
): Promise<TokenValidationResult> => {
  try {
    const tokens = getCachedTokens(storageKey);
    
    if (!tokens) {
      return {
        isValid: false,
        isExpired: false,
        error: 'No tokens found in cache',
      };
    }

    if (!tokens.access_token) {
      return {
        isValid: false,
        isExpired: false,
        error: 'No access token found',
      };
    }

    // Check if tokens have explicit expiration
    const currentTime = Date.now();
    if (tokens.expires_at && tokens.expires_at < currentTime) {
      return {
        isValid: false,
        isExpired: true,
        expiresAt: tokens.expires_at,
        error: 'Tokens have expired',
      };
    }

    // Use oauth4webapi to validate the access token
    try {
      // Get the authorization server configuration
      const as = await oauth.discoveryRequest(new URL(authConfig.authority))
        .then((response: Response) => oauth.processDiscoveryResponse(new URL(authConfig.authority), response));

      // Validate the access token by making a userinfo request
      const userInfoResponse = await oauth.userInfoRequest(as, { client_id: authConfig.clientId }, tokens.access_token);

      if (userInfoResponse.status !== 200) {
        return {
          isValid: false,
          isExpired: true,
          error: 'Access token is invalid or expired',
        };
      }

      return {
        isValid: true,
        isExpired: false,
        expiresAt: tokens.expires_at,
      };
    } catch (error) {
      console.warn('Token validation failed:', error);
      return {
        isValid: false,
        isExpired: true,
        error: 'Token validation failed',
      };
    }
  } catch (error) {
    console.error('Error validating cached tokens:', error);
    return {
      isValid: false,
      isExpired: false,
      error: `Token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Retrieves cached OAuth tokens from browser storage
 */
export const getCachedTokens = (storageKey: string = DEFAULT_TOKEN_STORAGE_KEY): OAuthTokens | null => {
  try {
    // Try localStorage first
    let tokensJson = localStorage.getItem(storageKey);
    
    // Fallback to sessionStorage
    if (!tokensJson) {
      tokensJson = sessionStorage.getItem(storageKey);
    }
    
    // Fallback to cookies
    if (!tokensJson) {
      tokensJson = getCookie(storageKey);
    }

    if (!tokensJson) {
      return null;
    }

    return JSON.parse(tokensJson);
  } catch (error) {
    console.error('Error retrieving cached tokens:', error);
    return null;
  }
};

/**
 * Stores OAuth tokens in browser cache
 */
export const storeCachedTokens = (
  tokens: OAuthTokens,
  storageKey: string = DEFAULT_TOKEN_STORAGE_KEY,
  useSessionStorage: boolean = false
): void => {
  try {
    const tokensJson = JSON.stringify(tokens);
    
    if (useSessionStorage) {
      sessionStorage.setItem(storageKey, tokensJson);
    } else {
      localStorage.setItem(storageKey, tokensJson);
      
      // Also store in cookies as fallback (with expiration)
      const expirationDays = tokens.expires_in ? Math.ceil(tokens.expires_in / (24 * 60 * 60)) : 1;
      setCookie(storageKey, tokensJson, expirationDays);
    }
  } catch (error) {
    console.error('Error storing cached tokens:', error);
  }
};

/**
 * Removes cached OAuth tokens from all storage locations
 */
export const removeCachedTokens = (storageKey: string = DEFAULT_TOKEN_STORAGE_KEY): void => {
  try {
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey);
    
    // Remove from cookies by setting expiration to past date
    setCookie(storageKey, '', -1);
  } catch (error) {
    console.error('Error removing cached tokens:', error);
  }
};

/**
 * Checks if tokens need refresh based on threshold
 */
export const shouldRefreshTokens = (
  tokens: OAuthTokens,
  refreshThreshold: number = 300 // 5 minutes default
): boolean => {
  if (!tokens.expires_at) {
    return false;
  }

  const currentTime = Date.now();
  const timeUntilExpiry = tokens.expires_at - currentTime;
  const thresholdMs = refreshThreshold * 1000;

  return timeUntilExpiry <= thresholdMs;
};

/**
 * Builds OAuth authorization URL using oauth4webapi
 */
export const buildAuthorizationUrl = async (config: AuthConfig): Promise<string> => {
  try {
    // Discover the authorization server configuration
    const as = await oauth.discoveryRequest(new URL(config.authority))
      .then((response: Response) => oauth.processDiscoveryResponse(new URL(config.authority), response));

    // Generate state and code verifier for PKCE
    const csrfToken = oauth.generateRandomState();
    const codeVerifier = oauth.generateRandomCodeVerifier();
    const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);

    // Encode the origin in the state parameter for secure callback communication
    // Format: base64(csrf_token|origin_url)
    const stateData = `${csrfToken}|${window.location.origin}`;
    const state = btoa(stateData);

    // Store CSRF token and code verifier for later validation
    sessionStorage.setItem('oauth_state', csrfToken);
    sessionStorage.setItem('oauth_code_verifier', codeVerifier);

    // Build authorization URL
    const authorizationUrl = new URL(as.authorization_endpoint!);
    authorizationUrl.searchParams.set('client_id', config.clientId);
    authorizationUrl.searchParams.set('redirect_uri', config.redirectUri);
    authorizationUrl.searchParams.set('response_type', config.responseType || 'code');
    authorizationUrl.searchParams.set('scope', config.scope || 'openid profile email');
    authorizationUrl.searchParams.set('state', state);
    authorizationUrl.searchParams.set('code_challenge', codeChallenge);
    authorizationUrl.searchParams.set('code_challenge_method', 'S256');

    if (config.prompt) {
      authorizationUrl.searchParams.set('prompt', config.prompt);
    }

    if (config.maxAge) {
      authorizationUrl.searchParams.set('max_age', config.maxAge.toString());
    }

    if (config.uiLocales) {
      authorizationUrl.searchParams.set('ui_locales', config.uiLocales);
    }

    if (config.acrValues) {
      authorizationUrl.searchParams.set('acr_values', config.acrValues);
    }

    return authorizationUrl.toString();
  } catch (error) {
    console.error('Error building authorization URL:', error);
    throw new Error(`Failed to build authorization URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Exchanges authorization code for tokens using oauth4webapi
 */
export const exchangeCodeForTokens = async (
  config: AuthConfig,
  code: string,
  state: string
): Promise<OAuthTokens> => {
  try {
    // Validate state
    const storedState = sessionStorage.getItem('oauth_state');
    if (!storedState || storedState !== state) {
      throw new Error('Invalid state parameter');
    }

    // Get stored code verifier
    const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    // Clean up stored values
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_code_verifier');

    // Exchange code for tokens directly with Microsoft (required for SPA client type)
    // Microsoft requires SPA tokens to be redeemed via cross-origin requests from the browser
    debugLogger.log('🔄 Exchanging code for tokens directly with Microsoft...');
    
    // Use the token endpoint directly (we know it from Microsoft Entra endpoints)
    // Remove /v2.0 from authority if present, then add the full oauth2/v2.0/token path
    const baseAuthority = config.authority.replace('/v2.0', '');
    const tokenEndpoint = `${baseAuthority}/oauth2/v2.0/token`;
    debugLogger.log('🎯 Token endpoint:', tokenEndpoint);

    // Prepare token exchange request
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code: code,
      code_verifier: codeVerifier,
      redirect_uri: config.redirectUri
    });

    debugLogger.log('🚀 Exchanging code for tokens...');
    
    // Exchange code for tokens
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenParams.toString()
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Token exchange failed:', result);
      throw new Error(`Token exchange failed: ${result.error} - ${result.error_description}`);
    }

    debugLogger.log('✅ Token exchange successful');
    debugLogger.log('📊 Token response:', {
      access_token: result.access_token ? `${result.access_token.substring(0, 20)}...` : 'none',
      id_token: result.id_token ? `${result.id_token.substring(0, 20)}...` : 'none',
      token_type: result.token_type,
      expires_in: result.expires_in
    });

    // Convert to our token format
    const tokens: OAuthTokens = {
      access_token: result.access_token,
      token_type: result.token_type,
      expires_in: result.expires_in || 3600,
      expires_at: Date.now() + (result.expires_in || 3600) * 1000,
    };

    if (result.refresh_token) {
      tokens.refresh_token = result.refresh_token;
    }

    if (result.id_token) {
      tokens.id_token = result.id_token;
    }

    if (result.scope) {
      tokens.scope = result.scope;
    }

    return tokens;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw new Error(`Token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Refreshes access token using refresh token
 */
export const refreshAccessToken = async (
  config: AuthConfig,
  refreshToken: string
): Promise<OAuthTokens> => {
  try {
    // Discover the authorization server configuration
    const as = await oauth.discoveryRequest(new URL(config.authority))
      .then((response: Response) => oauth.processDiscoveryResponse(new URL(config.authority), response));

    // Refresh the token
    const response = await oauth.refreshTokenGrantRequest(
      as,
      { client_id: config.clientId },
      refreshToken
    );

    const result = await oauth.processRefreshTokenResponse(as, { client_id: config.clientId }, response);

    if (oauth.isOAuth2Error(result)) {
      throw new Error(`OAuth error: ${result.error} - ${result.error_description}`);
    }

    // Convert to our token format
    const tokens: OAuthTokens = {
      access_token: result.access_token,
      token_type: result.token_type,
      expires_in: result.expires_in || 3600,
      expires_at: Date.now() + (result.expires_in || 3600) * 1000,
    };

    if (result.refresh_token) {
      tokens.refresh_token = result.refresh_token;
    }

    if (result.scope) {
      tokens.scope = result.scope;
    }

    return tokens;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Gets user info using access token
 */
export const getUserInfo = async (
  config: AuthConfig,
  accessToken: string
): Promise<OIDCUserInfo> => {
  try {
    // Discover the authorization server configuration
    const as = await oauth.discoveryRequest(new URL(config.authority))
      .then((response: Response) => oauth.processDiscoveryResponse(new URL(config.authority), response));

    // Get user info
    const response = await oauth.userInfoRequest(as, { client_id: config.clientId }, accessToken);

    if (response.status !== 200) {
      throw new Error(`UserInfo request failed with status: ${response.status}`);
    }

    const userInfo = await response.json();
    
    // Debug: Log user information retrieved from OAuth provider
    debugLogger.log('👤 User info retrieved from OAuth provider:', {
      displayName: userInfo.name,
      email: userInfo.email,
      username: userInfo.preferred_username,
      sub: userInfo.sub
    });
    
    return userInfo as OIDCUserInfo;
  } catch (error) {
    console.error('Error getting user info:', error);
    throw new Error(`UserInfo request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Validates OAuth state parameter
 */
export const validateOAuthState = (receivedState: string): boolean => {
  const storedCsrfToken = sessionStorage.getItem('oauth_state');
  
  debugLogger.log('Validating OAuth state...');
  debugLogger.log('Stored CSRF token:', storedCsrfToken);
  debugLogger.log('Received state:', receivedState);
  
  if (!storedCsrfToken) {
    console.error('No stored CSRF token found');
    return false;
  }
  
  try {
    // Decode the received state to extract the CSRF token
    // Format: base64(csrf_token|origin_url)
    const decodedState = atob(receivedState);
    debugLogger.log('Decoded state:', decodedState);
    const [receivedCsrfToken] = decodedState.split('|');
    debugLogger.log('Received CSRF token:', receivedCsrfToken);
    
    const isValid = storedCsrfToken === receivedCsrfToken;
    debugLogger.log('State validation result:', isValid);
    
    return isValid;
  } catch (error) {
    console.error('Failed to decode state parameter:', error);
    return false;
  }
};

/**
 * Initiates OAuth logout
 */
export const initiateLogout = async (
  config: AuthConfig,
  idToken?: string,
  postLogoutRedirectUri?: string
): Promise<string> => {
  try {
    // Discover the authorization server configuration
    const as = await oauth.discoveryRequest(new URL(config.authority))
      .then((response: Response) => oauth.processDiscoveryResponse(new URL(config.authority), response));

    if (!as.end_session_endpoint) {
      // If no logout endpoint, just clear local tokens
      removeCachedTokens();
      return postLogoutRedirectUri || config.redirectUri;
    }

    // Build logout URL
    const logoutUrl = new URL(as.end_session_endpoint);
    
    if (idToken) {
      logoutUrl.searchParams.set('id_token_hint', idToken);
    }
    
    if (postLogoutRedirectUri) {
      logoutUrl.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
    }

    // Clear local tokens
    removeCachedTokens();

    return logoutUrl.toString();
  } catch (error) {
    console.error('Error initiating logout:', error);
    // Fallback: just clear local tokens
    removeCachedTokens();
    return postLogoutRedirectUri || config.redirectUri;
  }
};