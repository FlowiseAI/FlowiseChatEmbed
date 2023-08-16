import { messageType } from '@/components/Bot';
export type NewChatMessageInput = {
    chatType: 'external';
    role: messageType;
    content: string;
    chatflowid: string;
    sourceDocuments?: string;
    chatId?: string;
};
export type PostChatMessageRequest = {
    chatflowid: string;
    apiHost?: string;
    body?: NewChatMessageInput;
};
export type ChatMessageRequest = {
    chatflowid: string;
    apiHost?: string;
    chatId?: string;
};
export type PutChatMessageInput = {
    chatflowId: string;
    chatId?: string;
    sessionId: string;
};
export type PutChatMessageRequest = {
    apiHost?: string;
    body?: PutChatMessageInput;
};
export declare const createNewChatMessageQuery: ({ chatflowid, apiHost, body }: PostChatMessageRequest) => Promise<{
    data?: any;
    error?: Error | undefined;
}>;
export declare const getChatMessageQuery: ({ chatflowid, apiHost, chatId }: ChatMessageRequest) => Promise<{
    data?: any;
    error?: Error | undefined;
}>;
export declare const updateChatMessageQuery: ({ apiHost, body }: PutChatMessageRequest) => Promise<{
    data?: any;
    error?: Error | undefined;
}>;
export declare const deleteChatMessageQuery: ({ chatflowid, apiHost, chatId }: ChatMessageRequest) => Promise<{
    data?: any;
    error?: Error | undefined;
}>;
//# sourceMappingURL=chatMessageQuery.d.ts.map