import { AuthenticationPromptProps } from '../../types/auth';
export declare const AuthenticationPrompt: (props: AuthenticationPromptProps) => import("solid-js").JSX.Element;
/**
 * Loading component for authentication state
 */
export declare const AuthenticationLoading: (props: {
    backgroundColor?: string;
    textColor?: string;
    message?: string;
}) => import("solid-js").JSX.Element;
/**
 * Error component for authentication failures
 */
export declare const AuthenticationError: (props: {
    error: string;
    onRetry?: () => void;
    onSkip?: () => void;
    backgroundColor?: string;
    textColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
}) => import("solid-js").JSX.Element;
//# sourceMappingURL=AuthenticationPrompt.d.ts.map