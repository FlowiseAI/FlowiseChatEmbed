import { createSignal, onMount, Show, For } from 'solid-js';
import { RichTreeView, TreeItem } from './RichTreeView';

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
};

// Default styling values consistent with BotBubble
const defaultBackgroundColor = '#f7f8ff';
const defaultTextColor = '#303235';
const defaultFontSize = 16;
const FLOWISE_CREDENTIAL_ID = 'FLOWISE_CREDENTIAL_ID';

// Recursive function to remove credential IDs from data
const removeFlowiseCredentialId = (data: any): any => {
  if (!data || typeof data !== 'object') return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => removeFlowiseCredentialId(item));
  }

  // Clone the object to avoid modifying the original
  const cleanedData = { ...data };

  for (const key in cleanedData) {
    if (key === FLOWISE_CREDENTIAL_ID) {
      delete cleanedData[key];
    } else if (typeof cleanedData[key] === 'object' && cleanedData[key] !== null) {
      cleanedData[key] = removeFlowiseCredentialId(cleanedData[key]);
    }
  }
  return cleanedData;
};

// Syntax highlighting function for JSON
function syntaxHighlight(json: string) {
  if (!json) return '';

  // Escape HTML special characters
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return json.replace(
    // eslint-disable-next-line no-useless-escape
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      let cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    },
  );
}

// Copy icon component
const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

// Check icon component
const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

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
  switch (status) {
    case 'FINISHED':
      return <FinishedIcon />;
    case 'PENDING':
      return <PendingIcon />;
    case 'RUNNING':
    case 'INPROGRESS':
      return <RunningIcon />;
    case 'ERROR':
      return <ErrorIcon />;
    case 'STOPPED':
      return <StoppedIcon />;
    default:
      return <PendingIcon />;
  }
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
  const [selectedNode, setSelectedNode] = createSignal<string | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = createSignal(props.initiallyExpanded !== false);
  const [copied, setCopied] = createSignal(false);
  const [treeData, setTreeData] = createSignal<any[]>([]);
  const [executionStatus, setExecutionStatus] = createSignal<string | null>(null);

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
    // Create a map for quick node lookup
    // Use execution index to make each node instance unique
    const nodeMap = new Map();
    nodes.forEach((node, index) => {
      const uniqueNodeId = `${node.nodeId}_${index}`;
      nodeMap.set(uniqueNodeId, { ...node, uniqueNodeId, children: [], executionIndex: index });
    });

    // Root nodes have no previous nodes
    const rootNodes: any[] = [];

    // Build the tree structure
    nodes.forEach((node, index) => {
      const uniqueNodeId = `${node.nodeId}_${index}`;
      const treeNode = nodeMap.get(uniqueNodeId);

      if (node.previousNodeIds.length === 0) {
        rootNodes.push(treeNode);
      } else {
        // Find the most recent previous node instances
        // For each previous node ID, find the most recent instance that occurred before this node
        node.previousNodeIds.forEach((parentId) => {
          let mostRecentParentIndex = -1;

          // Find the most recent instance of the parent node that occurred before this node
          for (let i = 0; i < index; i++) {
            if (nodes[i].nodeId === parentId) {
              mostRecentParentIndex = i;
            }
          }

          if (mostRecentParentIndex !== -1) {
            const parentUniqueId = `${parentId}_${mostRecentParentIndex}`;
            const parentNode = nodeMap.get(parentUniqueId);
            if (parentNode) {
              parentNode.children.push(treeNode);
            }
          }
        });
      }
    });

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

  // Handle node selection
  const handleNodeSelect = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  // Toggle the collapsible panel
  const togglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded());
  };

  // Copy JSON to clipboard
  const copyToClipboard = async () => {
    const nodeDetails = getSelectedNodeDetails();
    if (!nodeDetails) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(nodeDetails.data || {}, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Recursive function to render a node and its children
  const renderNode = (node: any) => {
    return (
      <TreeItem itemId={node.id} label={node.label} icon={getStatusIcon(node.status)}>
        {node.children && node.children.length > 0 && node.children.map((childNode: any) => renderNode(childNode))}
      </TreeItem>
    );
  };

  // Get selected node details
  const getSelectedNodeDetails = () => {
    if (!selectedNode()) return null;

    // Find the node in the tree data
    const findNodeById = (nodes: any[], id: string): any => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children && node.children.length) {
          const found = findNodeById(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const selectedNodeId = selectedNode();
    if (!selectedNodeId) return null;

    const node = findNodeById(treeData(), selectedNodeId);
    if (node) {
      return {
        nodeLabel: node.label,
        data: removeFlowiseCredentialId(node.data),
        status: node.status,
      };
    }
    return null;
  };

  // Get highlighted JSON string for the selected node
  const getHighlightedJson = () => {
    const nodeDetails = getSelectedNodeDetails();
    if (!nodeDetails) return '';
    return syntaxHighlight(JSON.stringify(nodeDetails.data || {}, null, 2));
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
              <span class="ml-2" title={`Execution Status: ${executionStatus()}`}>
                {getStatusIcon(executionStatus() || 'PENDING')}
              </span>
            )}
          </h2>
        </div>
      </div>

      {/* JSON Syntax Highlighting Styles */}
      <style>{`
        .json-viewer .string { color: #7ac35c; }
        .json-viewer .number { color: #e08331; }
        .json-viewer .boolean { color: #326dc3; }
        .json-viewer .null { color: #a951ad; }
        .json-viewer .key { color: #d73e3e; font-weight: bold; }
      `}</style>

      {/* Collapsible content */}
      <Show when={isPanelExpanded()}>
        <div class="border-t">
          <div class="p-4 mb-2">
            <RichTreeView defaultExpanded={expandedNodes()} onNodeSelect={handleNodeSelect} indentationLevel={props.indentationLevel || 24}>
              <For each={treeData()}>{(rootNode) => renderNode(rootNode)}</For>
            </RichTreeView>
          </div>

          {selectedNode() && (
            <div
              class="mx-4 mb-4 p-4 rounded border"
              style={{
                'background-color': 'rgba(0,0,0,0.03)',
              }}
            >
              <div class="flex flex-col md:flex-row justify-between items-start mb-3">
                <div class="flex items-center mb-2 md:mb-0">
                  <span class="mr-2">{getStatusIcon(getSelectedNodeDetails()?.status || 'PENDING')}</span>
                  <h3 class="font-medium">
                    <span class="font-bold">{getSelectedNodeDetails()?.nodeLabel}</span>
                  </h3>
                </div>
                <button
                  onClick={copyToClipboard}
                  class="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100"
                  title="Copy to clipboard"
                >
                  {copied() ? <CheckIcon /> : <CopyIcon />}
                </button>
              </div>

              <div
                class="json-viewer text-xs overflow-auto max-h-60 p-2 rounded font-mono"
                style={{
                  'background-color': 'rgba(0,0,0,0.05)',
                  'white-space': 'pre-wrap',
                  'word-break': 'break-word',
                }}
                innerHTML={getHighlightedJson()}
              />
            </div>
          )}
        </div>
      </Show>
    </div>
  );
};
