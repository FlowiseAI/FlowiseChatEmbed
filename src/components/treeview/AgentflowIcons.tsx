import { JSXElement } from 'solid-js';

type IconProps = {
  size?: number;
  color?: string;
};

// Condition - forking arrows (IconArrowsSplit)
const ConditionIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={props.color ?? 'currentColor'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 17h-8l-3.5 -5h-6.5" />
    <path d="M21 7h-8l-3.5 5" />
    <path d="M18 4l3 3l-3 3" />
    <path d="M18 14l3 3l-3 3" />
  </svg>
);

// Start - filled play triangle (IconPlayerPlayFilled)
const StartIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 24 24" fill={props.color ?? 'currentColor'} stroke="none">
    <path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
  </svg>
);

// LLM - sparkles (IconSparkles)
const LlmIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={props.color ?? 'currentColor'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2z" />
    <path d="M2 9a6 6 0 0 1 6 6a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6z" />
  </svg>
);

// Agent - robot (IconRobot)
const AgentIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={props.color ?? 'currentColor'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 4m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z" />
    <path d="M12 2v2" />
    <path d="M9 12v9" />
    <path d="M15 12v9" />
    <path d="M5 16l4 -2" />
    <path d="M15 14l4 2" />
    <path d="M9 18h6" />
    <path d="M10 8v.01" />
    <path d="M14 8v.01" />
  </svg>
);

// Human Input - person with arrows (IconUserQuestion simplified)
const HumanInputIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={props.color ?? 'currentColor'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
    <path d="M6 21v-2a4 4 0 0 1 4 -4h3" />
    <path d="M19 17v.01" />
    <path d="M19 14a2.5 2.5 0 1 0 -2.5 2.5" />
  </svg>
);

// Loop - circular arrows (IconRepeat)
const LoopIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={props.color ?? 'currentColor'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 12v-3a3 3 0 0 1 3 -3h13m-3 -3l3 3l-3 3" />
    <path d="M20 12v3a3 3 0 0 1 -3 3h-13m3 3l-3 -3l3 -3" />
  </svg>
);

// Direct Reply - filled chat bubble (IconMessageCircleFilled)
const DirectReplyIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 24 24" fill={props.color ?? 'currentColor'} stroke="none">
    <path d="M5.821 4.91c3.898 -2.765 9.469 -2.539 13.073 .536c3.667 3.127 4.168 8.238 1.152 11.897c-2.842 3.447 -7.965 4.583 -12.231 2.805l-.232 -.101l-4.375 .931l-.075 .013l-.11 .009l-.113 -.004l-.044 -.005l-.11 -.02l-.105 -.034l-.1 -.044l-.076 -.042l-.108 -.077l-.081 -.074l-.073 -.083l-.053 -.075l-.065 -.115l-.042 -.106l-.031 -.113l-.013 -.075l-.009 -.11l.004 -.113l.005 -.044l.02 -.11l.022 -.072l1.15 -3.451l-.022 -.036c-2.21 -3.747 -1.209 -8.392 2.411 -11.118l.23 -.168z" />
  </svg>
);

// Custom Function - f(x) (IconFunctionFilled)
const CustomFunctionIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 24 24" fill={props.color ?? 'currentColor'} stroke="none">
    <path d="M4.586 3.586a2 2 0 0 1 2.828 0l2.829 2.828a2 2 0 0 1 0 2.829l-2.829 2.828a2 2 0 0 1 -2.828 0l-2.829 -2.828a2 2 0 0 1 0 -2.829z" />
    <path d="M14 12h2v2h2v-2h2v-2h-2v-2h-2v2h-2z" />
    <path d="M3 18h7v-2h-7z" />
    <path d="M14 18h7v-2h-7z" />
  </svg>
);

// Tool - wrench (IconTools)
const ToolIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={props.color ?? 'currentColor'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4" />
    <path d="M14.5 5.5l4 4" />
    <path d="M12 8l-5 -5l-4 4l5 5" />
    <path d="M7 8l-1.5 1.5" />
  </svg>
);

// Retriever - library/books (IconLibrary)
const RetrieverIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={props.color ?? 'currentColor'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 4m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" />
    <path d="M9 4m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" />
    <path d="M5 8h4" />
    <path d="M9 16h4" />
    <path d="M13.803 4.56l2.184 -.56c.562 -.144 1.133 .154 1.277 .667l3.672 13.4c.144 .525 -.165 1.066 -.69 1.21l-2.184 .56c-.562 .144 -1.133 -.154 -1.277 -.667l-3.672 -13.4c-.144 -.525 .165 -1.066 .69 -1.21z" />
    <path d="M14 9l4 -1" />
    <path d="M16 16l3.923 -1.006" />
  </svg>
);

// Condition Agent - subtask branching (IconSubtask)
const ConditionAgentIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={props.color ?? 'currentColor'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 9l6 0" />
    <path d="M4 5m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
    <path d="M14 7m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
    <path d="M14 15m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" />
    <path d="M12 9v2a2 2 0 0 0 2 2h2" />
    <path d="M12 9a2 2 0 0 1 2 -2h2" />
  </svg>
);

// Sticky Note - note page (IconNote)
const StickyNoteIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={props.color ?? 'currentColor'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13 20l7 -7" />
    <path d="M13 20v-6a1 1 0 0 1 1 -1h6v-7a2 2 0 0 0 -2 -2h-12a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7" />
  </svg>
);

// HTTP - globe (IconWorld)
const HttpIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={props.color ?? 'currentColor'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
    <path d="M3.6 9h16.8" />
    <path d="M3.6 15h16.8" />
    <path d="M11.5 3a17 17 0 0 0 0 18" />
    <path d="M12.5 3a17 17 0 0 1 0 18" />
  </svg>
);

// Iteration - one-to-many (IconRelationOneToManyFilled)
const IterationIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 24 24" fill={props.color ?? 'currentColor'} stroke="none">
    <path d="M4 4a2 2 0 0 1 2 -2h1a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-1a2 2 0 0 1 -2 -2z" />
    <path d="M15 3a2 2 0 0 1 2 -2h1a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-1a2 2 0 0 1 -2 -2z" />
    <path d="M15 10a2 2 0 0 1 2 -2h1a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-1a2 2 0 0 1 -2 -2z" />
    <path d="M15 17a2 2 0 0 1 2 -2h1a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-1a2 2 0 0 1 -2 -2z" />
    <path d="M9 4h3.5a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-0.5" />
    <path d="M12 4h0.5a2 2 0 0 1 2 2v1" />
    <path d="M12 4h0.5a2 2 0 0 1 2 2v8.5a2 2 0 0 0 2 2h.5" />
  </svg>
);

// Execute Flow - bezier curve (IconVectorBezier2)
const ExecuteFlowIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 24 24" fill="none" stroke={props.color ?? 'currentColor'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 10m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" />
    <path d="M17 10m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" />
    <path d="M10 3m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" />
    <path d="M10 18m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" />
    <path d="M7 12c3 0 4 -3 5 -5" />
    <path d="M12 17c1 -2 2 -5 5 -5" />
  </svg>
);

// Maximize icon for the detail expand button
export const MaximizeIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 24 24" fill="none" stroke={props.color ?? 'teal'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 4l4 0l0 4" />
    <path d="M14 10l6 -6" />
    <path d="M8 20l-4 0l0 -4" />
    <path d="M4 20l6 -6" />
  </svg>
);

type AgentflowIconEntry = {
  name: string;
  icon: (props: IconProps) => JSXElement;
  color: string;
};

export const AGENTFLOW_ICONS: AgentflowIconEntry[] = [
  { name: 'conditionAgentflow', icon: ConditionIcon, color: '#FFB938' },
  { name: 'startAgentflow', icon: StartIcon, color: '#7EE787' },
  { name: 'llmAgentflow', icon: LlmIcon, color: '#64B5F6' },
  { name: 'agentAgentflow', icon: AgentIcon, color: '#4DD0E1' },
  { name: 'humanInputAgentflow', icon: HumanInputIcon, color: '#6E6EFD' },
  { name: 'loopAgentflow', icon: LoopIcon, color: '#FFA07A' },
  { name: 'directReplyAgentflow', icon: DirectReplyIcon, color: '#4DDBBB' },
  { name: 'customFunctionAgentflow', icon: CustomFunctionIcon, color: '#E4B7FF' },
  { name: 'toolAgentflow', icon: ToolIcon, color: '#d4a373' },
  { name: 'retrieverAgentflow', icon: RetrieverIcon, color: '#b8bedd' },
  { name: 'conditionAgentAgentflow', icon: ConditionAgentIcon, color: '#ff8fab' },
  { name: 'stickyNoteAgentflow', icon: StickyNoteIcon, color: '#fee440' },
  { name: 'httpAgentflow', icon: HttpIcon, color: '#FF7F7F' },
  { name: 'iterationAgentflow', icon: IterationIcon, color: '#9C89B8' },
  { name: 'executeFlowAgentflow', icon: ExecuteFlowIcon, color: '#a3b18a' },
];

export function getAgentflowIcon(name: string): AgentflowIconEntry | null {
  return AGENTFLOW_ICONS.find((entry) => entry.name === name) ?? null;
}
