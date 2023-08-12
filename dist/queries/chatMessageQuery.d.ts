import { messageType } from '@/components/Bot';
export type NewChatMessageInput = {
    chatType: 'external';
    role: messageType;
    content: string;
    chatflowid: string;
    sourceDocuments?: string;
    chatId?: string;
};
export type ChatMessageRequest = {
    chatflowid: string;
    apiHost?: string;
    body?: NewChatMessageInput;
};
export type ChatMessageRequest1 = {
    chatflowid: string;
    apiHost?: string;
    chatId?: string;
};
export declare const createNewChatMessageQuery: ({ chatflowid, apiHost, body }: ChatMessageRequest) => Promise<{
    data?: any;
    error?: Error | undefined;
}>;
export declare const getChatMessageQuery: ({ chatflowid, apiHost, chatId }: ChatMessageRequest1) => Promise<{
    data?: any;
    error?: Error | undefined;
}>;
//# sourceMappingURL=chatMessageQuery.d.ts.map