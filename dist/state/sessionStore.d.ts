import type { MessageType } from '@/components/Bot';
import { type ChatflowIndexV2, type SessionV2, type LeadCaptureData } from './sessionStorage';
export type SessionStoreOptions = {
    chatflowid: string;
    newChatId: () => string;
    maxSessions?: number;
};
export type SessionStore = ReturnType<typeof createSessionStore>;
export declare const createSessionStore: (opts: SessionStoreOptions) => {
    chatflowid: string;
    maxSessions: number;
    sessions: import("solid-js").Accessor<SessionV2[]>;
    starredSessions: import("solid-js").Accessor<SessionV2[]>;
    recentSessions: import("solid-js").Accessor<SessionV2[]>;
    activeChatId: import("solid-js").Accessor<string>;
    activeSession: import("solid-js").Accessor<SessionV2 | undefined>;
    activeMessages: import("solid-js").Accessor<MessageType[]>;
    lead: import("solid-js").Accessor<LeadCaptureData | undefined>;
    capWarning: import("solid-js").Accessor<boolean>;
    dispose: () => void;
    actions: {
        newChat: () => string;
        switchSession: (chatId: string) => void;
        upsertMessage: (msg: MessageType, options?: {
            replaceId?: string;
        }) => void;
        upsertMessageInSession: (chatId: string, msg: MessageType, options?: {
            replaceId?: string;
        }) => void;
        removeMessageById: (messageId: string) => void;
        removeMessageByIdInSession: (chatId: string, messageId: string) => void;
        replaceActiveMessages: (next: MessageType[]) => void;
        getSessionMessages: (chatId: string) => MessageType[];
        renameSession: (chatId: string, rawTitle: string) => void;
        toggleStarred: (chatId: string) => void;
        deleteSession: (chatId: string) => void;
        setLead: (lead: LeadCaptureData | undefined) => void;
        flushPending: () => void;
        setQuotaPanicHandler: (cb: () => void) => void;
        setOnSessionChanged: (cb: ((detail: {
            chatId: string;
            title: string;
        }) => void) | null) => void;
        dismissCapWarning: () => false;
    };
    _internal: {
        index: import("solid-js").Accessor<ChatflowIndexV2>;
        setIndex: import("solid-js").Setter<ChatflowIndexV2>;
        messageCache: Map<string, MessageType[]>;
        setActiveMessages: import("solid-js").Setter<MessageType[]>;
        persistIndex: (next: ChatflowIndexV2) => void;
    };
};
//# sourceMappingURL=sessionStore.d.ts.map