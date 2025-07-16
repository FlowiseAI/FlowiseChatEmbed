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

/**
 * Authentication Service for managing OAuth/OIDC authentication state
 */
export class AuthService {
  private config: AuthenticationConfig;
  private authState: () => AuthState;
  private setAuthState: (value: AuthState | ((prev: AuthState) => AuthState)) => void;

  constructor(config: AuthenticationConfig) {
    this.config = config;
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

    this.setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
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
   * Initiate OAuth login flow
   */
  public async login(): Promise<void> {
    try {
      this.setAuthState(prev => ({ ...prev, isLoading: true, error: undefined }));
      
      // Create a modified OAuth config with centralized callback URL
      // Detect environment based on hostname for browser compatibility
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const callbackServerUrl = isDevelopment
        ? 'http://localhost:3005/oauth-callback.html'  // Integrated proxy server for development
        : 'https://your-proxy-server.com/oauth-callback.html'; // Production proxy server
        
      console.log('Using callback server URL:', callbackServerUrl);
      
      const popupConfig = {
        ...this.config.oauth,
        redirectUri: callbackServerUrl
      };
      
      const authUrl = await buildAuthorizationUrl(popupConfig);
      console.log('Opening OAuth popup to:', authUrl);
      
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
        console.log('Received message from popup:', event);
        console.log('Message origin:', event.origin);
        console.log('Message data:', event.data);
        
        // Verify origin for security - should be from the callback server
        const callbackOrigin = new URL(callbackServerUrl).origin;
        console.log('Expected callback server origin:', callbackOrigin);
        
        if (event.origin !== callbackOrigin) {
          console.warn('Message origin mismatch - ignoring message. Expected:', callbackOrigin, 'Got:', event.origin);
          return;
        }
        
        console.log('Origin validation passed, processing message...');

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
          console.log('Popup was closed');
          cleanup();
          // Check if authentication was successful by looking for tokens
          const tokens = getCachedTokens(this.config.tokenStorageKey);
          console.log('Tokens after popup closed:', tokens ? 'Found' : 'Not found');
          if (!tokens) {
            // No tokens found, user likely closed popup without completing auth
            console.log('Setting authentication cancelled error');
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
      removeCachedTokens(this.config.tokenStorageKey);
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
}

/**
 * Create a singleton auth service instance
 */
let authServiceInstance: AuthService | null = null;

export const createAuthService = (config: AuthenticationConfig): AuthService => {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService(config);
  }
  return authServiceInstance;
};

export const getAuthService = (): AuthService | null => {
  return authServiceInstance;
};