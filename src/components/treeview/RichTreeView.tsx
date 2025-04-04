import { createContext, useContext, JSXElement, Show, For, createEffect, mergeProps } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Dynamic } from 'solid-js/web';
import './TreeView.css';

// TreeView Context Type
type TreeViewContextType = {
  expandedItems: string[];
  selectedItem: string | null;
  toggleItem: (itemId: string) => void;
  selectItem: (itemId: string) => void;
  isExpanded: (itemId: string) => boolean;
  isSelected: (itemId: string) => boolean;
  isHighlighted: (itemId: string) => boolean;
  highlightedItems: string[];
};

// Create TreeView Context
const TreeViewContext = createContext<TreeViewContextType>({
  expandedItems: [],
  selectedItem: null,
  highlightedItems: [],
  // eslint-disable-next-line
  toggleItem: () => {},
  // eslint-disable-next-line
  selectItem: () => {},
  isExpanded: () => false,
  isSelected: () => false,
  isHighlighted: () => false,
});

// Icons for expanded and collapsed states
const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="transition-transform duration-200"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="transition-transform duration-200"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// Default folder icons
const FolderIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
  </svg>
);

const FolderOpenIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
  </svg>
);

const FileIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

// Props for RichTreeView component
type RichTreeViewProps = {
  children: JSXElement;
  defaultExpanded?: string[];
  onNodeSelect?: (itemId: string) => void;
  highlightItems?: string[];
  multiSelect?: boolean;
  class?: string;
  indentationLevel?: number;
};

// Define the state type to fix type errors
type TreeViewState = {
  expandedItems: string[];
  selectedItem: string | null;
  highlightedItems: string[];
};

// RichTreeView component
export const RichTreeView = (props: RichTreeViewProps) => {
  const mergedProps = mergeProps(
    {
      defaultExpanded: [] as string[],
      indentationLevel: 16, // Default indentation of 16px
    },
    props,
  );

  const [state, setState] = createStore<TreeViewState>({
    expandedItems: mergedProps.defaultExpanded,
    selectedItem: null,
    highlightedItems: props.highlightItems || [],
  });

  createEffect(() => {
    if (props.highlightItems) {
      setState('highlightedItems', [...props.highlightItems]);
    }
  });

  const toggleItem = (itemId: string) => {
    setState('expandedItems', (prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const selectItem = (itemId: string) => {
    setState('selectedItem', itemId);
    props.onNodeSelect && props.onNodeSelect(itemId);
  };

  const isExpanded = (itemId: string) => {
    return state.expandedItems.includes(itemId);
  };

  const isSelected = (itemId: string) => {
    return state.selectedItem === itemId;
  };

  const isHighlighted = (itemId: string) => {
    return state.highlightedItems.includes(itemId);
  };

  const contextValue = {
    expandedItems: state.expandedItems,
    selectedItem: state.selectedItem,
    highlightedItems: state.highlightedItems,
    toggleItem,
    selectItem,
    isExpanded,
    isSelected,
    isHighlighted,
  };

  // Add a style block for dynamic indentation
  const treeViewStyle = `
    .tree-item-children {
      padding-left: ${mergedProps.indentationLevel}px !important;
    }
  `;

  return (
    <TreeViewContext.Provider value={contextValue}>
      <style>{treeViewStyle}</style>
      <div class={`tree-view ${props.class || ''}`}>{props.children}</div>
    </TreeViewContext.Provider>
  );
};

// Props for TreeItem component
type TreeItemProps = {
  itemId: string;
  label: string | JSXElement;
  children?: JSXElement;
  icon?: JSXElement;
  expandedIcon?: JSXElement;
  endIcon?: JSXElement;
  isLeaf?: boolean;
};

// TreeItem component
export const TreeItem = (props: TreeItemProps) => {
  const context = useContext(TreeViewContext);
  const hasChildren = !!props.children;
  const isLeaf = props.isLeaf !== undefined ? props.isLeaf : !hasChildren;

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    context.selectItem(props.itemId);

    if (hasChildren) {
      context.toggleItem(props.itemId);
    }
  };

  const getDefaultIcon = () => {
    if (isLeaf) {
      return <FileIcon />;
    }
    return <>{context.isExpanded(props.itemId) ? <FolderOpenIcon /> : <FolderIcon />}</>;
  };

  return (
    <div class="tree-item-root">
      <div
        class={`tree-item-content flex items-center py-2 px-1 rounded cursor-pointer ${context.isSelected(props.itemId) ? 'selected' : ''} ${
          context.isHighlighted(props.itemId) ? 'highlighted' : ''
        }`}
        onClick={handleClick}
      >
        <div class="tree-item-icon-container mr-1">
          {!isLeaf && <Dynamic component={context.isExpanded(props.itemId) ? ChevronDownIcon : ChevronRightIcon} />}
        </div>

        <div class="tree-item-icon mr-2">
          {props.icon ? props.icon : props.expandedIcon && context.isExpanded(props.itemId) ? props.expandedIcon : getDefaultIcon()}
        </div>

        <div class="tree-item-label flex-grow">{props.label}</div>

        <Show when={props.endIcon}>
          <div class="tree-item-end-icon">{props.endIcon}</div>
        </Show>
      </div>

      <Show when={hasChildren && context.isExpanded(props.itemId)}>
        <div class="tree-item-children">{props.children}</div>
      </Show>
    </div>
  );
};
