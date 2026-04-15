export type WorkflowNode = {
    nodeId: string;
    nodeLabel: string;
    data: any;
    previousNodeIds: string[];
    status: 'FINISHED' | 'PENDING' | 'RUNNING' | 'ERROR' | 'INPROGRESS' | 'STOPPED';
};
export declare const FLOWISE_CREDENTIAL_ID = "FLOWISE_CREDENTIAL_ID";
export declare const FinishedIcon: () => import("solid-js").JSX.Element;
export declare const PendingIcon: () => import("solid-js").JSX.Element;
export declare const RunningIcon: () => import("solid-js").JSX.Element;
export declare const ErrorIcon: () => import("solid-js").JSX.Element;
export declare const StoppedIcon: () => import("solid-js").JSX.Element;
export declare const getStatusIcon: (status: string) => import("solid-js").JSX.Element;
export declare const removeFlowiseCredentialId: (data: any) => any;
export declare const getExecutionStatus: (executionTree: any[]) => string | null;
export declare const buildTreeData: (nodes: WorkflowNode[]) => {
    id: any;
    label: any;
    name: any;
    status: any;
    data: any;
    children: any;
}[];
//# sourceMappingURL=workflowUtils.d.ts.map