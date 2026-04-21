import { WorkflowNode } from './workflowUtils';
type TracesDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    workflowData: WorkflowNode[];
    backgroundColor?: string;
    textColor?: string;
    apiHost?: string;
    chatflowid?: string;
    chatId?: string;
    hasCustomHeader?: boolean;
    dialogContainer?: HTMLElement;
};
export declare const TracesDialog: (props: TracesDialogProps) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=TracesDialog.d.ts.map