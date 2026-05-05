import { Show, createSignal } from 'solid-js';
import type { SessionV2 } from '@/state/sessionStorage';

type Theme = {
  textColor: string;
  activeBackgroundColor: string;
  activeTextColor: string;
  hoverBackgroundColor: string;
  accentColor: string;
};

type Props = {
  session: SessionV2;
  active: boolean;
  // Edit + delete state is owned by the parent SessionPanel and keyed by chatId
  // so it survives <For> re-mounts triggered by streaming-driven updatedAt bumps.
  editing: boolean;
  editingDraft: string;
  confirmingDelete: boolean;
  theme: Theme;
  onSwitch: () => void;
  onStartEdit: () => void;
  onChangeDraft: (next: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onStartDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onToggleStar?: () => void;
};

export const SessionListItem = (props: Props) => {
  const [hovered, setHovered] = createSignal(false);

  const startEdit = (e: MouseEvent) => {
    e.stopPropagation();
    props.onStartEdit();
  };

  const onClick = () => {
    if (props.editing || props.confirmingDelete) return;
    props.onSwitch();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !props.editing && !props.confirmingDelete) {
      e.preventDefault();
      props.onSwitch();
    }
    if (e.key === 'Delete' && !props.editing) {
      e.preventDefault();
      props.onStartDelete();
    }
  };

  const rowBg = () => (props.active ? props.theme.activeBackgroundColor : hovered() ? props.theme.hoverBackgroundColor : 'transparent');
  const rowFg = () => (props.active ? props.theme.activeTextColor : props.theme.textColor);

  return (
    <div
      role="listitem"
      tabindex={0}
      aria-current={props.active ? 'true' : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: '8px 10px 8px 14px',
        'border-radius': '8px',
        'margin-bottom': '2px',
        cursor: 'pointer',
        background: rowBg(),
        color: rowFg(),
        display: 'flex',
        'align-items': 'center',
        gap: '8px',
        transition: 'background 120ms ease, color 120ms ease',
        'font-weight': props.active ? 500 : 400,
      }}
    >
      <Show when={props.active}>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '4px',
            top: '8px',
            bottom: '8px',
            width: '3px',
            'border-radius': '2px',
            background: props.theme.accentColor,
          }}
        />
      </Show>
      <Show
        when={!props.editing && !props.confirmingDelete}
        fallback={
          <Show
            when={props.editing}
            fallback={
              <div style={{ flex: 1, 'font-size': '12.5px', display: 'flex', 'align-items': 'center', gap: '8px' }}>
                <span style={{ 'font-weight': 500 }}>Delete?</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onConfirmDelete();
                  }}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '3px 10px',
                    'border-radius': '4px',
                    'font-size': '11.5px',
                    'font-weight': 500,
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onCancelDelete();
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid color-mix(in srgb, currentColor 24%, transparent)',
                    color: 'inherit',
                    padding: '3px 10px',
                    'border-radius': '4px',
                    'font-size': '11.5px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            }
          >
            <input
              type="text"
              value={props.editingDraft}
              onInput={(e) => props.onChangeDraft(e.currentTarget.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') props.onCommitEdit();
                if (e.key === 'Escape') props.onCancelEdit();
              }}
              onBlur={() => props.onCommitEdit()}
              ref={(el) => {
                if (el) {
                  setTimeout(() => {
                    el.focus();
                    el.select();
                  }, 0);
                }
              }}
              aria-label="Rename conversation"
              style={{
                flex: 1,
                border: `1px solid ${props.theme.accentColor}`,
                background: 'white',
                color: '#111',
                padding: '4px 8px',
                'border-radius': '5px',
                'font-size': '12.5px',
                outline: 'none',
                'box-shadow': `0 0 0 2px color-mix(in srgb, ${props.theme.accentColor} 18%, transparent)`,
              }}
            />
          </Show>
        }
      >
        <div
          style={{
            flex: 1,
            'min-width': 0,
            'font-size': '13px',
            'line-height': '1.35',
            overflow: 'hidden',
            'text-overflow': 'ellipsis',
            'white-space': 'nowrap',
          }}
        >
          {props.session.title}
        </div>
        {/* Buttons are always in the DOM so row height never changes on hover.
            Visibility is controlled via opacity + pointer-events only. */}
        <Show when={props.onToggleStar}>
          <button
            type="button"
            aria-label={props.session.starred ? 'Unstar' : 'Star'}
            title={props.session.starred ? 'Unstar' : 'Star'}
            onClick={(e) => {
              e.stopPropagation();
              props.onToggleStar?.();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: props.session.starred ? '#f59e0b' : 'inherit',
              cursor: 'pointer',
              padding: '4px',
              'border-radius': '4px',
              opacity: hovered() || props.active ? (props.session.starred ? 1 : 0.6) : 0,
              'pointer-events': hovered() || props.active ? 'auto' : 'none',
              display: 'inline-flex',
              'align-items': 'center',
              'justify-content': 'center',
              transition: 'opacity 120ms ease, background 120ms ease, color 120ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.background = 'color-mix(in srgb, currentColor 10%, transparent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = props.session.starred ? '1' : '0.6';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill={props.session.starred ? 'currentColor' : 'none'}
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </Show>
        <button
          type="button"
          aria-label="Rename"
          title="Rename"
          onClick={startEdit}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '4px',
            'border-radius': '4px',
            opacity: hovered() || props.active ? 0.6 : 0,
            'pointer-events': hovered() || props.active ? 'auto' : 'none',
            display: 'inline-flex',
            'align-items': 'center',
            'justify-content': 'center',
            transition: 'opacity 120ms ease, background 120ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.background = 'color-mix(in srgb, currentColor 10%, transparent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.6';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4z" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Delete"
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            props.onStartDelete();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '4px',
            'border-radius': '4px',
            opacity: hovered() || props.active ? 0.6 : 0,
            'pointer-events': hovered() || props.active ? 'auto' : 'none',
            display: 'inline-flex',
            'align-items': 'center',
            'justify-content': 'center',
            transition: 'opacity 120ms ease, background 120ms ease, color 120ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.color = '#dc2626';
            e.currentTarget.style.background = 'color-mix(in srgb, #dc2626 10%, transparent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.6';
            e.currentTarget.style.color = 'inherit';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
          </svg>
        </button>
      </Show>
    </div>
  );
};
