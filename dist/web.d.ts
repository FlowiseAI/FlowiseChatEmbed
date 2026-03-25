declare const chatbot: {
    initFull: (props: {
        chatflowid: string;
        apiHost?: string | undefined;
        pageTitle?: string | undefined;
        onRequest?: ((request: RequestInit) => Promise<void>) | undefined;
        chatflowConfig?: Record<string, unknown> | undefined;
        observersConfig?: import("./components/Bot").observersConfigType | undefined;
        theme?: import(".").BubbleTheme | undefined;
    } & {
        id?: string | undefined;
    }) => void;
    init: (props: {
        chatflowid: string;
        apiHost?: string | undefined;
        pageTitle?: string | undefined;
        onRequest?: ((request: RequestInit) => Promise<void>) | undefined;
        chatflowConfig?: Record<string, unknown> | undefined;
        observersConfig?: import("./components/Bot").observersConfigType | undefined;
        theme?: import(".").BubbleTheme | undefined;
    }) => void;
    destroy: () => void;
};
export default chatbot;
//# sourceMappingURL=web.d.ts.map