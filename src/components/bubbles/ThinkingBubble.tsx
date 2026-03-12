import { createSignal, createEffect, Show, For } from 'solid-js';

type Props = {
  thinking?: string;
  thinkingDuration?: number;
  isThinking?: boolean;
  backgroundColor?: string;
  textColor?: string;
};

const BrainIcon = () => (
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
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 4.5 17.5a2.5 2.5 0 0 1-.44-4.96A2.5 2.5 0 0 1 6.5 10a2.5 2.5 0 0 1 .44-4.96A2.5 2.5 0 0 1 9.5 2z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 19.5 17.5a2.5 2.5 0 0 0 .44-4.96A2.5 2.5 0 0 0 17.5 10a2.5 2.5 0 0 0-.44-4.96A2.5 2.5 0 0 0 14.5 2z" />
  </svg>
);

const ChevronDownIcon = () => (
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

export const ThinkingCard = (props: Props) => {
  const [isExpanded, setIsExpanded] = createSignal(false);

  createEffect(() => {
    if (props.isThinking) {
      setIsExpanded(true);
    }
  });

  const parseThinkingContent = (content?: string): string[] => {
    if (!content) return [];
    return content.split('\n').filter((line) => line.trim());
  };

  const getHeaderText = () => {
    if (props.isThinking) return 'Thinking...';
    if (props.thinkingDuration !== undefined && props.thinkingDuration !== null) {
      return `Thought for ${props.thinkingDuration} second${props.thinkingDuration !== 1 ? 's' : ''}`;
    }
    return 'Thinking...';
  };

  const textColor = () => props.textColor || '#303235';

  return (
    <div
      style={{
        width: '100%',
        'border-radius': '8px',
        border: '1px solid rgba(0, 0, 0, 0.12)',
        background: props.backgroundColor || '#f7f8ff',
        'margin-bottom': '8px',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded())}
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
          color: textColor(),
          'text-align': 'left',
          border: 'none',
          background: 'transparent',
        }}
        aria-expanded={isExpanded()}
      >
        <span style={{ display: 'flex', 'align-items': 'center', 'flex-shrink': '0', color: '#7b61ff' }}>
          <Show when={props.isThinking} fallback={<BrainIcon />}>
            <span class="thinking-spinner" style={{ display: 'flex', 'align-items': 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
              </svg>
            </span>
          </Show>
        </span>
        <span
          style={{
            flex: '1',
            'font-weight': '500',
            'white-space': 'nowrap',
            overflow: 'hidden',
            'text-overflow': 'ellipsis',
          }}
        >
          {getHeaderText()}
        </span>
        <span
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'flex-shrink': '0',
            transition: 'transform 0.2s ease',
            transform: isExpanded() ? 'rotate(180deg)' : 'rotate(0deg)',
            opacity: '0.5',
          }}
          aria-hidden="true"
        >
          <ChevronDownIcon />
        </span>
      </button>
      <Show when={isExpanded()}>
        <div
          style={{
            'max-height': '300px',
            'overflow-y': 'auto',
            'overflow-x': 'hidden',
            padding: '10px 12px',
            'border-top': '1px solid rgba(0, 0, 0, 0.08)',
            background: 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Show
            when={parseThinkingContent(props.thinking).length > 0}
            fallback={
              <p
                style={{
                  margin: '0',
                  'font-style': 'italic',
                  color: textColor(),
                  opacity: '0.7',
                  'white-space': 'pre-wrap',
                  'word-break': 'break-word',
                  'font-size': '0.85rem',
                  'line-height': '1.5',
                }}
              >
                {props.thinking}
              </p>
            }
          >
            <ul style={{ margin: '0', padding: '0 0 0 20px', 'list-style-type': 'disc' }}>
              <For each={parseThinkingContent(props.thinking)}>
                {(line) => (
                  <li
                    style={{
                      'margin-bottom': '4px',
                      color: textColor(),
                      opacity: '0.7',
                    }}
                  >
                    <span
                      style={{
                        'font-style': 'italic',
                        'font-size': '0.85rem',
                        'line-height': '1.5',
                        'word-break': 'break-word',
                      }}
                    >
                      {line}
                    </span>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </div>
      </Show>
      <style>
        {`
          @keyframes thinking-spin {
            to { transform: rotate(360deg); }
          }
          .thinking-spinner svg {
            animation: thinking-spin 1s linear infinite;
          }
        `}
      </style>
    </div>
  );
};
