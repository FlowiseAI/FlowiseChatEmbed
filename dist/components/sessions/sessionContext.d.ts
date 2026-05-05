import type { SessionStore } from '@/state/sessionStore';
export declare const SessionContext: import("solid-js").Context<{
    chatflowid: string;
    maxSessions: number;
    sessions: import("solid-js").Accessor<import("../../state/sessionStorage").SessionV2[]>;
    starredSessions: import("solid-js").Accessor<import("../../state/sessionStorage").SessionV2[]>;
    recentSessions: import("solid-js").Accessor<import("../../state/sessionStorage").SessionV2[]>;
    activeChatId: import("solid-js").Accessor<string>;
    activeSession: import("solid-js").Accessor<import("../../state/sessionStorage").SessionV2 | undefined>;
    activeMessages: import("solid-js").Accessor<import("../Bot").MessageType[]>;
    lead: import("solid-js").Accessor<import("../../state/sessionStorage").LeadCaptureData | undefined>;
    capWarning: import("solid-js").Accessor<boolean>;
    quotaPanic: import("solid-js").Accessor<boolean>;
    dispose: () => void;
    actions: {
        newChat: () => string;
        switchSession: (chatId: string) => void;
        upsertMessage: (msg: import("../Bot").MessageType, options?: {
            replaceId?: string | undefined;
        } | undefined) => void;
        upsertMessageInSession: (chatId: string, msg: import("../Bot").MessageType, options?: {
            replaceId?: string | undefined;
        } | undefined) => void;
        removeMessageById: (messageId: string) => void;
        removeMessageByIdInSession: (chatId: string, messageId: string) => void;
        replaceActiveMessages: (next: import("../Bot").MessageType[]) => void;
        getSessionMessages: (chatId: string) => import("../Bot").MessageType[];
        renameSession: (chatId: string, rawTitle: string) => void;
        toggleStarred: (chatId: string) => void;
        deleteSession: (chatId: string) => void;
        setLead: (lead: import("../../state/sessionStorage").LeadCaptureData | undefined) => void;
        flushPending: () => void;
        setOnSessionChanged: (cb: ((detail: {
            chatId: string;
            title: string;
        }) => void) | null) => void;
        setStreamingChatIdGetter: (fn: (() => string | undefined) | null) => void;
        dismissCapWarning: () => false;
        dismissQuotaPanic: () => false;
    };
    _internal: {
        index: import("solid-js").Accessor<import("../../state/sessionStorage").ChatflowIndexV2>;
        setIndex: import("solid-js").Setter<import("../../state/sessionStorage").ChatflowIndexV2>;
        messageCache: Map<string, import("../Bot").MessageType[]>;
        setActiveMessages: import("solid-js").Setter<import("../Bot").MessageType[]>;
        persistIndex: (next: import("../../state/sessionStorage").ChatflowIndexV2) => void;
    };
} | undefined>;
export declare const useSessionStore: () => SessionStore | undefined;
//# sourceMappingURL=sessionContext.d.ts.map