import type { MessageType } from '@/components/Bot';
export type LeadCaptureData = Record<string, unknown>;
export type SessionV2 = {
    chatId: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    starred?: boolean;
};
export type ChatflowIndexV2 = {
    version: 2;
    activeChatId: string;
    sessions: SessionV2[];
    lead?: LeadCaptureData;
};
export declare const readIndex: (chatflowid: string) => ChatflowIndexV2 | null;
export declare const readMessages: (chatflowid: string, chatId: string) => MessageType[];
export declare const readPanelCollapsed: (chatflowid: string) => boolean;
export declare const readCapWarned: (chatflowid: string) => boolean;
export declare const _internalKeys: {
    indexKey: (chatflowid: string) => string;
    msgKey: (chatflowid: string, chatId: string) => string;
    capWarnedKey: (chatflowid: string) => string;
    panelCollapsedKey: (chatflowid: string) => string;
};
export declare class StorageQuotaError extends Error {
    constructor();
}
export declare const writeIndex: (chatflowid: string, index: ChatflowIndexV2) => void;
export declare const writeMessages: (chatflowid: string, chatId: string, messages: MessageType[]) => void;
export declare const removeMessages: (chatflowid: string, chatId: string) => void;
export declare const writePanelCollapsed: (chatflowid: string, collapsed: boolean) => void;
export declare const writeCapWarned: (chatflowid: string) => void;
/**
 * Reconcile MsgKey orphans against an Index.
 * - Returns chatIds whose MsgKey was deleted (orphans, not in index).
 * - Returns chatIds in index that have no MsgKey (caller should seed empty).
 */
export declare const reconcileOrphans: (chatflowid: string, index: ChatflowIndexV2) => {
    deletedOrphans: string[];
    missingMsgKeys: string[];
};
//# sourceMappingURL=sessionStorage.d.ts.map