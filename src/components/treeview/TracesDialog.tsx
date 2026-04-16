import { createSignal, onMount, Show, For, onCleanup, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';
import { RichTreeView, TreeItem } from './RichTreeView';
import { getAgentflowIcon } from './AgentflowIcons';
import { WorkflowNode, buildTreeData, getStatusIcon, getExecutionStatus } from './workflowUtils';
import { NodeDetailsContent, CloseIcon, nddStyles } from './NodeDetailsContent';
import { CHAT_HEADER_HEIGHT } from '@/constants';

type TracesDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  workflowData: WorkflowNode[];
  backgroundColor?: string;
  textColor?: string;
  apiHost?: string;
  chatflowid?: string;
  chatId?: string;
  hasCustomHeader?: boolean;
  dialogContainer?: HTMLElement;
};

// Chevron icons for the tree panel
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
    style={{ transition: 'transform 0.2s' }}
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
    style={{ transition: 'transform 0.2s' }}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

// Drag handle icon (vertical grip dots)
const DragHandleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="24" viewBox="0 0 12 24" fill="currentColor" opacity="0.3">
    <circle cx="4" cy="8" r="1.5" />
    <circle cx="8" cy="8" r="1.5" />
    <circle cx="4" cy="12" r="1.5" />
    <circle cx="8" cy="12" r="1.5" />
    <circle cx="4" cy="16" r="1.5" />
    <circle cx="8" cy="16" r="1.5" />
  </svg>
);

const MIN_LEFT_WIDTH = 44; // collapsed: just the toggle header
const DEFAULT_LEFT_WIDTH = 180;
const MIN_EXPANDED_WIDTH = 140;

export const TracesDialog = (props: TracesDialogProps) => {
  const [treeData, setTreeData] = createSignal<any[]>([]);
  const [expandedNodes, setExpandedNodes] = createSignal<string[]>([]);
  const [selectedNode, setSelectedNode] = createSignal<any | null>(null);
  const [selectedNodeId, setSelectedNodeId] = createSignal<string>('');
  const [executionStatus, setExecutionStatus] = createSignal<string | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = createSignal(true);
  const [leftWidth, setLeftWidth] = createSignal(DEFAULT_LEFT_WIDTH);
  const [isDragging, setIsDragging] = createSignal(false);

  // Lookup map: node id -> node data (for onNodeSelect)
  const nodeMap = new Map<string, any>();

  const buildNodeMap = (nodes: any[]) => {
    nodes.forEach((node) => {
      nodeMap.set(node.id, node);
      if (node.children && node.children.length > 0) {
        buildNodeMap(node.children);
      }
    });
  };

  onMount(() => {
    if (props.workflowData) {
      const treeNodes = buildTreeData(props.workflowData);
      setTreeData(treeNodes);
      buildNodeMap(treeNodes);

      const status = getExecutionStatus(treeNodes);
      setExecutionStatus(status);

      if (treeNodes.length > 0) {
        setExpandedNodes(treeNodes.map((node) => node.id));
        // Auto-select first root node
        const first = treeNodes[0];
        setSelectedNodeId(first.id);
        setSelectedNode({ label: first.label, name: first.name, status: first.status, data: first.data });
      }
    }
  });

  const handleNodeSelect = (itemId: string) => {
    const node = nodeMap.get(itemId);
    if (node) {
      setSelectedNodeId(itemId);
      setSelectedNode({ label: node.label, name: node.name, status: node.status, data: node.data });
    }
  };

  const togglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded());
  };

  // Drag resize handlers
  let dragStartX = 0;
  let dragStartWidth = 0;

  const onDragStart = (e: MouseEvent) => {
    e.preventDefault();
    dragStartX = e.clientX;
    dragStartWidth = leftWidth();
    setIsDragging(true);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
  };

  const onDragMove = (e: MouseEvent) => {
    const delta = e.clientX - dragStartX;
    const newWidth = Math.max(MIN_EXPANDED_WIDTH, dragStartWidth + delta);
    setLeftWidth(newWidth);
  };

  const onDragEnd = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
  };

  // Touch drag handlers
  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    dragStartX = touch.clientX;
    dragStartWidth = leftWidth();
    setIsDragging(true);
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  };

  const onTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0];
    const delta = touch.clientX - dragStartX;
    const newWidth = Math.max(MIN_EXPANDED_WIDTH, dragStartWidth + delta);
    setLeftWidth(newWidth);
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
  };

  onCleanup(() => {
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
  });

  // Recursive function to render a tree node
  const renderNode = (node: any) => {
    const foundIcon = getAgentflowIcon(node.name);

    const nodeLabel = <span>{node.label}</span>;

    const nodeIcon = foundIcon ? (
      <div style={{ display: 'flex', 'align-items': 'center' }}>{foundIcon.icon({ size: 18, color: foundIcon.color })}</div>
    ) : (
      <span />
    );

    const statusIcon = <div class="status-icon">{getStatusIcon(node.status)}</div>;

    return (
      <TreeItem itemId={node.id} label={nodeLabel} icon={nodeIcon} endIcon={statusIcon} borderColor={foundIcon?.color}>
        {node.children && node.children.length > 0 && node.children.map((childNode: any) => renderNode(childNode))}
      </TreeItem>
    );
  };

  const dialogPaddingTop = () => (props.dialogContainer && props.hasCustomHeader ? 50 : CHAT_HEADER_HEIGHT);

  const currentLeftWidth = () => (isPanelExpanded() ? leftWidth() : MIN_LEFT_WIDTH);

  const DialogContent = () => (
    <>
      <style>{nddStyles}</style>
      <style>{`.tree-panel-header:hover { background-color: rgba(0,0,0,0.06); }`}</style>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: '0', 'z-index': 1001, 'background-color': 'rgba(0,0,0,0.25)', 'pointer-events': 'auto' }}
        onClick={() => props.onClose()}
      />
      {/* Dialog */}
      <div
        style={{
          position: 'fixed',
          inset: '0',
          'z-index': 1002,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'overflow-x': 'hidden',
          'overflow-y': 'auto',
          outline: 'none',
          'padding-top': `${dialogPaddingTop()}px`,
        }}
        onClick={() => props.onClose()}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            'max-width': '960px',
            margin: '8px',
            'background-color': props.backgroundColor ?? '#ffffff',
            color: props.textColor ?? '#303235',
            'border-radius': '8px',
            'box-shadow': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
            display: 'flex',
            'flex-direction': 'column',
            'max-height': `calc(100% - ${dialogPaddingTop()}px - 16px)`,
            overflow: 'hidden',
            outline: 'none',
            'font-family': "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top header with title and close */}
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'space-between',
              padding: '12px 16px',
              'border-bottom': '1px solid rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
              <h2 style={{ 'font-weight': '600', 'font-size': '1.05rem', margin: '0' }}>Traces</h2>
              {executionStatus() && (
                <span class="status-icon" title={`Execution Status: ${executionStatus()}`}>
                  {getStatusIcon(executionStatus() || 'PENDING')}
                </span>
              )}
            </div>
            <button
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '4px',
                'border-radius': '4px',
                display: 'flex',
                'align-items': 'center',
                color: 'inherit',
                opacity: '0.7',
              }}
              onClick={() => props.onClose()}
              title="Close"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Body: tree (left) + drag handle + details (right) */}
          <div style={{ display: 'flex', flex: '1', 'min-height': '0' }}>
            {/* Left panel: tree */}
            <div
              style={{
                width: `${currentLeftWidth()}px`,
                'min-width': `${currentLeftWidth()}px`,
                'overflow-y': 'auto',
                'overflow-x': 'hidden',
                'flex-shrink': '0',
                transition: isDragging() ? 'none' : 'width 0.15s ease, min-width 0.15s ease',
              }}
            >
              {/* Collapsible tree header */}
              <div
                class="tree-panel-header"
                onClick={togglePanel}
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  'background-color': 'rgba(0,0,0,0.03)',
                  gap: '4px',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div style={{ 'flex-shrink': '0' }}>{isPanelExpanded() ? <ChevronDownIcon /> : <ChevronRightIcon />}</div>
                <Show when={isPanelExpanded()}>
                  <span style={{ 'font-weight': '600', 'font-size': '0.75rem', 'line-height': '1rem', 'white-space': 'nowrap' }}>Process Flow</span>
                </Show>
              </div>
              <Show when={isPanelExpanded()}>
                <div style={{ padding: '0.5rem', 'font-size': '0.85rem' }}>
                  <RichTreeView
                    defaultExpanded={expandedNodes()}
                    defaultSelected={selectedNodeId()}
                    indentationLevel={16}
                    onNodeSelect={handleNodeSelect}
                  >
                    <For each={treeData()}>{(rootNode) => renderNode(rootNode)}</For>
                  </RichTreeView>
                </div>
              </Show>
            </div>

            {/* Drag handle / divider */}
            <Show when={isPanelExpanded()}>
              <div
                style={{
                  width: '8px',
                  cursor: 'col-resize',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  'flex-shrink': '0',
                  'background-color': isDragging() ? 'rgba(0,0,0,0.08)' : 'transparent',
                  'border-left': '1px solid rgba(0,0,0,0.1)',
                  transition: 'background-color 0.15s ease',
                  'user-select': 'none',
                }}
                onMouseDown={onDragStart}
                onTouchStart={onTouchStart}
                title="Drag to resize"
              >
                <DragHandleIcon />
              </div>
            </Show>
            <Show when={!isPanelExpanded()}>
              <div style={{ width: '1px', 'background-color': 'rgba(0,0,0,0.1)', 'flex-shrink': '0' }} />
            </Show>

            {/* Right panel: node details */}
            <div style={{ flex: '1', 'overflow-y': 'auto', 'min-width': '0', display: 'flex', 'flex-direction': 'column' }}>
              <Show
                when={selectedNode()}
                keyed
                fallback={
                  <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'center', flex: '1', opacity: '0.5', padding: '40px' }}>
                    Select a node to view details
                  </div>
                }
              >
                {(node) => (
                  <NodeDetailsContent
                    node={node}
                    backgroundColor={props.backgroundColor}
                    textColor={props.textColor}
                    apiHost={props.apiHost}
                    chatflowid={props.chatflowid}
                    chatId={props.chatId}
                  />
                )}
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* Prevent text selection while dragging */}
      <Show when={isDragging()}>
        <style>{`* { user-select: none !important; -webkit-user-select: none !important; }`}</style>
      </Show>
    </>
  );

  return (
    <Show when={props.isOpen}>
      <Show when={props.dialogContainer} fallback={<DialogContent />}>
        {(container) => (
          <Portal mount={container()}>
            <DialogContent />
          </Portal>
        )}
      </Show>
    </Show>
  );
};
