export type WorkflowNode = {
    nodeId: string;
    nodeLabel: string;
    data: any;
    previousNodeIds: string[];
    status: 'FINISHED' | 'PENDING' | 'RUNNING' | 'ERROR' | 'INPROGRESS' | 'STOPPED';
};
type WorkflowTreeViewProps = {
    workflowData: WorkflowNode[];
    class?: string;
    indentationLevel?: number;
    initiallyExpanded?: boolean;
    title?: string;
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
};
export declare const WorkflowTreeView: (props: WorkflowTreeViewProps) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=WorkflowTreeView.d.ts.map