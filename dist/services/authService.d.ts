import { AuthState, AuthenticationConfig, OAuthTokens, OIDCUserInfo } from '../types/auth';
/**
 * Authentication Service for managing OAuth/OIDC authentication state
 */
export declare class AuthService {
    private config;
    private authState;
    private setAuthState;
    constructor(config: AuthenticationConfig);
    /**
     * Get current authentication state
     */
    getAuthState: () => AuthState;
    /**
     * Initialize authentication by checking for cached tokens
     */
    private initializeAuth;
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Check if authentication is required based on configuration
     */
    isAuthRequired(): boolean;
    /**
     * Check if authentication is optional
     */
    isAuthOptional(): boolean;
    /**
     * Check if authentication is disabled
     */
    isAuthDisabled(): boolean;
    /**
     * Get current user information
     */
    getCurrentUser(): OIDCUserInfo | undefined;
    /**
     * Get current tokens
     */
    getCurrentTokens(): OAuthTokens | undefined;
    /**
     * Initiate OAuth login flow
     */
    login(): Promise<void>;
    /**
     * Handle OAuth callback (call this when the user returns from OAuth provider)
     */
    handleCallback(code: string, state: string): Promise<boolean>;
    /**
     * Logout user
     */
    logout(postLogoutRedirectUri?: string): Promise<void>;
    /**
     * Manually refresh tokens
     */
    refreshTokens(): Promise<boolean>;
    /**
     * Set up automatic token refresh
     */
    private setupAutoRefresh;
    /**
     * Get access token for API requests
     */
    getAccessToken(): string | undefined;
    /**
     * Check if tokens need refresh
     */
    needsTokenRefresh(): boolean;
    /**
     * Clear authentication state and cached tokens
     */
    clearAuth(): void;
}
export declare const createAuthService: (config: AuthenticationConfig) => AuthService;
export declare const getAuthService: () => AuthService | null;
//# sourceMappingURL=authService.d.ts.map