import { BotMessageTheme, FooterTheme, TextInputTheme, UserMessageTheme, FeedbackTheme } from '@/features/bubble/types';
export type FileEvent<T = EventTarget> = {
    target: T;
};
export type FormEvent<T = EventTarget> = {
    preventDefault: () => void;
    currentTarget: T;
};
type ImageUploadConstraits = {
    fileTypes: string[];
    maxUploadSize: number;
};
export type UploadsConfig = {
    imgUploadSizeAndTypes: ImageUploadConstraits[];
    isImageUploadAllowed: boolean;
    isSpeechToTextEnabled: boolean;
};
type FilePreviewData = string | ArrayBuffer;
type FilePreview = {
    data: FilePreviewData;
    mime: string;
    name: string;
    preview: string;
    type: string;
};
type messageType = 'apiMessage' | 'userMessage' | 'usermessagewaiting' | 'leadCaptureMessage';
export type IAgentReasoning = {
    agentName?: string;
    messages?: string[];
    usedTools?: any[];
    sourceDocuments?: any[];
    instructions?: string;
    nextAgent?: string;
};
export type IAction = {
    id?: string;
    elements?: Array<{
        type: string;
        label: string;
    }>;
    mapping?: {
        approve: string;
        reject: string;
        toolCalls: any[];
    };
};
export type FileUpload = Omit<FilePreview, 'preview'>;
export type MessageType = {
    messageId?: string;
    message: string;
    type: messageType;
    sourceDocuments?: any;
    fileAnnotations?: any;
    fileUploads?: Partial<FileUpload>[];
    agentReasoning?: IAgentReasoning[];
    action?: IAction | null;
};
type observerConfigType = (accessor: string | boolean | object | MessageType[]) => void;
export type observersConfigType = Record<'observeUserInput' | 'observeLoading' | 'observeMessages', observerConfigType>;
export type BotProps = {
    chatflowid: string;
    apiHost?: string;
    chatflowConfig?: Record<string, unknown>;
    welcomeMessage?: string;
    errorMessage?: string;
    botMessage?: BotMessageTheme;
    userMessage?: UserMessageTheme;
    textInput?: TextInputTheme;
    feedback?: FeedbackTheme;
    poweredByTextColor?: string;
    badgeBackgroundColor?: string;
    bubbleBackgroundColor?: string;
    bubbleTextColor?: string;
    showTitle?: boolean;
    showAgentMessages?: boolean;
    title?: string;
    titleAvatarSrc?: string;
    fontSize?: number;
    isFullPage?: boolean;
    footer?: FooterTheme;
    observersConfig?: observersConfigType;
    starterPrompts?: string[];
    starterPromptFontSize?: number;
};
export type LeadsConfig = {
    status: boolean;
    title?: string;
    name?: boolean;
    email?: boolean;
    phone?: boolean;
    successMessage?: string;
};
export declare const Bot: (botProps: BotProps & {
    class?: string;
}) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=Bot.d.ts.map