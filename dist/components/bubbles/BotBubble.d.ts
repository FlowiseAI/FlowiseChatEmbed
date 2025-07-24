import { IAction, MessageType, ttsConfigType } from '../Bot';
import { DateTimeToggleTheme } from '@/features/bubble/types';
type Props = {
    message: MessageType;
    chatflowid: string;
    chatId: string;
    apiHost?: string;
    onRequest?: (request: RequestInit) => Promise<void>;
    fileAnnotations?: any;
    showAvatar?: boolean;
    avatarSrc?: string;
    backgroundColor?: string;
    textColor?: string;
    chatFeedbackStatus?: boolean;
    fontSize?: number;
    feedbackColor?: string;
    isLoading: boolean;
    dateTimeToggle?: DateTimeToggleTheme;
    showAgentMessages?: boolean;
    sourceDocsTitle?: string;
    renderHTML?: boolean;
    ttsConfig?: ttsConfigType;
    handleActionClick: (elem: any, action: IAction | undefined | null) => void;
    handleSourceDocumentsClick: (src: any) => void;
};
export declare const BotBubble: (props: Props) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=BotBubble.d.ts.map