import { createSignal, Show, For, JSXElement } from 'solid-js';
import { Marked } from '@ts-stack/markdown';
import DOMPurify from 'dompurify';
import { getAgentflowIcon } from './AgentflowIcons';
import { CHAT_HEADER_HEIGHT } from '../Bot';

type NodeDetailsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  node: {
    label: string;
    name: string;
    status: string;
    data: any;
  } | null;
  backgroundColor?: string;
  textColor?: string;
  apiHost?: string;
  chatflowid?: string;
  chatId?: string;
};

const FLOWISE_CREDENTIAL_ID = 'FLOWISE_CREDENTIAL_ID';

const removeFlowiseCredentialId = (data: any): any => {
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

function syntaxHighlight(json: string): string {
  if (!json) return '';
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
    let cls = 'number';
    if (/^"/.test(match)) {
      cls = /:$/.test(match) ? 'key' : 'string';
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

// --- SVG Icons ---

const CloseIcon = () => (
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
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChevronDownSmall = () => (
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
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CoinIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1-1.8-1" />
    <path d="M12 6v2m0 8v2" />
  </svg>
);

const TokenIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M5 5l14 14" />
    <path d="M19 5l-14 14" />
    <path d="M3 12h18" />
    <path d="M12 3v18" />
  </svg>
);

const ToolIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4" />
    <path d="M14.5 5.5l4 4" />
  </svg>
);

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// --- Node icon: agentflow SVG or API image fallback ---

const DefaultNodeIcon = (props: { size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size}
    height={props.size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const NodeIcon = (props: { name: string; apiHost?: string; size?: number; borderRadius?: string; bgColor?: string }) => {
  const sz = props.size ?? 24;
  const iconEntry = getAgentflowIcon(props.name);

  if (iconEntry) {
    return (
      <div
        style={{
          'flex-shrink': '0',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          width: `${sz}px`,
          height: `${sz}px`,
          'border-radius': props.borderRadius ?? '50%',
          background: props.bgColor ?? iconEntry.color,
        }}
      >
        {iconEntry.icon({ size: Math.round(sz * 0.55), color: 'white' })}
      </div>
    );
  }

  if (props.apiHost) {
    const [failed, setFailed] = createSignal(false);
    return (
      <div
        style={{
          'flex-shrink': '0',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          width: `${sz}px`,
          height: `${sz}px`,
          'border-radius': props.borderRadius ?? '50%',
          background: props.bgColor ?? (failed() ? '#9e9e9e' : '#f5f5f5'),
          overflow: 'hidden',
        }}
      >
        <Show when={!failed()} fallback={<DefaultNodeIcon size={Math.round(sz * 0.6)} />}>
          <img
            src={`${props.apiHost}/api/v1/node-icon/${props.name}`}
            alt={props.name}
            style={{ width: '100%', height: '100%', padding: '3px', 'object-fit': 'contain' }}
            onError={() => setFailed(true)}
          />
        </Show>
      </div>
    );
  }

  return (
    <div
      style={{
        'flex-shrink': '0',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        width: `${sz}px`,
        height: `${sz}px`,
        'border-radius': props.borderRadius ?? '50%',
        background: '#9e9e9e',
      }}
    >
      <DefaultNodeIcon size={Math.round(sz * 0.6)} />
    </div>
  );
};

// Helper to resolve tool icon name from availableTools
const getToolIconName = (toolName: string, availableTools?: any[]): string => {
  if (Array.isArray(availableTools)) {
    const match = availableTools.find((t: any) => t.name === toolName);
    if (match?.toolNode?.name) return match.toolNode.name;
  }
  return toolName;
};

const getRoleBadgeStyle = (role: string): { background: string; color: string } => {
  switch (role?.toLowerCase()) {
    case 'assistant':
    case 'ai':
      return { background: '#E8F5E9', color: '#2E7D32' };
    case 'system':
      return { background: '#FFF3E0', color: '#E65100' };
    case 'developer':
      return { background: '#E3F2FD', color: '#1565C0' };
    case 'user':
    case 'human':
      return { background: '#E3F2FD', color: '#1565C0' };
    case 'tool':
    case 'function':
      return { background: '#F3E5F5', color: '#7B1FA2' };
    default:
      return { background: '#F5F5F5', color: '#616161' };
  }
};

// --- Collapsible component ---

const Collapsible = (props: { header: JSXElement; children: JSXElement; borderColor?: string; bgColor?: string; defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = createSignal(props.defaultOpen ?? false);
  const toggle = () => setIsOpen(!isOpen());
  return (
    <div
      style={{
        border: `1px solid ${props.borderColor || 'rgba(0,0,0,0.1)'}`,
        'border-radius': '8px',
        'margin-bottom': '6px',
        overflow: 'hidden',
        background: props.bgColor || 'transparent',
      }}
    >
      <button
        type="button"
        style={{
          display: 'flex',
          'align-items': 'center',
          width: '100%',
          padding: '10px 12px',
          cursor: 'pointer',
          'user-select': 'none',
          gap: '8px',
          'font-size': '0.85rem',
          'font-family': 'inherit',
          color: 'inherit',
          'text-align': 'left',
          border: 'none',
          background: 'transparent',
        }}
        onClick={toggle}
        aria-expanded={isOpen()}
      >
        <span style={{ flex: '1', display: 'flex', 'align-items': 'center', gap: '8px', 'text-align': 'left' }}>{props.header}</span>
        <span
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'flex-shrink': '0',
            transition: 'transform 0.2s ease',
            transform: isOpen() ? 'rotate(180deg)' : 'rotate(0deg)',
            opacity: '0.5',
          }}
          aria-hidden="true"
        >
          <ChevronDownSmall />
        </span>
      </button>
      <Show when={isOpen()}>
        <div style={{ padding: '10px 12px', 'border-top': '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)' }}>{props.children}</div>
      </Show>
    </div>
  );
};

// --- Render JSON content with syntax highlighting ---

const jsonBlockStyle: Record<string, string> = {
  'font-family': "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace",
  'font-size': '0.75rem',
  'line-height': '1.5',
  padding: '12px',
  'border-radius': '6px',
  background: 'rgba(0,0,0,0.04)',
  'overflow-x': 'auto',
  'white-space': 'pre-wrap',
  'word-break': 'break-word',
  margin: '0',
};

const JsonBlock = (props: { data: any }) => (
  <pre class="ndd-json" style={jsonBlockStyle} innerHTML={syntaxHighlight(JSON.stringify(props.data, null, 2))} />
);

// --- Try to render content as JSON or plain text ---

const SmartContent = (props: { content: string }) => {
  Marked.setOptions({ isNoP: true, sanitize: true });

  const parsed = () => {
    if (!props.content) return null;
    try {
      return JSON.parse(props.content);
    } catch {
      return null;
    }
  };

  return (
    <Show
      when={parsed()}
      fallback={
        <Show when={props.content} fallback={<div style={{ 'font-size': '0.85rem', opacity: '0.5' }}>*No data*</div>}>
          <div
            class="ndd-markdown"
            style={{ 'word-break': 'break-word', 'font-size': '0.85rem', 'line-height': '1.6' }}
            innerHTML={Marked.parse(props.content)}
          />
        </Show>
      }
    >
      <JsonBlock data={parsed()} />
    </Show>
  );
};

// --- Resolve FILE-STORAGE:: URLs ---

const resolveFileUrl = (data: string, apiHost?: string, chatflowid?: string, chatId?: string): string => {
  if (data.startsWith('FILE-STORAGE::') && apiHost) {
    const fileName = data.replace('FILE-STORAGE::', '');
    return `${apiHost}/api/v1/get-upload-file?chatflowId=${chatflowid}&chatId=${chatId}&fileName=${fileName}`;
  }
  return data;
};

// --- Artifact renderer ---

const ArtifactBlock = (props: { artifact: any; index: number; apiHost?: string; chatflowid?: string; chatId?: string }) => {
  const type = props.artifact?.type;
  const data = props.artifact?.data;

  const artifactBoxStyle = { border: '1px solid rgba(0,0,0,0.12)', 'border-radius': '6px', overflow: 'hidden', background: 'rgba(0,0,0,0.02)' };

  if (type === 'png' || type === 'jpeg' || type === 'jpg') {
    const src = resolveFileUrl(data, props.apiHost, props.chatflowid, props.chatId);
    return (
      <div style={{ ...artifactBoxStyle, display: 'flex', 'justify-content': 'center' }}>
        <img
          src={src}
          alt={`artifact-${props.index}`}
          style={{ 'max-height': '400px', 'max-width': '100%', 'object-fit': 'contain', display: 'block' }}
        />
      </div>
    );
  }

  if (type === 'html') {
    return <div style={{ ...artifactBoxStyle, padding: '8px 12px', 'font-size': '0.85rem' }} innerHTML={DOMPurify.sanitize(data)} />;
  }

  return (
    <div style={{ ...artifactBoxStyle, padding: '8px 12px' }}>
      <SmartContent content={data} />
    </div>
  );
};

// --- File annotation link ---

const FileAnnotationLink = (props: { annotation: any; apiHost?: string; chatflowid?: string; chatId?: string }) => {
  const handleDownload = async () => {
    if (!props.apiHost) return;
    try {
      const response = await fetch(`${props.apiHost}/api/v1/openai-assistants-file/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: props.annotation.fileName,
          chatflowId: props.chatflowid,
          chatId: props.chatId,
        }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = props.annotation.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <button
      style={{
        display: 'inline-flex',
        'align-items': 'center',
        gap: '6px',
        padding: '4px 12px',
        border: '1px solid rgba(0,0,0,0.2)',
        'border-radius': '6px',
        background: 'transparent',
        cursor: 'pointer',
        'font-size': '0.8rem',
        color: 'inherit',
      }}
      onClick={handleDownload}
      title={`Download ${props.annotation.fileName}`}
    >
      <span>{props.annotation.fileName}</span>
      <DownloadIcon />
    </button>
  );
};

// --- Main component ---

export const NodeDetailsDialog = (props: NodeDetailsDialogProps) => {
  const [viewMode, setViewMode] = createSignal<'rendered' | 'raw'>('rendered');
  const [toolDetailData, setToolDetailData] = createSignal<any | null>(null);

  const cleanedData = () => {
    if (!props.node?.data) return {};
    return removeFlowiseCredentialId(props.node.data);
  };

  const getHighlightedJson = () => syntaxHighlight(JSON.stringify(cleanedData(), null, 2));

  // Metrics: match React's field access patterns
  const getMetrics = () => {
    const data = cleanedData();
    const output = data?.output;
    if (!output) return null;

    const metrics: { time?: string; tokens?: string; cost?: string } = {};

    if (output.timeMetadata?.delta) {
      metrics.time = `${(output.timeMetadata.delta / 1000).toFixed(2)} seconds`;
    }

    if (output.usageMetadata?.total_tokens) {
      metrics.tokens = `${output.usageMetadata.total_tokens} tokens`;
    }

    if (output.usageMetadata?.total_cost != null && Number(output.usageMetadata.total_cost) >= 0) {
      const cost = Number(output.usageMetadata.total_cost);
      metrics.cost = cost >= 0.01 ? `$${cost.toFixed(2)}` : `$${cost.toFixed(6)}`;
    }

    return Object.keys(metrics).length > 0 ? metrics : null;
  };

  // Check if a tool is used
  const isToolUsed = (toolName: string, usedTools: any[]) => {
    return Array.isArray(usedTools) && usedTools.some((ut: any) => ut.tool === toolName);
  };

  // Render a single message
  const renderMessage = (msg: any, data: any) => {
    const role = msg.role || 'unknown';
    const bs = getRoleBadgeStyle(role);
    const roleBadge = (bg: string, fg: string, text: string, extra?: any) => (
      <span
        style={{
          display: 'inline-flex',
          'align-items': 'center',
          gap: '4px',
          padding: '3px 10px',
          'border-radius': '12px',
          'font-size': '0.75rem',
          'font-weight': '500',
          background: bg,
          color: fg,
          border: `1px solid ${fg}33`,
          ...extra,
        }}
      >
        {text}
      </span>
    );

    return (
      <div style={{ 'margin-bottom': '8px', padding: '8px', 'border-radius': '6px', background: 'rgba(0,0,0,0.02)' }}>
        {/* Role badge */}
        {roleBadge(bs.background, bs.color, role)}

        {/* Name badge (alongside role) */}
        <Show when={msg.name}>{roleBadge(bs.background, bs.color, msg.name, { 'margin-left': '4px' })}</Show>

        {/* Tool calls as collapsible sections */}
        <Show when={msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0}>
          <For each={msg.tool_calls}>
            {(tc: any) => (
              <Collapsible
                borderColor="#FFC107"
                bgColor="rgba(255,193,7,0.05)"
                header={
                  <>
                    <ToolIcon />
                    <span>{tc.function?.name || tc.name || 'Tool Call'}</span>
                    {roleBadge('#FFF3E0', '#E65100', 'Called')}
                  </>
                }
              >
                <JsonBlock data={tc} />
              </Collapsible>
            )}
          </For>
        </Show>

        {/* Tool role: show tool name and tool_call_id */}
        <Show when={role === 'tool' && msg.name}>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '8px', 'margin-top': '4px' }}>
            <ToolIcon />
            <span style={{ 'font-size': '0.85rem' }}>{msg.name}</span>
            <Show when={msg.tool_call_id}>{roleBadge('#F5F5F5', '#616161', msg.tool_call_id)}</Show>
          </div>
        </Show>

        {/* Used tools from additional_kwargs */}
        <Show when={msg.additional_kwargs?.usedTools?.length}>
          <div style={{ 'margin-top': '8px', display: 'flex', gap: '4px', 'flex-wrap': 'wrap' }}>
            <For each={msg.additional_kwargs.usedTools}>
              {(tool: any) => (
                <Show when={tool}>
                  <span
                    style={{
                      display: 'inline-flex',
                      'align-items': 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      'border-radius': '12px',
                      'font-size': '0.75rem',
                      'font-weight': '500',
                      background: tool.error ? '#FFEBEE' : '#F3E5F5',
                      color: tool.error ? '#C62828' : '#7B1FA2',
                      border: `1px solid ${tool.error ? '#C6282833' : '#7B1FA233'}`,
                      cursor: 'pointer',
                      transition: 'filter 0.15s ease',
                    }}
                    onClick={() => setToolDetailData(tool)}
                  >
                    <NodeIcon name={getToolIconName(tool.tool, data?.output?.availableTools)} apiHost={props.apiHost} size={16} borderRadius="4px" />{' '}
                    {tool.tool}
                  </span>
                </Show>
              )}
            </For>
          </div>
        </Show>

        {/* Artifacts (images, HTML, markdown) */}
        <Show when={msg.additional_kwargs?.artifacts?.length}>
          <div style={{ 'margin-top': '8px', display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
            <For each={msg.additional_kwargs.artifacts}>
              {(artifact: any, idx) => (
                <ArtifactBlock artifact={artifact} index={idx()} apiHost={props.apiHost} chatflowid={props.chatflowid} chatId={props.chatId} />
              )}
            </For>
          </div>
        </Show>

        {/* User file uploads (array content with images) */}
        <Show when={role === 'user' && Array.isArray(msg.content) && msg.content.length > 0}>
          <div style={{ 'margin-top': '8px', display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
            <For each={msg.content}>
              {(content: any, idx) => {
                const src =
                  content.type === 'stored-file' && props.apiHost
                    ? `${props.apiHost}/api/v1/get-upload-file?chatflowId=${props.chatflowid}&chatId=${props.chatId}&fileName=${content.name}`
                    : content.name;
                return (
                  <div
                    style={{
                      border: '1px solid rgba(0,0,0,0.12)',
                      'border-radius': '6px',
                      overflow: 'hidden',
                      display: 'flex',
                      'justify-content': 'center',
                      background: 'rgba(0,0,0,0.02)',
                    }}
                  >
                    <img
                      src={src}
                      alt={`file-upload-${idx()}`}
                      style={{ 'max-height': '400px', 'max-width': '100%', 'object-fit': 'contain', display: 'block' }}
                    />
                  </div>
                );
              }}
            </For>
          </div>
        </Show>

        {/* String content */}
        <Show when={typeof msg.content === 'string' && msg.content}>
          <div style={{ 'margin-top': '4px' }}>
            <SmartContent content={msg.content} />
          </div>
        </Show>
        <Show when={!msg.content}>
          <div style={{ 'margin-top': '4px', 'font-size': '0.85rem', opacity: '0.5' }}>*No data*</div>
        </Show>

        {/* File annotations */}
        <Show when={msg.additional_kwargs?.fileAnnotations?.length}>
          <div style={{ 'margin-top': '8px', display: 'flex', gap: '6px', 'flex-wrap': 'wrap' }}>
            <For each={msg.additional_kwargs.fileAnnotations}>
              {(fa: any) => <FileAnnotationLink annotation={fa} apiHost={props.apiHost} chatflowid={props.chatflowid} chatId={props.chatId} />}
            </For>
          </div>
        </Show>
      </div>
    );
  };

  // Render fulfilled conditions (matching React's renderFullfilledConditions)
  const renderConditions = (conditions: any[]) => {
    const fulfilled = conditions.filter((c: any) => c.isFulfilled);
    return (
      <For each={fulfilled}>
        {(condition: any, index) => (
          <div style={{ border: '1px solid #4CAF50', 'border-radius': '6px', padding: '8px 12px', 'margin-bottom': '6px' }}>
            <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
              <span style={{ 'font-size': '0.85rem' }}>
                {condition.type === 'string' && condition.operation === 'equal' && !condition.value1 && !condition.value2
                  ? 'Else condition fulfilled'
                  : `Condition ${index()}`}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  'align-items': 'center',
                  gap: '4px',
                  padding: '3px 10px',
                  'border-radius': '12px',
                  'font-size': '0.75rem',
                  'font-weight': '500',
                  background: '#E8F5E9',
                  color: '#2E7D32',
                  border: '1px solid #2E7D3233',
                }}
              >
                Fulfilled
              </span>
            </div>
            <Show when={!(condition.type === 'string' && condition.operation === 'equal' && !condition.value1 && !condition.value2)}>
              <div style={{ 'margin-top': '4px' }}>
                <JsonBlock data={condition} />
              </div>
            </Show>
          </div>
        )}
      </For>
    );
  };

  const sectionStyle = { 'margin-bottom': '16px' };
  const sectionTitleStyle = { 'font-weight': '700', 'font-size': '0.9rem', 'margin-bottom': '8px' };
  const sectionBoxStyle = { border: '1px solid rgba(0,0,0,0.1)', 'border-radius': '10px', padding: '14px 16px', background: 'rgba(0,0,0,0.015)' };
  const badgeBaseStyle = (bg: string, fg: string) => ({
    display: 'inline-flex',
    'align-items': 'center',
    gap: '4px',
    padding: '3px 10px',
    'border-radius': '12px',
    'font-size': '0.75rem',
    'font-weight': '500',
    background: bg,
    color: fg,
    border: `1px solid ${fg}33`,
  });

  // Rendered view - matching NodeExecutionDetails.jsx structure
  const renderRenderedView = () => {
    const data = cleanedData();
    if (!data) return <div style={{ padding: '20px', 'text-align': 'center', opacity: '0.5' }}>No data available</div>;

    return (
      <div>
        {/* Tools section */}
        <Show when={data.output?.availableTools?.length}>
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Tools</div>
            <div style={sectionBoxStyle}>
              <For each={data.output.availableTools}>
                {(tool: any) => {
                  const used = isToolUsed(tool.name, data.output?.usedTools);
                  const iconName = tool.toolNode?.name || tool.name;
                  return (
                    <Collapsible
                      borderColor={used ? '#4CAF50' : undefined}
                      bgColor={used ? 'rgba(76,175,80,0.05)' : undefined}
                      header={
                        <>
                          <NodeIcon name={iconName} apiHost={props.apiHost} size={22} />
                          <span>{tool.toolNode?.label || tool.name}</span>
                          <Show when={used}>
                            <span style={badgeBaseStyle('#E8F5E9', '#2E7D32')}>Used</span>
                          </Show>
                        </>
                      }
                    >
                      <JsonBlock data={tool} />
                    </Collapsible>
                  );
                }}
              </For>
            </div>
          </div>
        </Show>

        {/* Input section */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Input</div>
          <div style={sectionBoxStyle}>
            <Show
              when={data.input?.messages && Array.isArray(data.input.messages) && data.input.messages.length > 0}
              fallback={
                <Show
                  when={data.input?.form || data.input?.http || data.input?.conditions}
                  fallback={
                    <Show
                      when={data.input?.code}
                      fallback={
                        <Show when={data.input} fallback={<div style={{ 'font-size': '0.85rem', opacity: '0.5' }}>*No data*</div>}>
                          <Show when={data.input?.question} fallback={<JsonBlock data={data.input} />}>
                            <SmartContent content={data.input.question} />
                          </Show>
                        </Show>
                      }
                    >
                      <pre style={jsonBlockStyle}>{data.input.code}</pre>
                    </Show>
                  }
                >
                  <JsonBlock data={data.input.form || data.input.http || data.input.conditions} />
                </Show>
              }
            >
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
                <For each={data.input.messages}>{(msg: any) => renderMessage(msg, data)}</For>
              </div>
            </Show>
          </div>
        </div>

        {/* Output section */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Output</div>
          <div style={sectionBoxStyle}>
            <Show
              when={!(data.output?.form || data.output?.http) && !data.output?.conditions}
              fallback={
                <Show when={data.output?.conditions} fallback={<JsonBlock data={data.output?.form || data.output?.http} />}>
                  {renderConditions(data.output.conditions)}
                </Show>
              }
            >
              {/* Used tools in output */}
              <Show when={data.output?.usedTools?.length}>
                <div style={{ display: 'flex', gap: '4px', 'flex-wrap': 'wrap', 'margin-bottom': '8px' }}>
                  <For each={data.output.usedTools}>
                    {(tool: any) => (
                      <Show when={tool}>
                        <span
                          style={{
                            ...badgeBaseStyle(tool.error ? '#FFEBEE' : '#F3E5F5', tool.error ? '#C62828' : '#7B1FA2'),
                            cursor: 'pointer',
                            transition: 'filter 0.15s ease',
                          }}
                          onClick={() => setToolDetailData(tool)}
                        >
                          <NodeIcon
                            name={getToolIconName(tool.tool, data.output?.availableTools)}
                            apiHost={props.apiHost}
                            size={16}
                            borderRadius="4px"
                          />{' '}
                          {tool.tool}
                        </span>
                      </Show>
                    )}
                  </For>
                </div>
              </Show>

              {/* Artifacts in output (images, HTML, text) */}
              <Show when={data.output?.artifacts?.length}>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px', 'margin-bottom': '8px' }}>
                  <For each={data.output.artifacts}>
                    {(artifact: any, idx) => (
                      <ArtifactBlock artifact={artifact} index={idx()} apiHost={props.apiHost} chatflowid={props.chatflowid} chatId={props.chatId} />
                    )}
                  </For>
                </div>
              </Show>

              {/* Output content */}
              <Show
                when={data.output?.content}
                fallback={
                  <Show when={data.output}>
                    <div style={{ 'font-size': '0.85rem', opacity: '0.5' }}>*No data*</div>
                  </Show>
                }
              >
                <SmartContent content={data.output.content} />
              </Show>

              {/* File annotations in output */}
              <Show when={data.output?.fileAnnotations?.length}>
                <div style={{ 'margin-top': '8px', display: 'flex', gap: '6px', 'flex-wrap': 'wrap' }}>
                  <For each={data.output.fileAnnotations}>
                    {(fa: any) => <FileAnnotationLink annotation={fa} apiHost={props.apiHost} chatflowid={props.chatflowid} chatId={props.chatId} />}
                  </For>
                </div>
              </Show>
            </Show>
          </div>
        </div>

        {/* Error section */}
        <Show when={data.error}>
          <div style={sectionStyle}>
            <div style={{ ...sectionTitleStyle, color: '#C62828' }}>Error</div>
            <div style={{ ...sectionBoxStyle, 'border-color': 'rgba(244,67,54,0.4)', background: 'rgba(244,67,54,0.04)' }}>
              <div
                style={{
                  padding: '8px 12px',
                  'border-radius': '6px',
                  border: '1px solid #F44336',
                  background: 'rgba(244,67,54,0.08)',
                  color: '#C62828',
                  'font-size': '0.85rem',
                  'white-space': 'pre-wrap',
                  'word-break': 'break-word',
                }}
              >
                {typeof data.error === 'object' ? JSON.stringify(data.error, null, 2) : data.error}
              </div>
            </div>
          </div>
        </Show>

        {/* State section */}
        <Show when={data.state && Object.keys(data.state).length > 0}>
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>State</div>
            <div style={sectionBoxStyle}>
              <JsonBlock data={data.state} />
            </div>
          </div>
        </Show>
      </div>
    );
  };

  const dialogStyles = `
    .ndd-json .string { color: #7ac35c; }
    .ndd-json .number { color: #e08331; }
    .ndd-json .boolean { color: #326dc3; }
    .ndd-json .null { color: #a951ad; }
    .ndd-json .key { color: #d73e3e; font-weight: bold; }
    @keyframes ndd-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .ndd-spin { animation: ndd-spin 1.5s linear infinite; }
    .ndd-markdown p { margin: 0 0 0.5em 0; }
    .ndd-markdown p:last-child { margin-bottom: 0; }
    .ndd-markdown code { background: rgba(0,0,0,0.06); padding: 1px 4px; border-radius: 3px; font-size: 0.8em; font-family: 'SF Mono', 'Fira Code', Menlo, Consolas, monospace; }
    .ndd-markdown pre { background: rgba(0,0,0,0.04); padding: 10px 12px; border-radius: 6px; overflow-x: auto; margin: 0.5em 0; }
    .ndd-markdown pre code { background: none; padding: 0; font-size: 0.8em; }
    .ndd-markdown a { color: #1976d2; text-decoration: underline; }
    .ndd-markdown ul, .ndd-markdown ol { margin: 0.4em 0; padding-left: 1.5em; }
    .ndd-markdown li { margin: 0.2em 0; }
    .ndd-markdown h1, .ndd-markdown h2, .ndd-markdown h3 { margin: 0.6em 0 0.3em 0; font-weight: 600; }
    .ndd-markdown h1 { font-size: 1.2em; }
    .ndd-markdown h2 { font-size: 1.1em; }
    .ndd-markdown h3 { font-size: 1em; }
    .ndd-markdown blockquote { border-left: 3px solid rgba(0,0,0,0.15); margin: 0.5em 0; padding: 0.2em 0 0.2em 0.8em; opacity: 0.85; }
    .ndd-markdown table { border-collapse: collapse; margin: 0.5em 0; font-size: 0.85em; }
    .ndd-markdown th, .ndd-markdown td { border: 1px solid rgba(0,0,0,0.12); padding: 4px 8px; }
    .ndd-markdown th { background: rgba(0,0,0,0.04); font-weight: 600; }
    .ndd-markdown strong { font-weight: 600; }
  `;

  return (
    <Show when={props.isOpen && props.node}>
      <style>{dialogStyles}</style>
      <div
        class="node-details-dialog-root"
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
          'padding-top': `${CHAT_HEADER_HEIGHT}px`,
        }}
        onClick={() => props.onClose()}
      >
        <div
          class="node-details-dialog-paper"
          style={{
            position: 'relative',
            width: '100%',
            'max-width': '640px',
            margin: '24px 16px',
            'background-color': props.backgroundColor ?? '#ffffff',
            color: props.textColor ?? '#303235',
            'border-radius': '8px',
            'box-shadow': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
            display: 'flex',
            'flex-direction': 'column',
            'max-height': `calc(100% - ${CHAT_HEADER_HEIGHT}px)`,
            'overflow-y': 'auto',
            outline: 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            class="node-dialog-header"
            style={{
              display: 'flex',
              'flex-direction': 'column',
              gap: '16px',
              padding: '16px 20px',
              'border-bottom': '1px solid rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', 'align-items': 'center', gap: '10px', 'min-width': '0' }}>
              <NodeIcon name={props.node!.name} apiHost={props.apiHost} size={36} />
              <div style={{ 'font-weight': '600', 'font-size': '1.05rem' }}>{props.node!.label}</div>
            </div>
            <div style={{ display: 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', gap: '8px', flex: '1' }}>
              <Show when={getMetrics()}>
                {(metrics) => (
                  <>
                    <Show when={metrics().time}>
                      <span
                        style={{
                          display: 'inline-flex',
                          'align-items': 'center',
                          gap: '4px',
                          padding: '4px 12px',
                          'border-radius': '14px',
                          'font-size': '0.75rem',
                          'font-weight': '600',
                          'white-space': 'nowrap',
                          background: '#4caf50',
                          color: '#fff',
                        }}
                      >
                        <ClockIcon /> {metrics().time}
                      </span>
                    </Show>
                    <Show when={metrics().tokens}>
                      <span
                        style={{
                          display: 'inline-flex',
                          'align-items': 'center',
                          gap: '4px',
                          padding: '4px 12px',
                          'border-radius': '14px',
                          'font-size': '0.75rem',
                          'font-weight': '600',
                          'white-space': 'nowrap',
                          background: '#7c4dff',
                          color: '#fff',
                        }}
                      >
                        <TokenIcon /> {metrics().tokens}
                      </span>
                    </Show>
                    <Show when={metrics().cost}>
                      <span
                        style={{
                          display: 'inline-flex',
                          'align-items': 'center',
                          gap: '4px',
                          padding: '4px 12px',
                          'border-radius': '14px',
                          'font-size': '0.75rem',
                          'font-weight': '600',
                          'white-space': 'nowrap',
                          background: '#ff9800',
                          color: '#fff',
                        }}
                      >
                        <CoinIcon /> {metrics().cost}
                      </span>
                    </Show>
                  </>
                )}
              </Show>
            </div>
          </div>

          {/* Rendered / Raw tab toggle */}
          <div style={{ display: 'flex', gap: '0', padding: '0 20px', 'border-bottom': '1px solid rgba(0,0,0,0.1)' }}>
            <button
              type="button"
              style={{
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                'font-size': '0.875rem',
                'font-weight': '500',
                'font-family': 'inherit',
                color: viewMode() === 'rendered' ? '#1976d2' : 'inherit',
                opacity: viewMode() === 'rendered' ? 1 : 0.6,
                'border-bottom': viewMode() === 'rendered' ? '2px solid #1976d2' : '2px solid transparent',
                'margin-bottom': '-1px',
              }}
              onClick={() => setViewMode('rendered')}
            >
              Rendered
            </button>
            <button
              type="button"
              style={{
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                'font-size': '0.875rem',
                'font-weight': '500',
                'font-family': 'inherit',
                color: viewMode() === 'raw' ? '#1976d2' : 'inherit',
                opacity: viewMode() === 'raw' ? 1 : 0.6,
                'border-bottom': viewMode() === 'raw' ? '2px solid #1976d2' : '2px solid transparent',
                'margin-bottom': '-1px',
              }}
              onClick={() => setViewMode('raw')}
            >
              Raw
            </button>
          </div>

          {/* Content */}
          <div class="node-dialog-body" style={{ padding: '16px 20px', 'overflow-y': 'initial', 'max-height': '100%' }}>
            <Show when={viewMode() === 'rendered'} fallback={<pre class="ndd-json" style={jsonBlockStyle} innerHTML={getHighlightedJson()} />}>
              {renderRenderedView()}
            </Show>
          </div>
        </div>
      </div>
      {/* Tool detail overlay modal */}
      <Show when={toolDetailData()}>
        <div
          style={{ position: 'fixed', inset: '0', 'z-index': 1004, display: 'flex', 'align-items': 'center', 'justify-content': 'center' }}
          onClick={() => setToolDetailData(null)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              'max-width': '560px',
              margin: '24px 16px',
              'background-color': props.backgroundColor ?? '#ffffff',
              color: props.textColor ?? '#303235',
              'border-radius': '8px',
              'box-shadow': '0 20px 40px -4px rgba(0,0,0,0.2), 0 8px 16px -4px rgba(0,0,0,0.1)',
              display: 'flex',
              'flex-direction': 'column',
              'max-height': `calc(100% - ${CHAT_HEADER_HEIGHT}px)`,
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'space-between',
                padding: '14px 20px',
                'border-bottom': '1px solid rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                <NodeIcon
                  name={getToolIconName(toolDetailData()?.tool || '', cleanedData()?.output?.availableTools)}
                  apiHost={props.apiHost}
                  size={24}
                />
                <span style={{ 'font-weight': '600', 'font-size': '0.95rem' }}>{toolDetailData()?.tool || 'Tool Detail'}</span>
                <Show when={toolDetailData()?.error}>
                  <span
                    style={{
                      display: 'inline-flex',
                      'align-items': 'center',
                      padding: '2px 8px',
                      'border-radius': '10px',
                      'font-size': '0.7rem',
                      'font-weight': '500',
                      background: '#FFEBEE',
                      color: '#C62828',
                      border: '1px solid #C6282833',
                    }}
                  >
                    Error
                  </span>
                </Show>
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
                onClick={() => setToolDetailData(null)}
                title="Close"
              >
                <CloseIcon />
              </button>
            </div>
            {/* Body */}
            <div style={{ padding: '16px 20px', 'overflow-y': 'auto' }}>
              <JsonBlock data={toolDetailData()} />
            </div>
          </div>
        </div>
        <div
          style={{ position: 'fixed', inset: '0', 'z-index': 1003, 'background-color': 'rgba(0,0,0,0.35)' }}
          onClick={() => setToolDetailData(null)}
        />
      </Show>

      <div
        style={{ position: 'fixed', inset: '0', 'z-index': 1001, 'background-color': 'rgba(0,0,0,0.25)', 'pointer-events': 'auto' }}
        onClick={() => props.onClose()}
      />
    </Show>
  );
};
