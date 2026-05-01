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
  theme: Theme;
  onSwitch: () => void;
  onRename: (next: string) => void;
  onDelete: () => void;
};

export const SessionListItem = (props: Props) => {
  const [editing, setEditing] = createSignal(false);
  const [draft, setDraft] = createSignal(props.session.title);
  const [confirmingDelete, setConfirmingDelete] = createSignal(false);
  const [hovered, setHovered] = createSignal(false);

  const startEdit = (e: MouseEvent) => {
    e.stopPropagation();
    setDraft(props.session.title);
    setEditing(true);
  };
  const commit = () => {
    if (editing()) {
      props.onRename(draft());
      setEditing(false);
    }
  };
  const cancel = () => {
    setDraft(props.session.title);
    setEditing(false);
  };

  const onClick = () => {
    if (editing() || confirmingDelete()) return;
    props.onSwitch();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !editing() && !confirmingDelete()) {
      e.preventDefault();
      props.onSwitch();
    }
    if (e.key === 'Delete' && !editing()) {
      e.preventDefault();
      setConfirmingDelete(true);
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
        when={!editing() && !confirmingDelete()}
        fallback={
          <Show
            when={editing()}
            fallback={
              <div style={{ flex: 1, 'font-size': '12.5px', display: 'flex', 'align-items': 'center', gap: '8px' }}>
                <span style={{ 'font-weight': 500 }}>Delete?</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onDelete();
                    setConfirmingDelete(false);
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
                    setConfirmingDelete(false);
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
              value={draft()}
              onInput={(e) => setDraft(e.currentTarget.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') cancel();
              }}
              onBlur={cancel}
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
        <Show when={hovered() || props.active}>
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
              opacity: 0.6,
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
              setConfirmingDelete(true);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '4px',
              'border-radius': '4px',
              opacity: 0.6,
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
            </svg>
          </button>
        </Show>
      </Show>
    </div>
  );
};
