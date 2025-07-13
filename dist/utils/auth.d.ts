import { OAuthTokens, TokenValidationResult, AuthConfig, OIDCUserInfo } from '../types/auth';
/**
 * Storage keys for different token storage methods
 */
export declare const STORAGE_KEYS: {
    readonly TOKENS: "flowise_oauth_tokens";
    readonly USER_INFO: "flowise_user_info";
    readonly AUTH_STATE: "flowise_auth_state";
};
/**
 * Validates OAuth tokens stored in browser cache using oauth4webapi
 */
export declare const validateCachedTokens: (authConfig: AuthConfig, storageKey?: string) => Promise<TokenValidationResult>;
/**
 * Retrieves cached OAuth tokens from browser storage
 */
export declare const getCachedTokens: (storageKey?: string) => OAuthTokens | null;
/**
 * Stores OAuth tokens in browser cache
 */
export declare const storeCachedTokens: (tokens: OAuthTokens, storageKey?: string, useSessionStorage?: boolean) => void;
/**
 * Removes cached OAuth tokens from all storage locations
 */
export declare const removeCachedTokens: (storageKey?: string) => void;
/**
 * Checks if tokens need refresh based on threshold
 */
export declare const shouldRefreshTokens: (tokens: OAuthTokens, refreshThreshold?: number) => boolean;
/**
 * Builds OAuth authorization URL using oauth4webapi
 */
export declare const buildAuthorizationUrl: (config: AuthConfig) => Promise<string>;
/**
 * Exchanges authorization code for tokens using oauth4webapi
 */
export declare const exchangeCodeForTokens: (config: AuthConfig, code: string, state: string) => Promise<OAuthTokens>;
/**
 * Refreshes access token using refresh token
 */
export declare const refreshAccessToken: (config: AuthConfig, refreshToken: string) => Promise<OAuthTokens>;
/**
 * Gets user info using access token
 */
export declare const getUserInfo: (config: AuthConfig, accessToken: string) => Promise<OIDCUserInfo>;
/**
 * Validates OAuth state parameter
 */
export declare const validateOAuthState: (receivedState: string) => boolean;
/**
 * Initiates OAuth logout
 */
export declare const initiateLogout: (config: AuthConfig, idToken?: string, postLogoutRedirectUri?: string) => Promise<string>;
//# sourceMappingURL=auth.d.ts.map