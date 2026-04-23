import { createSignal, createContext, useContext, JSXElement, Show, For, createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Dynamic } from 'solid-js/web';

// TreeView Context Type
type TreeViewContextType = {
  expandedItems: string[];
  toggleItem: (itemId: string) => void;
  isExpanded: (itemId: string) => boolean;
};

// Create TreeView Context
const TreeViewContext = createContext<TreeViewContextType>({
  expandedItems: [],
  // eslint-disable-next-line
  toggleItem: () => {},
  isExpanded: () => false,
});

// Icons for expanded and collapsed states
const ChevronRight = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
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

const ChevronDown = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
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

// Props for TreeView component
type TreeViewProps = {
  children: JSXElement;
  defaultExpanded?: string[];
  class?: string;
};

// TreeView component
export const TreeView = (props: TreeViewProps) => {
  const [expandedItems, setExpandedItems] = createSignal<string[]>(props.defaultExpanded || []);

  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const isExpanded = (itemId: string) => {
    return expandedItems().includes(itemId);
  };

  const contextValue = {
    expandedItems: expandedItems(),
    toggleItem,
    isExpanded,
  };

  return (
    <TreeViewContext.Provider value={contextValue}>
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
  endIcon?: JSXElement;
};

// TreeItem component
export const TreeItem = (props: TreeItemProps) => {
  const context = useContext(TreeViewContext);
  const hasChildren = !!props.children;

  return (
    <div class="tree-item-root">
      <div
        class="tree-item-content flex items-center py-2 px-1 rounded hover:bg-gray-100 cursor-pointer"
        onClick={() => hasChildren && context.toggleItem(props.itemId)}
      >
        <div class="tree-item-icon-container mr-1" style={{ visibility: hasChildren ? 'visible' : 'hidden' }}>
          <Dynamic component={context.isExpanded(props.itemId) ? ChevronDown : ChevronRight} />
        </div>

        <Show when={props.icon}>
          <div class="tree-item-icon mr-2">{props.icon}</div>
        </Show>

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

// Rich TreeView component with more features
type RichTreeViewProps = TreeViewProps & {
  highlightItems?: string[];
  onNodeSelect?: (itemId: string) => void;
};

export const RichTreeView = (props: RichTreeViewProps) => {
  const [store, setStore] = createStore({
    selectedItem: '',
    highlightedItems: props.highlightItems || [],
  });

  createEffect(() => {
    if (props.highlightItems) {
      setStore('highlightedItems', props.highlightItems);
    }
  });

  const handleNodeSelect = (itemId: string) => {
    setStore('selectedItem', itemId);
    props.onNodeSelect && props.onNodeSelect(itemId);
  };

  // Enhanced context with selection functionality
  const enhancedContext = {
    selectedItem: () => store.selectedItem,
    highlightedItems: () => store.highlightedItems,
    handleNodeSelect,
  };

  return (
    <TreeView defaultExpanded={props.defaultExpanded} class={props.class}>
      {props.children}
    </TreeView>
  );
};
