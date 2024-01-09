type BotProps = {
    chatflowid: string;
    apiHost?: string;
    chatflowConfig?: Record<string, unknown>;
};
export declare const initFull: (props: BotProps & {
    id?: string;
}) => void;
export declare const init: (props: BotProps) => void;
type Chatbot = {
    initFull: typeof initFull;
    init: typeof init;
};
export declare const parseChatbot: () => {
    initFull: (props: BotProps & {
        id?: string;
    }) => void;
    init: (props: BotProps) => void;
};
export declare const injectChatbotInWindow: (bot: Chatbot) => void;
export {};
//# sourceMappingURL=window.d.ts.map