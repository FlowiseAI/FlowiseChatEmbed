declare const chatbot: {
    initFull: (props: {
        chatflowid: string;
        includeQuestions: boolean;
        apiHost?: string | undefined;
        userID?: string | undefined;
        chatflowConfig?: Record<string, unknown> | undefined;
        theme?: Record<string, unknown> | undefined;
        isOpen?: Boolean | undefined;
    } & {
        id?: string | undefined;
    }) => void;
    init: (props: {
        chatflowid: string;
        includeQuestions: boolean;
        apiHost?: string | undefined;
        userID?: string | undefined;
        chatflowConfig?: Record<string, unknown> | undefined;
        theme?: Record<string, unknown> | undefined;
        isOpen?: Boolean | undefined;
    }) => Promise<void>;
};
export default chatbot;
//# sourceMappingURL=web.d.ts.map