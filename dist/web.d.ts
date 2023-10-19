declare const chatbot: {
    initFull: (props: {
        chatflowid: string;
        apiHost?: string | undefined;
        userID?: string | undefined;
        chatflowConfig?: Record<string, unknown> | undefined;
        theme?: Record<string, unknown> | undefined;
    } & {
        id?: string | undefined;
    }) => void;
    init: (props: {
        chatflowid: string;
        apiHost?: string | undefined;
        userID?: string | undefined;
        chatflowConfig?: Record<string, unknown> | undefined;
        theme?: Record<string, unknown> | undefined;
    }) => Promise<void>;
};
export default chatbot;
//# sourceMappingURL=web.d.ts.map