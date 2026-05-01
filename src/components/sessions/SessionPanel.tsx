import { For, Show } from 'solid-js';
import type { SessionStore } from '@/state/sessionStore';
import { SessionListItem } from './SessionListItem';

type SessionPanelTheme = {
  width?: string | number;
  collapsedWidth?: string | number;
  backgroundColor?: string;
  textColor?: string;
  activeBackgroundColor?: string;
  activeTextColor?: string;
  hoverBackgroundColor?: string;
  borderColor?: string;
  newChatButtonColor?: string;
  newChatButtonTextColor?: string;
  newChatLabel?: string;
  emptyStateText?: string;
  capWarningText?: string;
};

type Props = {
  store: SessionStore;
  isFullPage: boolean;
  panelTheme?: SessionPanelTheme;
  // Cascade: fall through to chatWindow palette if panel keys unset.
  chatWindowBackground?: string;
  chatWindowText?: string;
};

const px = (v: string | number | undefined, fallback: string) => (v === undefined ? fallback : typeof v === 'number' ? `${v}px` : v);

export const SessionPanel = (props: Props) => {
  const sessions = () => props.store.sessions();
  const activeId = () => props.store.activeChatId();
  const newChatLabel = () => props.panelTheme?.newChatLabel ?? 'New chat';
  const emptyText = () => props.panelTheme?.emptyStateText ?? 'No conversations yet';

  const bg = () => props.panelTheme?.backgroundColor ?? props.chatWindowBackground ?? '#f8fafc';
  const fg = () => props.panelTheme?.textColor ?? props.chatWindowText ?? '#334155';
  const activeBg = () => props.panelTheme?.activeBackgroundColor ?? '#e0e7ff';
  const activeFg = () => props.panelTheme?.activeTextColor ?? '#1e1b4b';
  const hoverBg = () => props.panelTheme?.hoverBackgroundColor ?? 'rgba(0,0,0,0.04)';
  const border = () => props.panelTheme?.borderColor ?? '#e2e8f0';
  const newBtnBg = () => props.panelTheme?.newChatButtonColor ?? '#4f46e5';
  const newBtnFg = () => props.panelTheme?.newChatButtonTextColor ?? '#ffffff';

  const handleNewChat = () => {
    props.store.actions.newChat();
  };
  const handleSwitch = (id: string) => {
    props.store.actions.switchSession(id);
  };

  return (
    <nav
      role="navigation"
      aria-label="Conversations"
      style={{
        width: px(props.panelTheme?.width, '260px'),
        background: bg(),
        color: fg(),
        'border-right': `1px solid ${border()}`,
        display: 'flex',
        'flex-direction': 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '12px',
          'border-bottom': `1px solid ${border()}`,
          'font-weight': 600,
          'font-size': '13px',
        }}
      >
        Conversations
      </div>

      <div style={{ padding: '8px' }}>
        <button
          type="button"
          onClick={handleNewChat}
          style={{
            width: '100%',
            background: newBtnBg(),
            color: newBtnFg(),
            border: 'none',
            padding: '8px',
            'border-radius': '6px',
            'font-size': '12px',
            cursor: 'pointer',
          }}
        >
          + {newChatLabel()}
        </button>
      </div>

      <Show
        when={sessions().length > 0}
        fallback={<div style={{ padding: '24px', 'text-align': 'center', 'font-size': '12px', opacity: 0.7 }}>{emptyText()}</div>}
      >
        <div role="list" style={{ flex: 1, overflow: 'auto', padding: '0 4px' }}>
          <For each={sessions()}>
            {(s) => (
              <SessionListItem
                session={s}
                active={s.chatId === activeId()}
                theme={{
                  textColor: fg(),
                  activeBackgroundColor: activeBg(),
                  activeTextColor: activeFg(),
                  hoverBackgroundColor: hoverBg(),
                }}
                onSwitch={() => handleSwitch(s.chatId)}
                onRename={(next) => props.store.actions.renameSession(s.chatId, next)}
                onDelete={() => props.store.actions.deleteSession(s.chatId)}
              />
            )}
          </For>
        </div>
      </Show>
    </nav>
  );
};
