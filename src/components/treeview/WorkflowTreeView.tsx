import { createSignal, onMount, Show, For } from 'solid-js';
import { RichTreeView, TreeItem } from './RichTreeView';
import { getAgentflowIcon, MaximizeIcon } from './AgentflowIcons';
import { NodeDetailsDialog } from './NodeDetailsDialog';
import { WorkflowNode, buildTreeData, getStatusIcon, getExecutionStatus } from './workflowUtils';

// Re-export WorkflowNode for consumers
export type { WorkflowNode };

// Props for the workflow tree component
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

// Default styling values consistent with BotBubble
const defaultBackgroundColor = '#f7f8ff';
const defaultTextColor = '#303235';
const defaultFontSize = 16;

// Chevron icons for the collapsible panel
const ChevronDownIcon = () => (
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

const ChevronRightIcon = () => (
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

// Main component for visualizing workflow as a tree
export const WorkflowTreeView = (props: WorkflowTreeViewProps) => {
  const [expandedNodes, setExpandedNodes] = createSignal<string[]>([]);
  const [isPanelExpanded, setIsPanelExpanded] = createSignal(props.initiallyExpanded !== false);
  const [treeData, setTreeData] = createSignal<any[]>([]);
  const [executionStatus, setExecutionStatus] = createSignal<string | null>(null);
  const [dialogNode, setDialogNode] = createSignal<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = createSignal(false);

  // Initialize tree data on mount
  onMount(() => {
    const treeNodes = buildTreeData(props.workflowData);
    setTreeData(treeNodes);

    const status = getExecutionStatus(treeNodes);
    setExecutionStatus(status);

    // Expand root nodes by default
    if (treeNodes.length > 0) {
      setExpandedNodes(treeNodes.map((node) => node.id));
    }
  });

  // Toggle the collapsible panel
  const togglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded());
  };

  // Open node details dialog
  const openNodeDialog = (node: any) => {
    setDialogNode({
      label: node.label,
      name: node.name,
      status: node.status,
      data: node.data,
    });
    setIsDialogOpen(true);
  };

  // Recursive function to render a node and its children
  const renderNode = (node: any) => {
    const foundIcon = getAgentflowIcon(node.name);

    const nodeLabel = (
      <div class="flex items-center">
        {foundIcon && (
          <div class="mr-1" style={{ display: 'flex', 'align-items': 'center' }}>
            {foundIcon.icon({ size: 20, color: foundIcon.color })}
          </div>
        )}
        <span>{node.label}</span>
      </div>
    );

    const statusIcon = <div class="status-icon">{getStatusIcon(node.status)}</div>;

    const expandButton = (
      <button
        class="expand-detail-btn"
        onClick={(e: MouseEvent) => {
          e.stopPropagation();
          openNodeDialog(node);
        }}
        title="View Details"
      >
        <MaximizeIcon />
      </button>
    );

    return (
      <TreeItem itemId={node.id} label={nodeLabel} icon={statusIcon} endIcon={expandButton} borderColor={foundIcon?.color}>
        {node.children && node.children.length > 0 && node.children.map((childNode: any) => renderNode(childNode))}
      </TreeItem>
    );
  };

  return (
    <div
      class={`mb-2 ml-2 border rounded-lg shadow-sm overflow-hidden ${props.class || ''}`}
      style={{
        'background-color': props.backgroundColor ?? defaultBackgroundColor,
        color: props.textColor ?? defaultTextColor,
        'font-size': props.fontSize ? `${props.fontSize}px` : `${defaultFontSize}px`,
      }}
    >
      {/* Collapsible header */}
      <div
        class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors duration-150"
        onClick={togglePanel}
        style={{
          'background-color': 'rgba(0,0,0,0.03)',
        }}
      >
        <div class="flex items-center space-x-2">
          <div class="flex-shrink-0">{isPanelExpanded() ? <ChevronDownIcon /> : <ChevronRightIcon />}</div>
          <h2 class="font-semibold flex items-center">
            {props.title || 'Process Flow'}
            {executionStatus() && (
              <span class="ml-2 status-icon" title={`Execution Status: ${executionStatus()}`}>
                {getStatusIcon(executionStatus() || 'PENDING')}
              </span>
            )}
          </h2>
        </div>
      </div>

      {/* Collapsible content */}
      <Show when={isPanelExpanded()}>
        <div class="border-t">
          <div class="p-4 mb-2">
            <RichTreeView defaultExpanded={expandedNodes()} indentationLevel={props.indentationLevel || 24}>
              <For each={treeData()}>{(rootNode) => renderNode(rootNode)}</For>
            </RichTreeView>
          </div>
        </div>
      </Show>

      <NodeDetailsDialog
        isOpen={isDialogOpen()}
        onClose={() => setIsDialogOpen(false)}
        node={dialogNode()}
        backgroundColor={props.backgroundColor}
        textColor={props.textColor}
        apiHost={props.apiHost}
        chatflowid={props.chatflowid}
        chatId={props.chatId}
        hasCustomHeader={props.hasCustomHeader}
        dialogContainer={props.dialogContainer}
      />
    </div>
  );
};
