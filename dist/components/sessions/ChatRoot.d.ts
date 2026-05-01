import { type BotProps } from '@/components/Bot';
import { type SessionStore } from '@/state/sessionStore';
export declare const useSessionStore: () => SessionStore | undefined;
type ChatRootProps = BotProps & {
    class?: string;
    theme?: unknown;
};
export declare const ChatRoot: (props: ChatRootProps) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=ChatRoot.d.ts.map