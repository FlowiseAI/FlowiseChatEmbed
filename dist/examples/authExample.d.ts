/**
 * Example usage of OAuth/OIDC authentication in Flowise Chat Embed
 *
 * This file demonstrates how to configure and use the authentication system
 * to check for valid tokens in the web cache.
 */
import { AuthenticationConfig } from '../types/auth';
declare const exampleAuthConfig: AuthenticationConfig;
/**
 * Example function to check for valid tokens
 */
export declare function checkAuthenticationStatus(): Promise<{
    isAuthenticated: boolean;
    hasValidTokens: boolean;
    error?: string;
}>;
/**
 * Example function to simulate storing tokens (for testing)
 */
export declare function simulateTokenStorage(): void;
/**
 * Example function to test the complete authentication flow
 */
export declare function testAuthenticationFlow(): Promise<void>;
export { exampleAuthConfig };
//# sourceMappingURL=authExample.d.ts.map