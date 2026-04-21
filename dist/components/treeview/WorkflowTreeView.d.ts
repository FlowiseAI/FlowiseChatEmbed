import { WorkflowNode } from './workflowUtils';
export type { WorkflowNode };
type WorkflowTreeViewProps = {
    workflowData: WorkflowNode[];
    class?: string;
    indentationLevel?: number;
    initiallyExpanded?: boolean;
    title?: string;
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    apiHost?: string;
    chatflowid?: string;
    chatId?: string;
    hasCustomHeader?: boolean;
    dialogContainer?: HTMLElement;
};
export declare const WorkflowTreeView: (props: WorkflowTreeViewProps) => import("solid-js").JSX.Element;
//# sourceMappingURL=WorkflowTreeView.d.ts.map