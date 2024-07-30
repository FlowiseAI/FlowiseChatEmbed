import { IAction, MessageType } from '../Bot';
type Props = {
    message: MessageType;
    chatflowid: string;
    chatId: string;
    apiHost?: string;
    fileAnnotations?: any;
    showAvatar?: boolean;
    avatarSrc?: string;
    backgroundColor?: string;
    textColor?: string;
    chatFeedbackStatus?: boolean;
    fontSize?: number;
    feedbackColor?: string;
    isLoading: boolean;
    showAgentMessages?: boolean;
    handleActionClick: (label: string, action: IAction | undefined | null) => void;
};
export declare const BotBubble: (props: Props) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=BotBubble.d.ts.map