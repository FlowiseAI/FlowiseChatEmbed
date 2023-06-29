import { BotMessageTheme, TextInputTheme, UserMessageTheme } from '@/features/bubble/types';
type messageType = 'apiMessage' | 'userMessage' | 'usermessagewaiting';
export type MessageType = {
    message: string;
    type: messageType;
    sourceDocuments?: any;
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
    fontSize?: number;
};
export declare const Bot: (props: BotProps & {
    class?: string;
}) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=Bot.d.ts.map