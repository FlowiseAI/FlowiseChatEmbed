import { JSXElement } from 'solid-js';
type IconProps = {
    size?: number;
    color?: string;
};
export declare const MaximizeIcon: (props: IconProps) => import("solid-js").JSX.Element;
type AgentflowIconEntry = {
    name: string;
    icon: (props: IconProps) => JSXElement;
    color: string;
};
export declare const AGENTFLOW_ICONS: AgentflowIconEntry[];
export declare function getAgentflowIcon(name: string): AgentflowIconEntry | null;
export {};
//# sourceMappingURL=AgentflowIcons.d.ts.map