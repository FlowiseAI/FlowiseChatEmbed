import { JSXElement } from 'solid-js';
import './TreeView.css';
type RichTreeViewProps = {
    children: JSXElement;
    defaultExpanded?: string[];
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
};
export declare const TreeItem: (props: TreeItemProps) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=RichTreeView.d.ts.map