type NodeDetailsDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    node: {
        label: string;
        name: string;
        status: string;
        data: any;
    } | null;
    backgroundColor?: string;
    textColor?: string;
    apiHost?: string;
    chatflowid?: string;
    chatId?: string;
    isFullPage?: boolean;
};
export declare const NodeDetailsDialog: (props: NodeDetailsDialogProps) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=NodeDetailsDialog.d.ts.map