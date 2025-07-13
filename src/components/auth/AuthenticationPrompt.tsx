import { Show } from 'solid-js';
import { AuthenticationPromptProps } from '../../types/auth';

const defaultBackgroundColor = '#ffffff';
const defaultTextColor = '#303235';
const defaultButtonColor = '#3B81F6';
const defaultButtonTextColor = '#ffffff';

export const AuthenticationPrompt = (props: AuthenticationPromptProps) => {
  const {
    onLogin,
    onSkip,
    title = 'Authentication Required',
    message = 'This chat requires authentication. Would you like to log in to continue?',
    loginButtonText = 'Log In',
    skipButtonText = 'Continue as Guest',
    backgroundColor = defaultBackgroundColor,
    textColor = defaultTextColor,
    buttonColor = defaultButtonColor,
    buttonTextColor = defaultButtonTextColor,
  } = props;

  return (
    <div
      class="w-full h-full flex flex-col items-center justify-center px-4 py-8 rounded-lg"
      style={{
        'font-family': 'Poppins, sans-serif',
        background: backgroundColor,
        color: textColor,
      }}
    >
      <div class="w-full max-w-md bg-white shadow-lg rounded-lg overflow-hidden">
        <div class="p-6 text-center">
          {/* Icon */}
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg
              class="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          {/* Title */}
          <h3 class="text-lg font-medium mb-2" style={{ color: textColor }}>
            {title}
          </h3>

          {/* Message */}
          <p class="text-sm mb-6" style={{ color: textColor, opacity: 0.8 }}>
            {message}
          </p>

          {/* Buttons */}
          <div class="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            <button
              onClick={onLogin}
              class="flex-1 py-2 px-4 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 ease-in-out hover:opacity-90"
              style={{
                'background-color': buttonColor,
                color: buttonTextColor,
              }}
            >
              {loginButtonText}
            </button>
            <button
              onClick={onSkip}
              class="flex-1 py-2 px-4 text-sm font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 ease-in-out hover:bg-gray-50"
              style={{
                'border-color': '#d1d5db',
                color: textColor,
              }}
            >
              {skipButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Loading component for authentication state
 */
export const AuthenticationLoading = (props: {
  backgroundColor?: string;
  textColor?: string;
  message?: string;
}) => {
  const {
    backgroundColor = defaultBackgroundColor,
    textColor = defaultTextColor,
    message = 'Checking authentication...',
  } = props;

  return (
    <div
      class="w-full h-full flex flex-col items-center justify-center px-4 py-8 rounded-lg"
      style={{
        'font-family': 'Poppins, sans-serif',
        background: backgroundColor,
        color: textColor,
      }}
    >
      <div class="text-center">
        {/* Loading spinner */}
        <div class="mx-auto mb-4">
          <svg
            class="animate-spin h-8 w-8 mx-auto"
            style={{ color: defaultButtonColor }}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        {/* Message */}
        <p class="text-sm" style={{ color: textColor, opacity: 0.8 }}>
          {message}
        </p>
      </div>
    </div>
  );
};

/**
 * Error component for authentication failures
 */
export const AuthenticationError = (props: {
  error: string;
  onRetry?: () => void;
  onSkip?: () => void;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
}) => {
  const {
    error,
    onRetry,
    onSkip,
    backgroundColor = defaultBackgroundColor,
    textColor = defaultTextColor,
    buttonColor = defaultButtonColor,
    buttonTextColor = defaultButtonTextColor,
  } = props;

  return (
    <div
      class="w-full h-full flex flex-col items-center justify-center px-4 py-8 rounded-lg"
      style={{
        'font-family': 'Poppins, sans-serif',
        background: backgroundColor,
        color: textColor,
      }}
    >
      <div class="w-full max-w-md bg-white shadow-lg rounded-lg overflow-hidden">
        <div class="p-6 text-center">
          {/* Error Icon */}
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              class="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Title */}
          <h3 class="text-lg font-medium mb-2" style={{ color: textColor }}>
            Authentication Error
          </h3>

          {/* Error Message */}
          <p class="text-sm mb-6" style={{ color: textColor, opacity: 0.8 }}>
            {error}
          </p>

          {/* Buttons */}
          <div class="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            <Show when={onRetry}>
              <button
                onClick={onRetry}
                class="flex-1 py-2 px-4 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 ease-in-out hover:opacity-90"
                style={{
                  'background-color': buttonColor,
                  color: buttonTextColor,
                }}
              >
                Try Again
              </button>
            </Show>
            <Show when={onSkip}>
              <button
                onClick={onSkip}
                class="flex-1 py-2 px-4 text-sm font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-300 ease-in-out hover:bg-gray-50"
                style={{
                  'border-color': '#d1d5db',
                  color: textColor,
                }}
              >
                Continue as Guest
              </button>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};