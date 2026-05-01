import { Show, createSignal } from 'solid-js';
import type { SessionV2 } from '@/state/sessionStorage';

type Theme = {
  textColor: string;
  activeBackgroundColor: string;
  activeTextColor: string;
  hoverBackgroundColor: string;
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
        padding: '8px 10px',
        'border-radius': '6px',
        'margin-bottom': '2px',
        cursor: 'pointer',
        background: props.active ? props.theme.activeBackgroundColor : hovered() ? props.theme.hoverBackgroundColor : 'transparent',
        color: props.active ? props.theme.activeTextColor : props.theme.textColor,
        display: 'flex',
        'align-items': 'center',
        gap: '6px',
      }}
    >
      <Show
        when={!editing() && !confirmingDelete()}
        fallback={
          <Show
            when={editing()}
            fallback={
              <div style={{ flex: 1, 'font-size': '12px', display: 'flex', 'align-items': 'center', gap: '6px' }}>
                <span>Delete?</span>
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
                    padding: '2px 8px',
                    'border-radius': '3px',
                    'font-size': '11px',
                    cursor: 'pointer',
                  }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmingDelete(false);
                  }}
                  style={{
                    background: 'white',
                    border: '1px solid #cbd5e1',
                    padding: '2px 8px',
                    'border-radius': '3px',
                    'font-size': '11px',
                    cursor: 'pointer',
                  }}
                >
                  No
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
                border: '1px solid #f59e0b',
                background: 'white',
                color: '#111',
                padding: '3px 6px',
                'border-radius': '3px',
                'font-size': '12px',
              }}
            />
          </Show>
        }
      >
        <div
          style={{
            flex: 1,
            'min-width': 0,
            'font-size': '12px',
            'font-weight': 500,
            overflow: 'hidden',
            'text-overflow': 'ellipsis',
            'white-space': 'nowrap',
          }}
        >
          {props.session.title}
        </div>
        <Show when={hovered() || props.active}>
          <span
            role="button"
            tabindex={0}
            aria-label="Rename"
            onClick={startEdit}
            style={{
              'font-size': '13px',
              color: 'inherit',
              cursor: 'pointer',
              padding: '0 4px',
              opacity: 0.7,
            }}
          >
            ✎
          </span>
          <span
            role="button"
            tabindex={0}
            aria-label="Delete"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmingDelete(true);
            }}
            style={{
              'font-size': '13px',
              color: '#dc2626',
              cursor: 'pointer',
              padding: '0 4px',
              opacity: 0.7,
            }}
          >
            ×
          </span>
        </Show>
      </Show>
    </div>
  );
};
