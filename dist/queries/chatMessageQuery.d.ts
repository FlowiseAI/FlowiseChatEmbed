import { messageType } from '@/components/Bot';
export type NewChatMessageInput = {
    chatType: 'external';
    role: messageType;
    content: string;
    chatflowid: string;
    sourceDocuments?: string;
};
export type ChatMessageRequest = {
    chatflowid: string;
    apiHost?: string;
    body?: NewChatMessageInput;
};
export declare const createNewChatmessageQuery: ({ chatflowid, apiHost, body }: ChatMessageRequest) => Promise<{
    data?: any;
    error?: Error | undefined;
}>;
//# sourceMappingURL=chatMessageQuery.d.ts.map