export type NodeDetailsNode = {
    label: string;
    name: string;
    status: string;
    data: any;
};
type NodeDetailsContentProps = {
    node: NodeDetailsNode;
    backgroundColor?: string;
    textColor?: string;
    apiHost?: string;
    chatflowid?: string;
    chatId?: string;
};
export declare function syntaxHighlight(json: string): string;
export declare const CloseIcon: () => import("solid-js").JSX.Element;
export declare const ClockIcon: () => import("solid-js").JSX.Element;
export declare const CoinIcon: () => import("solid-js").JSX.Element;
export declare const TokenIcon: () => import("solid-js").JSX.Element;
export declare const NodeIcon: (props: {
    name: string;
    apiHost?: string;
    size?: number;
    borderRadius?: string;
    bgColor?: string;
}) => import("solid-js").JSX.Element;
export declare const jsonBlockStyle: Record<string, string>;
export declare const nddStyles = "\n  .ndd-json .string { color: #7ac35c; }\n  .ndd-json .number { color: #e08331; }\n  .ndd-json .boolean { color: #326dc3; }\n  .ndd-json .null { color: #a951ad; }\n  .ndd-json .key { color: #d73e3e; font-weight: bold; }\n  @keyframes ndd-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }\n  .ndd-spin { animation: ndd-spin 1.5s linear infinite; }\n  .ndd-markdown p { margin: 0 0 0.5em 0; }\n  .ndd-markdown p:last-child { margin-bottom: 0; }\n  .ndd-markdown code { background: rgba(0,0,0,0.06); padding: 1px 4px; border-radius: 3px; font-size: 0.8em; font-family: 'SF Mono', 'Fira Code', Menlo, Consolas, monospace; }\n  .ndd-markdown pre { background: rgba(0,0,0,0.04); padding: 10px 12px; border-radius: 6px; overflow-x: auto; margin: 0.5em 0; }\n  .ndd-markdown pre code { background: none; padding: 0; font-size: 0.8em; }\n  .ndd-markdown a { color: #1976d2; text-decoration: underline; }\n  .ndd-markdown ul, .ndd-markdown ol { margin: 0.4em 0; padding-left: 1.5em; }\n  .ndd-markdown li { margin: 0.2em 0; }\n  .ndd-markdown h1, .ndd-markdown h2, .ndd-markdown h3 { margin: 0.6em 0 0.3em 0; font-weight: 600; }\n  .ndd-markdown h1 { font-size: 1.2em; }\n  .ndd-markdown h2 { font-size: 1.1em; }\n  .ndd-markdown h3 { font-size: 1em; }\n  .ndd-markdown blockquote { border-left: 3px solid rgba(0,0,0,0.15); margin: 0.5em 0; padding: 0.2em 0 0.2em 0.8em; opacity: 0.85; }\n  .ndd-markdown table { border-collapse: collapse; margin: 0.5em 0; font-size: 0.85em; }\n  .ndd-markdown th, .ndd-markdown td { border: 1px solid rgba(0,0,0,0.12); padding: 4px 8px; }\n  .ndd-markdown th { background: rgba(0,0,0,0.04); font-weight: 600; }\n  .ndd-markdown strong { font-weight: 600; }\n";
export declare const getMetrics: (data: any) => {
    time?: string | undefined;
    tokens?: string | undefined;
    cost?: string | undefined;
} | null;
export declare const NodeDetailsContent: (props: NodeDetailsContentProps) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=NodeDetailsContent.d.ts.map