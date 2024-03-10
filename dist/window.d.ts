type BotProps = {
    chatflowid: string;
    includeQuestions: boolean;
    loadID?: string;
    userID?: string;
    defaultOpenDesktop?: boolean;
    defaultOpenMobile?: boolean;
    delayOpenFlag?: boolean;
    delayOpenSeconds?: number;
    stayClosedFlag?: boolean;
    apiHost?: string;
    chatflowConfig?: Record<string, unknown>;
    theme?: Record<string, unknown>;
};
export declare const initFull: (props: BotProps & {
    id?: string;
}) => void;
export declare const init: (props: BotProps) => Promise<void>;
type Chatbot = {
    initFull: typeof initFull;
    init: typeof init;
};
export declare const parseChatbot: () => {
    initFull: (props: BotProps & {
        id?: string;
    }) => void;
    init: (props: BotProps) => Promise<void>;
};
export declare const injectChatbotInWindow: (bot: Chatbot) => void;
export {};
//# sourceMappingURL=window.d.ts.map