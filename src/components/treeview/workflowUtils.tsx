// Define the workflow node type to match the provided JSON data
export type WorkflowNode = {
  nodeId: string;
  nodeLabel: string;
  data: any;
  previousNodeIds: string[];
  status: 'FINISHED' | 'PENDING' | 'RUNNING' | 'ERROR' | 'INPROGRESS' | 'STOPPED';
};

export const FLOWISE_CREDENTIAL_ID = 'FLOWISE_CREDENTIAL_ID';

// Status icon components — filled style
export const FinishedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#4CAF50" />
    <polyline points="8 12 11 15 16 9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
);

export const PendingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#FFC107" />
    <polyline points="12 7 12 12 15 14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
);

export const RunningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#2196F3" />
    <path d="M10 8l6 4-6 4z" fill="#fff" />
  </svg>
);

export const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#F44336" />
    <rect x="11" y="7" width="2" height="6" rx="1" fill="#fff" />
    <rect x="11" y="15" width="2" height="2" rx="1" fill="#fff" />
  </svg>
);

export const StoppedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#FF9800" />
    <rect x="8.5" y="8.5" width="7" height="7" rx="1" fill="#fff" />
  </svg>
);

// Function to get the appropriate icon based on node status
export const getStatusIcon = (status: string) => {
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

// Remove FLOWISE_CREDENTIAL_ID from nested data
export const removeFlowiseCredentialId = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map((item) => removeFlowiseCredentialId(item));
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

// Get overall execution status of the workflow
export const getExecutionStatus = (executionTree: any[]): string | null => {
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
export const buildTreeData = (nodes: WorkflowNode[]) => {
  // for each node, loop through each and every nested key of node.data, and remove the key if it is equal to FLOWISE_CREDENTIAL_ID
  nodes.forEach((node) => {
    const removeCredential = (data: any) => {
      for (const key in data) {
        if (key === FLOWISE_CREDENTIAL_ID) {
          delete data[key];
        }
        if (typeof data[key] === 'object' && data[key] !== null) {
          removeCredential(data[key]);
        }
      }
    };
    if (node.data) removeCredential(node.data);
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
      const pId = parentInstances[i];
      const parent = nodeMap.get(pId);
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

  return transformedNodes;
};
