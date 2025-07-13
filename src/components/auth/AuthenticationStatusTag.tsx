import { Show } from 'solid-js';
import { AuthService } from '@/services/authService';

export type AuthenticationStatusTagProps = {
  authService?: AuthService | null;
};

export const AuthenticationStatusTag = (props: AuthenticationStatusTagProps) => {
  const getAuthStatus = () => {
    if (!props.authService || props.authService.isAuthDisabled()) {
      return null; // Don't show tag if auth is disabled
    }
    
    return props.authService.isAuthenticated();
  };

  const authStatus = getAuthStatus();

  return (
    <Show when={authStatus !== null}>
      <div
        class="px-2 py-1 text-xs font-bold rounded"
        style={{
          'background-color': authStatus ? 'white' : 'black',
          color: authStatus ? 'red' : 'white',
          'text-transform': 'uppercase',
          'font-size': '10px',
          'line-height': '1',
          'border-radius': '4px',
          'margin-left': '8px',
          'white-space': 'nowrap',
        }}
      >
        {authStatus ? 'AUTHENTICATED' : 'UNAUTHENTICATED'}
      </div>
    </Show>
  );
};