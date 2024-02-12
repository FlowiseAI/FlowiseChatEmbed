import { BotMessageTheme, TextInputTheme, UserMessageTheme } from '@/features/bubble/types';
type ImageUploadConstraits = {
    fileTypes: string[];
    maxUploadSize: number;
};
export type UploadsConfig = {
    imgUploadSizeAndTypes: ImageUploadConstraits[];
    isImageUploadAllowed: boolean;
    isSpeechToTextEnabled: boolean;
};
type messageType = 'apiMessage' | 'userMessage' | 'usermessagewaiting';
export type MessageType = {
    message: string;
    type: messageType;
    sourceDocuments?: any;
    fileAnnotations?: any;
};
export type BotProps = {
    chatflowid: string;
    apiHost?: string;
    chatflowConfig?: Record<string, unknown>;
    welcomeMessage?: string;
    botMessage?: BotMessageTheme;
    userMessage?: UserMessageTheme;
    textInput?: TextInputTheme;
    poweredByTextColor?: string;
    badgeBackgroundColor?: string;
    bubbleBackgroundColor?: string;
    bubbleTextColor?: string;
    showTitle?: boolean;
    title?: string;
    titleAvatarSrc?: string;
    fontSize?: number;
    isFullPage?: boolean;
};
export declare const Bot: (botProps: BotProps & {
    class?: string;
}) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=Bot.d.ts.map