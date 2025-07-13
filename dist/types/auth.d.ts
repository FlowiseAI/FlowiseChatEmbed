/**
 * OAuth/OIDC Authentication Types
 */
export interface OAuthTokens {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    token_type: string;
    expires_in: number;
    expires_at: number;
    scope?: string;
}
export interface OIDCUserInfo {
    sub: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    email?: string;
    email_verified?: boolean;
    picture?: string;
    preferred_username?: string;
}
export interface AuthConfig {
    clientId: string;
    authority: string;
    redirectUri: string;
    scope?: string;
    responseType?: string;
    prompt?: string;
    maxAge?: number;
    uiLocales?: string;
    acrValues?: string;
}
export interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user?: OIDCUserInfo;
    tokens?: OAuthTokens;
    error?: string;
}
export interface TokenValidationResult {
    isValid: boolean;
    isExpired: boolean;
    expiresAt?: number;
    error?: string;
}
export interface AuthenticationPromptProps {
    onLogin: () => void;
    onSkip: () => void;
    title?: string;
    message?: string;
    loginButtonText?: string;
    skipButtonText?: string;
    backgroundColor?: string;
    textColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
}
export type AuthenticationMode = 'required' | 'optional' | 'disabled';
export interface AuthenticationConfig {
    mode: AuthenticationMode;
    oauth: AuthConfig;
    promptConfig?: Partial<AuthenticationPromptProps>;
    tokenStorageKey?: string;
    autoRefresh?: boolean;
    refreshThreshold?: number;
}
//# sourceMappingURL=auth.d.ts.map