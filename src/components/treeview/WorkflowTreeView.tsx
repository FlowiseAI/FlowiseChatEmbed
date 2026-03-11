import { createSignal, onMount, Show, For } from 'solid-js';
import { RichTreeView, TreeItem } from './RichTreeView';
import { getAgentflowIcon, MaximizeIcon } from './AgentflowIcons';
import { NodeDetailsDialog } from './NodeDetailsDialog';

// Define the workflow node type to match the provided JSON data
export type WorkflowNode = {
  nodeId: string;
  nodeLabel: string;
  data: any;
  previousNodeIds: string[];
  status: 'FINISHED' | 'PENDING' | 'RUNNING' | 'ERROR' | 'INPROGRESS' | 'STOPPED';
};

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
};

// Default styling values consistent with BotBubble
const defaultBackgroundColor = '#f7f8ff';
const defaultTextColor = '#303235';
const defaultFontSize = 16;
const FLOWISE_CREDENTIAL_ID = 'FLOWISE_CREDENTIAL_ID';

// Status icon components
const FinishedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#4CAF50"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const PendingIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#FFC107"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const RunningIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#2196F3"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16l4-4-4-4" />
    <path d="M8 12h8" />
  </svg>
);

const ErrorIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#F44336"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

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

// Function to get the appropriate icon based on node status
const getStatusIcon = (status: string) => {
  let icon;
  switch (status) {
    case 'FINISHED':
      icon = <FinishedIcon />;
      break;
    case 'PENDING':
      icon = <PendingIcon />;
      break;
    case 'RUNNING':
    case 'INPROGRESS':
      icon = <RunningIcon />;
      break;
    case 'ERROR':
      icon = <ErrorIcon />;
      break;
    case 'STOPPED':
      icon = <StoppedIcon />;
      break;
    default:
      icon = <PendingIcon />;
  }
  return icon;
};

// Add a new icon for the STOPPED status
const StoppedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#FF9800"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <rect x="9" y="9" width="6" height="6" />
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

  // Get overall execution status of the workflow
  const getExecutionStatus = (executionTree: any[]) => {
    const getAllStatuses = (nodes: any[]): string[] => {
      let statuses: string[] = [];
      nodes.forEach((node) => {
        if (node.status) statuses.push(node.status);
        if (node.children && node.children.length > 0) {
          statuses = [...statuses, ...getAllStatuses(node.children)];
        }
      });
      return statuses;
    };

    const statuses = getAllStatuses(executionTree);
    if (statuses.includes('ERROR')) return 'ERROR';
    if (statuses.includes('RUNNING') || statuses.includes('INPROGRESS')) return 'INPROGRESS';
    if (statuses.includes('STOPPED')) return 'STOPPED';
    if (statuses.every((status) => status === 'FINISHED')) return 'FINISHED';
    return null;
  };

  // Transform the execution data into a tree structure
  const buildTreeData = (nodes: WorkflowNode[]) => {
    // for each node, loop through each and every nested key of node.data, and remove the key if it is equal to FLOWISE_CREDENTIAL_ID
    nodes.forEach((node) => {
      const removeFlowiseCredentialId = (data: any) => {
        for (const key in data) {
          if (key === FLOWISE_CREDENTIAL_ID) {
            delete data[key];
          }
          if (typeof data[key] === 'object' && data[key] !== null) {
            removeFlowiseCredentialId(data[key]);
          }
        }
      };
      if (node.data) removeFlowiseCredentialId(node.data);
    });

    // Create a map for quick node lookup
    // Use execution index to make each node instance unique
    const nodeMap = new Map();
    nodes.forEach((node, index) => {
      const uniqueNodeId = `${node.nodeId}_${index}`;
      nodeMap.set(uniqueNodeId, { ...node, uniqueNodeId, children: [], executionIndex: index });
    });

    // Identify iteration nodes and their children
    const iterationGroups = new Map(); // parentId -> Map of iterationIndex -> nodes

    // Group iteration child nodes by their parent and iteration index
    nodes.forEach((node, index) => {
      if (node.data?.parentNodeId && node.data?.iterationIndex !== undefined) {
        const parentId = node.data.parentNodeId;
        const iterationIndex = node.data.iterationIndex;

        if (!iterationGroups.has(parentId)) {
          iterationGroups.set(parentId, new Map());
        }

        const iterationMap = iterationGroups.get(parentId);
        if (!iterationMap.has(iterationIndex)) {
          iterationMap.set(iterationIndex, []);
        }

        iterationMap.get(iterationIndex).push(`${node.nodeId}_${index}`);
      }
    });

    // Create virtual iteration container nodes
    iterationGroups.forEach((iterationMap, parentId) => {
      iterationMap.forEach((nodeIds: string[], iterationIndex: number) => {
        // Find the parent iteration node
        let parentNode = null;
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].nodeId === parentId) {
            parentNode = nodes[i];
            break;
          }
        }

        if (!parentNode) return;

        // Get iteration context from first child node
        const firstChildId = nodeIds[0];
        const firstChild = nodeMap.get(firstChildId);
        const iterationContext = firstChild?.data?.iterationContext || { index: iterationIndex };

        // Create a virtual node for this iteration
        const iterationNodeId = `${parentId}_${iterationIndex}`;
        const iterationLabel = `Iteration #${iterationIndex}`;

        // Determine status based on child nodes
        const childNodes = nodeIds.map((id: string) => nodeMap.get(id));
        const iterationStatus = childNodes.some((n: any) => n.status === 'ERROR')
          ? 'ERROR'
          : childNodes.some((n: any) => n.status === 'INPROGRESS' || n.status === 'RUNNING')
            ? 'INPROGRESS'
            : childNodes.every((n: any) => n.status === 'FINISHED')
              ? 'FINISHED'
              : 'PENDING';

        // Create the virtual node and add to nodeMap
        const virtualNode = {
          nodeId: iterationNodeId,
          nodeLabel: iterationLabel,
          data: {
            name: 'iterationAgentflow',
            iterationIndex,
            iterationContext,
            isVirtualNode: true,
            parentIterationId: parentId,
          },
          previousNodeIds: [], // Will be handled in the main tree building
          status: iterationStatus,
          uniqueNodeId: iterationNodeId,
          children: [],
          executionIndex: -1, // Flag as a virtual node
        };

        nodeMap.set(iterationNodeId, virtualNode);

        // Set this virtual node as the parent for all nodes in this iteration
        nodeIds.forEach((childId: string) => {
          const childNode = nodeMap.get(childId);
          if (childNode) {
            childNode.virtualParentId = iterationNodeId;
          }
        });
      });
    });

    // Root nodes have no previous nodes
    const rootNodes: any[] = [];
    const processedNodes = new Set();

    // First pass: Build the main tree structure (excluding iteration children)
    nodes.forEach((node, index) => {
      const uniqueNodeId = `${node.nodeId}_${index}`;
      const treeNode = nodeMap.get(uniqueNodeId);

      // Skip nodes that belong to an iteration (they'll be added to their virtual parent)
      if (node.data?.parentNodeId && node.data?.iterationIndex !== undefined) {
        return;
      }

      if (node.previousNodeIds.length === 0) {
        rootNodes.push(treeNode);
      } else {
        // Find the most recent (latest) parent node among all previous nodes
        let mostRecentParentIndex = -1;
        let mostRecentParentId = null;

        node.previousNodeIds.forEach((parentId) => {
          // Find the most recent instance of this parent node
          for (let i = 0; i < index; i++) {
            if (nodes[i].nodeId === parentId && i > mostRecentParentIndex) {
              mostRecentParentIndex = i;
              mostRecentParentId = parentId;
            }
          }
        });

        // Only add to the most recent parent
        if (mostRecentParentIndex !== -1 && mostRecentParentId) {
          const parentUniqueId = `${mostRecentParentId}_${mostRecentParentIndex}`;
          const parentNode = nodeMap.get(parentUniqueId);
          if (parentNode) {
            parentNode.children.push(treeNode);
            processedNodes.add(uniqueNodeId);
          }
        }
      }
    });

    // Second pass: Build the iteration sub-trees
    iterationGroups.forEach((iterationMap, parentId) => {
      // Find all instances of the parent node
      const parentInstances: string[] = [];
      nodes.forEach((node, index) => {
        if (node.nodeId === parentId) {
          parentInstances.push(`${node.nodeId}_${index}`);
        }
      });

      // Find the latest instance of the parent node that exists in the tree
      let latestParent: any = null;
      for (let i = parentInstances.length - 1; i >= 0; i--) {
        const parentId = parentInstances[i];
        const parent = nodeMap.get(parentId);
        if (parent) {
          latestParent = parent;
          break;
        }
      }

      if (!latestParent) return;

      // Add all virtual iteration nodes to the parent
      iterationMap.forEach((nodeIds: string[], iterationIndex: number) => {
        const iterationNodeId = `${parentId}_${iterationIndex}`;
        const virtualNode = nodeMap.get(iterationNodeId);
        if (virtualNode) {
          latestParent.children.push(virtualNode);
        }
      });
    });

    // Third pass: Build the structure inside each virtual iteration node
    nodeMap.forEach((node) => {
      if (node.virtualParentId) {
        const virtualParent = nodeMap.get(node.virtualParentId);
        if (virtualParent) {
          if (node.previousNodeIds.length === 0) {
            // This is a root node within the iteration
            virtualParent.children.push(node);
          } else {
            // Find its parent within the same iteration
            let parentFound = false;
            for (const prevNodeId of node.previousNodeIds) {
              // Look for nodes with the same previous node ID in the same iteration
              nodeMap.forEach((potentialParent) => {
                if (
                  potentialParent.nodeId === prevNodeId &&
                  potentialParent.data?.iterationIndex === node.data?.iterationIndex &&
                  potentialParent.data?.parentNodeId === node.data?.parentNodeId &&
                  !parentFound
                ) {
                  potentialParent.children.push(node);
                  parentFound = true;
                }
              });
            }

            // If no parent was found within the iteration, add directly to virtual parent
            if (!parentFound) {
              virtualParent.children.push(node);
            }
          }
        }
      }
    });

    // Final pass: Sort all children arrays to ensure iteration nodes appear first
    const sortChildrenNodes = (node: any) => {
      if (node.children && node.children.length > 0) {
        // Sort children: iteration nodes first, then others by their original execution order
        node.children.sort((a: any, b: any) => {
          // Check if a is an iteration node
          const aIsIteration = a.data?.name === 'iterationAgentflow' || a.data?.isVirtualNode;
          // Check if b is an iteration node
          const bIsIteration = b.data?.name === 'iterationAgentflow' || b.data?.isVirtualNode;

          // If both are iterations or both are not iterations, preserve original order
          if (aIsIteration === bIsIteration) {
            return a.executionIndex - b.executionIndex;
          }

          // Otherwise, put iterations first
          return aIsIteration ? -1 : 1;
        });

        // Recursively sort children's children
        node.children.forEach(sortChildrenNodes);
      }
    };

    // Apply sorting to all root nodes and their children
    rootNodes.forEach(sortChildrenNodes);

    // Transform to the required format
    const transformNode = (node: any) => ({
      id: node.uniqueNodeId,
      label: node.nodeLabel,
      name: node.data?.name,
      status: node.status,
      data: node.data,
      children: node.children.map(transformNode),
    });

    const transformedNodes = rootNodes.map(transformNode);

    // Determine the overall execution status
    const status = getExecutionStatus(transformedNodes);
    setExecutionStatus(status);

    return transformedNodes;
  };

  // Initialize tree data on mount
  onMount(() => {
    const treeNodes = buildTreeData(props.workflowData);
    setTreeData(treeNodes);

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
      />
    </div>
  );
};
