import { FileUpload } from '../Bot';
type Props = {
    apiHost?: string;
    chatflowid: string;
    chatId: string;
    agentName: string;
    agentMessage: string;
    agentArtifacts?: FileUpload[];
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    renderHTML?: boolean;
};
export declare const AgentReasoningBubble: (props: Props) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=AgentReasoningBubble.d.ts.map