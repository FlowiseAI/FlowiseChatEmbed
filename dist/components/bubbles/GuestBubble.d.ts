import { MessageType } from '../Bot';
type Props = {
    message: MessageType;
    apiHost?: string;
    chatflowid: string;
    chatId: string;
    showAvatar?: boolean;
    avatarSrc?: string;
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    renderHTML?: boolean;
};
export declare const GuestBubble: (props: Props) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=GuestBubble.d.ts.map