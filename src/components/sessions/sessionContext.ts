import { createContext, useContext } from 'solid-js';
import type { SessionStore } from '@/state/sessionStore';

export const SessionContext = createContext<SessionStore | undefined>();

export const useSessionStore = (): SessionStore | undefined => useContext(SessionContext);
