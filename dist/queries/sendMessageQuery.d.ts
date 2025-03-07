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
type BaseRequest = {
    apiHost?: string;
    onRequest?: (request: RequestInit) => Promise<void>;
};
export type MessageRequest = BaseRequest & {
    chatflowid?: string;
    body?: IncomingInput;
};
export type FeedbackRatingType = 'THUMBS_UP' | 'THUMBS_DOWN';
export type FeedbackInput = {
    chatId: string;
    messageId: string;
    rating: FeedbackRatingType;
    content?: string;
};
export type CreateFeedbackRequest = BaseRequest & {
    chatflowid?: string;
    body?: FeedbackInput;
};
export type UpdateFeedbackRequest = BaseRequest & {
    id: string;
    body?: Partial<FeedbackInput>;
};
export type UpsertRequest = BaseRequest & {
    chatflowid: string;
    apiHost?: string;
    formData: FormData;
};
export type LeadCaptureInput = {
    chatflowid: string;
    chatId: string;
    name?: string;
    email?: string;
    phone?: string;
};
export type LeadCaptureRequest = BaseRequest & {
    body: Partial<LeadCaptureInput>;
};
export declare const sendFeedbackQuery: ({ chatflowid, apiHost, body, onRequest }: CreateFeedbackRequest) => Promise<{
    data?: unknown;
    error?: Error | undefined;
}>;
export declare const updateFeedbackQuery: ({ id, apiHost, body, onRequest }: UpdateFeedbackRequest) => Promise<{
    data?: unknown;
    error?: Error | undefined;
}>;
export declare const sendMessageQuery: ({ chatflowid, apiHost, body, onRequest }: MessageRequest) => Promise<{
    data?: any;
    error?: Error | undefined;
}>;
export declare const createAttachmentWithFormData: ({ chatflowid, apiHost, formData, onRequest }: UpsertRequest) => Promise<{
    data?: unknown;
    error?: Error | undefined;
}>;
export declare const upsertVectorStoreWithFormData: ({ chatflowid, apiHost, formData, onRequest }: UpsertRequest) => Promise<{
    data?: unknown;
    error?: Error | undefined;
}>;
export declare const getChatbotConfig: ({ chatflowid, apiHost, onRequest }: MessageRequest) => Promise<{
    data?: any;
    error?: Error | undefined;
}>;
export declare const isStreamAvailableQuery: ({ chatflowid, apiHost, onRequest }: MessageRequest) => Promise<{
    data?: any;
    error?: Error | undefined;
}>;
export declare const sendFileDownloadQuery: ({ apiHost, body, onRequest }: MessageRequest) => Promise<{
    data?: any;
    error?: Error | undefined;
}>;
export declare const addLeadQuery: ({ apiHost, body, onRequest }: LeadCaptureRequest) => Promise<{
    data?: any;
    error?: Error | undefined;
}>;
export {};
//# sourceMappingURL=sendMessageQuery.d.ts.map