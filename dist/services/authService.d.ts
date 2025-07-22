import { AuthState, AuthenticationConfig, OAuthTokens, OIDCUserInfo } from '../types/auth';
/**
 * Authentication Service for managing OAuth/OIDC authentication state
 */
export declare class AuthService {
    private chatflowId;
    private config;
    private authState;
    private setAuthState;
    private apiHost;
    constructor(config: AuthenticationConfig, apiHost?: string, chatflowId?: string);
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
     * Check if this is web authentication
     */
    private isWebAuth;
    /**
     * Initiate OAuth login flow (supports both SPA and web authentication)
     */
    login(): Promise<void>;
    /**
     * Initiate web authentication flow
     */
    loginWeb(): Promise<void>;
    /**
     * Initiate SPA OAuth login flow (existing implementation)
     */
    loginSPA(): Promise<void>;
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
    /**
     * Generate a secure session ID for web authentication
     */
    private generateSessionId;
    /**
     * Extract identifier from API host URL
     */
    private getIdentifierFromApiHost;
    /**
     * Store session ID in browser storage
     */
    private storeSessionId;
    /**
     * Get stored session ID from browser storage
     */
    getStoredSessionId(): string | null;
    /**
     * Remove stored session ID
     */
    removeStoredSessionId(): void;
    /**
     * Exchange session ID for user info and tokens
     */
    private exchangeSession;
}
export declare const createAuthService: (config: AuthenticationConfig, apiHost?: string, chatflowId?: string) => AuthService;
export declare const getAuthService: () => AuthService | null;
//# sourceMappingURL=authService.d.ts.map