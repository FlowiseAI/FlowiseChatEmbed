import { JSXElement } from 'solid-js';
type TreeViewProps = {
    children: JSXElement;
    defaultExpanded?: string[];
    class?: string;
};
export declare const TreeView: (props: TreeViewProps) => import("solid-js").JSX.Element;
type TreeItemProps = {
    itemId: string;
    label: string | JSXElement;
    children?: JSXElement;
    icon?: JSXElement;
    endIcon?: JSXElement;
};
export declare const TreeItem: (props: TreeItemProps) => import("solid-js").JSX.Element;
type RichTreeViewProps = TreeViewProps & {
    highlightItems?: string[];
    onNodeSelect?: (itemId: string) => void;
};
export declare const RichTreeView: (props: RichTreeViewProps) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=TreeView.d.ts.map