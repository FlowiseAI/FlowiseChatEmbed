import { JSXElement } from 'solid-js';
type RichTreeViewProps = {
    children: JSXElement;
    defaultExpanded?: string[];
    defaultSelected?: string;
    onNodeSelect?: (itemId: string) => void;
    highlightItems?: string[];
    multiSelect?: boolean;
    class?: string;
    indentationLevel?: number;
};
export declare const RichTreeView: (props: RichTreeViewProps) => import("solid-js").JSX.Element;
type TreeItemProps = {
    itemId: string;
    label: string | JSXElement;
    children?: JSXElement;
    icon?: JSXElement;
    expandedIcon?: JSXElement;
    endIcon?: JSXElement;
    isLeaf?: boolean;
    borderColor?: string;
};
export declare const TreeItem: (props: TreeItemProps) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=RichTreeView.d.ts.map