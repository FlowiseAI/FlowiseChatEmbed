import { FileUpload, IAction } from '@/components/Bot';
export type IncomingInput = {
    question: string;
    uploads?: FileUpload[];
    overrideConfig?: Record<string, unknown>;
    socketIOClientId?: string;
    chatId?: string;
    fileName?: string;
    leadEmail?: string;
    action?: IAction;
};
export type MessageRequest = {
    chatflowid?: string;
    apiHost?: string;
    body?: IncomingInput;
};
export type FeedbackRatingType = 'THUMBS_UP' | 'THUMBS_DOWN';
export type FeedbackInput = {
    chatId: string;
    messageId: string;
    rating: FeedbackRatingType;
    content?: string;
};
export type CreateFeedbackRequest = {
    chatflowid?: string;
    apiHost?: string;
    body?: FeedbackInput;
};
export type UpdateFeedbackRequest = {
    id: string;
    apiHost?: string;
    body?: Partial<FeedbackInput>;
};
export type LeadCaptureInput = {
    chatflowid: string;
    chatId: string;
    name?: string;
    email?: string;
    phone?: string;
};
export type LeadCaptureRequest = {
    apiHost?: string;
    body: Partial<LeadCaptureInput>;
};
export declare const sendFeedbackQuery: ({ chatflowid, apiHost, body }: CreateFeedbackRequest) => Promise<{
    data?: unknown;
    error?: Error | undefined;
}>;
export declare const updateFeedbackQuery: ({ id, apiHost, body }: UpdateFeedbackRequest) => Promise<{
    data?: unknown;
    error?: Error | undefined;
}>;
export declare const sendMessageQuery: ({ chatflowid, apiHost, body }: MessageRequest) => Promise<{
    data?: any;
    error?: Error | undefined;
}>;
export declare const getChatbotConfig: ({ chatflowid, apiHost }: MessageRequest) => Promise<{
    data?: any;
    error?: Error | undefined;
}>;
export declare const isStreamAvailableQuery: ({ chatflowid, apiHost }: MessageRequest) => Promise<{
    data?: any;
    error?: Error | undefined;
}>;
export declare const sendFileDownloadQuery: ({ apiHost, body }: MessageRequest) => Promise<{
    data?: any;
    error?: Error | undefined;
}>;
export declare const addLeadQuery: ({ apiHost, body }: LeadCaptureRequest) => Promise<{
    data?: any;
    error?: Error | undefined;
}>;
//# sourceMappingURL=sendMessageQuery.d.ts.map