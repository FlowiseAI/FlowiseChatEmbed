import { createSignal, createEffect } from 'solid-js';
import { AuthState, AuthConfig, AuthenticationConfig, OAuthTokens, OIDCUserInfo } from '../types/auth';
import {
  validateCachedTokens,
  getCachedTokens,
  storeCachedTokens,
  removeCachedTokens,
  shouldRefreshTokens,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getUserInfo,
  validateOAuthState,
  initiateLogout,
  STORAGE_KEYS,
} from '../utils/auth';
import { debugLogger } from '../utils/debugLogger';

/**
 * Authentication Service for managing OAuth/OIDC authentication state
 */
export class AuthService {
  private config: AuthenticationConfig;
  private authState: () => AuthState;
  private setAuthState: (value: AuthState | ((prev: AuthState) => AuthState)) => void;
  private apiHost: string;

  constructor(config: AuthenticationConfig, apiHost: string = '', private chatflowId: string = '') {
    this.config = config;
    this.apiHost = apiHost;
    const [authState, setAuthState] = createSignal<AuthState>({
      isAuthenticated: false,
      isLoading: false,
    });
    this.authState = authState;
    this.setAuthState = setAuthState;
    this.initializeAuth();
  }

  /**
   * Get current authentication state
   */
  public getAuthState = () => this.authState();

  /**
   * Initialize authentication by checking for cached tokens
   */
  private async initializeAuth(): Promise<void> {
    if (this.config.mode === 'disabled') {
      return;
    }

    // If OAuth config is not available yet, set unauthenticated state
    if (!this.config.oauth) {
      this.setAuthState({
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }

    this.setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // For web authentication, check for stored session ID instead of tokens
      if (this.isWebAuth()) {
        const sessionId = this.getStoredSessionId();
        if (sessionId) {
          // Try to exchange session for user info
          const success = await this.exchangeSession(sessionId);
          if (success) {
            return; // Authentication successful
          } else {
            // Session invalid, remove it
            this.removeStoredSessionId();
          }
        }
        
        // No valid session, set unauthenticated state
        this.setAuthState({
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      // For SPA authentication, use existing token validation logic
      const tokens = getCachedTokens(this.config.tokenStorageKey);
      
      if (!tokens) {
        this.setAuthState({
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      // Validate cached tokens
      const validation = await validateCachedTokens(this.config.oauth, this.config.tokenStorageKey);
      
      if (!validation.isValid) {
        // Tokens are invalid, try to refresh if we have a refresh token
        if (tokens.refresh_token && !validation.isExpired) {
          try {
            const newTokens = await refreshAccessToken(this.config.oauth, tokens.refresh_token);
            storeCachedTokens(newTokens, this.config.tokenStorageKey);
            
            const userInfo = await getUserInfo(this.config.oauth, newTokens.access_token);
            
            // Debug: Log user information after token refresh
            debugLogger.log('🔄 User info retrieved after token refresh:', {
              displayName: userInfo.name,
              email: userInfo.email,
              username: userInfo.preferred_username
            });
            
            this.setAuthState({
              isAuthenticated: true,
              isLoading: false,
              tokens: newTokens,
              user: userInfo,
            });
            return;
          } catch (error) {
            console.warn('Token refresh failed:', error);
          }
        }
        
        // Clear invalid tokens
        removeCachedTokens(this.config.tokenStorageKey);
        this.setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: validation.error,
        });
        return;
      }

      // Tokens are valid, get user info
      try {
        const userInfo = await getUserInfo(this.config.oauth, tokens.access_token);
        
        // Debug: Log user information after initial authentication
        debugLogger.log('🔐 User info retrieved after initial authentication:', {
          displayName: userInfo.name,
          email: userInfo.email,
          username: userInfo.preferred_username
        });
        
        this.setAuthState({
          isAuthenticated: true,
          isLoading: false,
          tokens,
          user: userInfo,
        });

        // Set up auto-refresh if enabled
        if (this.config.autoRefresh && tokens.refresh_token) {
          this.setupAutoRefresh(tokens);
        }
      } catch (error) {
        console.error('Failed to get user info:', error);
        this.setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to get user information',
        });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      this.setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication initialization failed',
      });
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.authState().isAuthenticated;
  }

  /**
   * Check if authentication is required based on configuration
   */
  public isAuthRequired(): boolean {
    return this.config.mode === 'required';
  }

  /**
   * Check if authentication is optional
   */
  public isAuthOptional(): boolean {
    return this.config.mode === 'optional';
  }

  /**
   * Check if authentication is disabled
   */
  public isAuthDisabled(): boolean {
    return this.config.mode === 'disabled';
  }

  /**
   * Get current user information
   */
  public getCurrentUser(): OIDCUserInfo | undefined {
    return this.authState().user;
  }

  /**
   * Get current tokens
   */
  public getCurrentTokens(): OAuthTokens | undefined {
    return this.authState().tokens;
  }

  /**
   * Check if this is web authentication
   */
  private isWebAuth(): boolean {
    return this.config.oauth?.authType === 'web';
  }

  /**
   * Initiate OAuth login flow (supports both SPA and web authentication)
   */
  public async login(): Promise<void> {
    debugLogger.log('🔐 Login method called');
    debugLogger.log('🔐 OAuth config:', this.config.oauth);
    debugLogger.log('🔐 Auth type:', this.config.oauth?.authType);
    debugLogger.log('🔐 Is web auth:', this.isWebAuth());
    
    if (this.isWebAuth()) {
      debugLogger.log('🔐 Using web authentication');
      return this.loginWeb();
    } else {
      debugLogger.log('🔐 Using SPA authentication');
      return this.loginSPA();
    }
  }

  /**
   * Initiate web authentication flow
   */
  public async loginWeb(): Promise<void> {
    try {
      this.setAuthState(prev => ({ ...prev, isLoading: true, error: undefined }));
      
      // Generate session ID
      const sessionId = this.generateSessionId();
      
      // Call server to initiate web auth
      const response = await fetch(`${this.apiHost}/api/auth/login/${this.getIdentifierFromApiHost()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initiate web authentication');
      }
      
      const { authUrl, sessionId: returnedSessionId } = await response.json();
      
      // Store session ID
      this.storeSessionId(returnedSessionId);
      
      debugLogger.log('Opening web auth URL:', authUrl);
      
      // Open auth URL in popup
      const popup = window.open(
        authUrl,
        'web-auth-popup',
        'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
      );
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }
      
      // Listen for messages from popup
      const messageListener = async (event: MessageEvent) => {
        debugLogger.log('Received message from web auth popup:', event);
        
        if (event.data.type === 'web-auth-success') {
          cleanup();
          try {
            // Exchange session for user info
            const success = await this.exchangeSession(event.data.sessionId);
            if (!success) {
              this.setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Authentication failed during session exchange',
              }));
            }
          } catch (error) {
            console.error('Web auth session exchange failed:', error);
            this.setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Authentication failed',
            }));
          }
        }
      };
      
      // Monitor popup for manual closure
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          debugLogger.log('Web auth popup was closed');
          cleanup();
          // Check if authentication was successful
          const sessionId = this.getStoredSessionId();
          if (!sessionId) {
            this.setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: 'Authentication was cancelled',
            }));
          }
        }
      }, 1000);
      
      // Set a timeout
      const timeout = setTimeout(() => {
        cleanup();
        if (!popup.closed) {
          popup.close();
        }
        this.setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Authentication timed out',
        }));
      }, 300000); // 5 minutes timeout
      
      // Cleanup function
      const cleanup = () => {
        window.removeEventListener('message', messageListener);
        clearInterval(checkClosed);
        clearTimeout(timeout);
      };
      
      // Add message listener
      window.addEventListener('message', messageListener);
      
    } catch (error) {
      console.error('Web auth initiation failed:', error);
      this.setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Web authentication failed',
      }));
    }
  }

  /**
   * Initiate SPA OAuth login flow (existing implementation)
   */
  public async loginSPA(): Promise<void> {
    try {
      this.setAuthState(prev => ({ ...prev, isLoading: true, error: undefined }));
      
      // Check if OAuth config is available
      if (!this.config.oauth || !this.config.oauth.redirectUri) {
        throw new Error('OAuth configuration is missing or incomplete for SPA authentication');
      }
      
      // Use the redirectUri from the OAuth configuration
      const callbackServerUrl = this.config.oauth.redirectUri;
        
      debugLogger.log('Using callback server URL from config:', callbackServerUrl);
      
      const popupConfig = {
        ...this.config.oauth
      };
      
      const authUrl = await buildAuthorizationUrl(popupConfig);
      debugLogger.log('Opening OAuth popup to:', authUrl);
      
      // Open OAuth in popup window instead of full page redirect
      const popup = window.open(
        authUrl,
        'oauth-popup',
        'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      // Listen for messages from popup
      const messageListener = async (event: MessageEvent) => {
        debugLogger.log('Received message from popup:', event);
        debugLogger.log('Message origin:', event.origin);
        debugLogger.log('Message data:', event.data);
        
        // Verify origin for security - should be from the callback server
        const callbackOrigin = new URL(callbackServerUrl).origin;
        debugLogger.log('Expected callback server origin:', callbackOrigin);
        
        if (event.origin !== callbackOrigin) {
          console.warn('Message origin mismatch - ignoring message. Expected:', callbackOrigin, 'Got:', event.origin);
          return;
        }
        
        debugLogger.log('Origin validation passed, processing message...');

        if (event.data.type === 'oauth-callback') {
          // Handle OAuth callback with authorization code
          cleanup();
          try {
            const success = await this.handleCallback(event.data.code, event.data.state);
            if (!success) {
              this.setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Authentication failed during token exchange',
              }));
            }
            // If successful, handleCallback will update the auth state
          } catch (error) {
            console.error('OAuth callback handling failed:', error);
            this.setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Authentication failed',
            }));
          }
        } else if (event.data.type === 'oauth-error') {
          // Authentication failed
          cleanup();
          this.setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: event.data.errorDescription || event.data.error || 'Authentication failed',
          }));
        }
      };

      // Monitor popup for manual closure
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          debugLogger.log('Popup was closed');
          cleanup();
          // Check if authentication was successful by looking for tokens
          const tokens = getCachedTokens(this.config.tokenStorageKey);
          debugLogger.log('Tokens after popup closed:', tokens ? 'Found' : 'Not found');
          if (!tokens) {
            // No tokens found, user likely closed popup without completing auth
            debugLogger.log('Setting authentication cancelled error');
            this.setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: 'Authentication was cancelled',
            }));
          }
        }
      }, 1000);

      // Set a timeout to close popup if it takes too long
      const timeout = setTimeout(() => {
        cleanup();
        if (!popup.closed) {
          popup.close();
        }
        this.setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Authentication timed out',
        }));
      }, 300000); // 5 minutes timeout

      // Cleanup function
      const cleanup = () => {
        window.removeEventListener('message', messageListener);
        clearInterval(checkClosed);
        clearTimeout(timeout);
      };

      // Add message listener
      window.addEventListener('message', messageListener);

    } catch (error) {
      console.error('Login initiation failed:', error);
      this.setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
    }
  }

  /**
   * Handle OAuth callback (call this when the user returns from OAuth provider)
   */
  public async handleCallback(code: string, state: string): Promise<boolean> {
    try {
      this.setAuthState(prev => ({ ...prev, isLoading: true, error: undefined }));

      // Validate state parameter
      if (!validateOAuthState(state)) {
        throw new Error('Invalid state parameter');
      }

      // Exchange code for tokens
      // We need to pass the original CSRF token, not the encoded state
      const decodedState = atob(state);
      const [originalCsrfToken] = decodedState.split('|');
      const tokens = await exchangeCodeForTokens(this.config.oauth, code, originalCsrfToken);
      
      // Store tokens
      storeCachedTokens(tokens, this.config.tokenStorageKey);

      // Get user info
      const userInfo = await getUserInfo(this.config.oauth, tokens.access_token);

      // Debug: Log user information after OAuth callback
      debugLogger.log('✅ User info retrieved after OAuth callback:', {
        displayName: userInfo.name,
        email: userInfo.email,
        username: userInfo.preferred_username
      });

      this.setAuthState({
        isAuthenticated: true,
        isLoading: false,
        tokens,
        user: userInfo,
      });

      // Set up auto-refresh if enabled
      if (this.config.autoRefresh && tokens.refresh_token) {
        this.setupAutoRefresh(tokens);
      }

      return true;
    } catch (error) {
      console.error('OAuth callback handling failed:', error);
      this.setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
      return false;
    }
  }

  /**
   * Logout user
   */
  public async logout(postLogoutRedirectUri?: string): Promise<void> {
    try {
      if (this.isWebAuth()) {
        // For web authentication, just clear session and local state
        this.removeStoredSessionId();
        this.setAuthState({
          isAuthenticated: false,
          isLoading: false,
        });
        
        // Optionally redirect to a logout URL if provided
        if (postLogoutRedirectUri) {
          window.location.href = postLogoutRedirectUri;
        }
        return;
      }

      // For SPA authentication, use existing logout logic
      const tokens = this.authState().tokens;
      const logoutUrl = await initiateLogout(
        this.config.oauth,
        tokens?.id_token,
        postLogoutRedirectUri
      );

      // Clear local state
      this.setAuthState({
        isAuthenticated: false,
        isLoading: false,
      });

      // Redirect to logout URL if different from current location
      if (logoutUrl !== window.location.href) {
        window.location.href = logoutUrl;
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if logout URL generation fails
      if (this.isWebAuth()) {
        this.removeStoredSessionId();
      } else {
        removeCachedTokens(this.config.tokenStorageKey);
      }
      this.setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      });
    }
  }

  /**
   * Manually refresh tokens
   */
  public async refreshTokens(): Promise<boolean> {
    const tokens = this.authState().tokens;
    
    if (!tokens?.refresh_token) {
      return false;
    }

    try {
      const newTokens = await refreshAccessToken(this.config.oauth, tokens.refresh_token);
      storeCachedTokens(newTokens, this.config.tokenStorageKey);
      
      this.setAuthState(prev => ({
        ...prev,
        tokens: newTokens,
      }));

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      await this.logout();
      return false;
    }
  }

  /**
   * Set up automatic token refresh
   */
  private setupAutoRefresh(tokens: OAuthTokens): void {
    if (!tokens.refresh_token || !this.config.refreshThreshold) {
      return;
    }

    const checkInterval = Math.min(this.config.refreshThreshold * 1000 / 2, 60000); // Check every half the threshold or 1 minute, whichever is smaller

    const intervalId = setInterval(async () => {
      const currentTokens = this.authState().tokens;
      
      if (!currentTokens || !this.authState().isAuthenticated) {
        clearInterval(intervalId);
        return;
      }

      if (shouldRefreshTokens(currentTokens, this.config.refreshThreshold)) {
        const success = await this.refreshTokens();
        if (!success) {
          clearInterval(intervalId);
        }
      }
    }, checkInterval);

    // Clean up interval when component unmounts or user logs out
    createEffect(() => {
      if (!this.authState().isAuthenticated) {
        clearInterval(intervalId);
      }
    });
  }

  /**
   * Get access token for API requests
   */
  public getAccessToken(): string | undefined {
    // For web authentication, tokens are stored server-side
    if (this.isWebAuth()) {
      return undefined; // Web auth uses session ID instead
    }
    return this.authState().tokens?.access_token;
  }

  /**
   * Check if tokens need refresh
   */
  public needsTokenRefresh(): boolean {
    const tokens = this.authState().tokens;
    if (!tokens) return false;
    
    return shouldRefreshTokens(tokens, this.config.refreshThreshold || 300);
  }

  /**
   * Clear authentication state and cached tokens
   */
  public clearAuth(): void {
    removeCachedTokens(this.config.tokenStorageKey);
    this.setAuthState({
      isAuthenticated: false,
      isLoading: false,
    });
  }

  /**
   * Generate a secure session ID for web authentication
   */
  private generateSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Extract identifier from API host URL
   */
  private getIdentifierFromApiHost(): string {
    // Use the chatflowId passed to the constructor
    return this.chatflowId || 'chatflow3'; // Default for web auth example
  }

  /**
   * Store session ID in browser storage
   */
  private storeSessionId(sessionId: string): void {
    const storageKey = `${this.config.tokenStorageKey}_session`;
    localStorage.setItem(storageKey, sessionId);
  }

  /**
   * Get stored session ID from browser storage
   */
  public getStoredSessionId(): string | null {
    const storageKey = `${this.config.tokenStorageKey}_session`;
    return localStorage.getItem(storageKey);
  }

  /**
   * Remove stored session ID
   */
  public removeStoredSessionId(): void {
    const storageKey = `${this.config.tokenStorageKey}_session`;
    localStorage.removeItem(storageKey);
  }

  /**
   * Exchange session ID for user info and tokens
   */
  private async exchangeSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiHost}/api/auth/exchange/${this.getIdentifierFromApiHost()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 401) {
          // Session not found or expired - this is expected during initialization
          debugLogger.log('Session not found or expired during exchange');
          return false;
        }
        const error = await response.json();
        throw new Error(error.error || 'Session exchange failed');
      }

      const sessionData = await response.json();
      
      // Update auth state with session data
      this.setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: sessionData.userInfo,
        tokens: undefined, // Web auth doesn't expose tokens to frontend
      });

      debugLogger.log('✅ Web auth session exchange successful:', {
        sessionId: sessionData.sessionId,
        user: sessionData.userInfo?.email || sessionData.userInfo?.sub
      });

      return true;
    } catch (error) {
      debugLogger.log('Session exchange failed:', error instanceof Error ? error.message : 'Unknown error');
      this.removeStoredSessionId();
      return false;
    }
  }
}

/**
 * Create a singleton auth service instance
 */
let authServiceInstance: AuthService | null = null;

export const createAuthService = (config: AuthenticationConfig, apiHost: string = '', chatflowId: string = ''): AuthService => {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService(config, apiHost, chatflowId);
  }
  return authServiceInstance;
};

export const getAuthService = (): AuthService | null => {
  return authServiceInstance;
};