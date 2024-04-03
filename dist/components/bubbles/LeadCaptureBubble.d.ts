import { LeadsConfig, MessageType } from '@/components/Bot';
type Props = {
    message: MessageType;
    chatflowid: string;
    chatId: string;
    leadsConfig?: LeadsConfig;
    apiHost?: string;
    handleCancelLeadCapture: () => void;
    fileAnnotations?: any;
    showAvatar?: boolean;
    avatarSrc?: string;
    backgroundColor?: string;
    textColor?: string;
    sendButtonColor?: string;
    chatFeedbackStatus?: boolean;
    fontSize?: number;
    isLeadSaved: boolean;
    setIsLeadSaved: (value: boolean) => void;
    setLeadEmail: (value: string) => void;
};
export declare const LeadCaptureBubble: (props: Props) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=LeadCaptureBubble.d.ts.map