import { For, Show, createSignal, type JSX } from 'solid-js';
import type { SessionStore } from '@/state/sessionStore';
import { readPanelCollapsed, writePanelCollapsed } from '@/state/sessionStorage';
import { SessionListItem } from './SessionListItem';
import { CapWarningToast } from './CapWarningToast';

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
  isDrawer: boolean;
  drawerOpen?: () => boolean;
  onDrawerClose?: () => void;
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

  const [collapsed, setCollapsed] = createSignal(props.isFullPage ? readPanelCollapsed(props.store.chatflowid) : false);
  const toggleCollapsed = () => {
    if (!props.isFullPage) return;
    const next = !collapsed();
    setCollapsed(next);
    writePanelCollapsed(props.store.chatflowid, next);
  };

  const handleNewChat = () => {
    props.store.actions.newChat();
  };
  const handleSwitch = (id: string) => {
    props.store.actions.switchSession(id);
    if (props.isDrawer) props.onDrawerClose?.();
  };

  // Render helper, NOT a component. Do not add lifecycle primitives
  // (createEffect, onMount, onCleanup) or new signals here — those must live
  // in component scope so Solid can track ownership correctly. Pure JSX +
  // signal reads only.
  const panelBody = (): JSX.Element => (
    <>
      <div
        style={{
          padding: '12px',
          'border-bottom': `1px solid ${border()}`,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          'font-weight': 600,
          'font-size': '13px',
        }}
      >
        <Show when={!collapsed()}>
          <span>Conversations</span>
        </Show>
        <Show when={props.isFullPage}>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed() ? 'Expand conversations panel' : 'Collapse conversations panel'}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              'font-size': '14px',
              color: 'inherit',
            }}
          >
            {collapsed() ? '☰' : '⟨'}
          </button>
        </Show>
      </div>

      <Show when={!collapsed()}>
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

        <CapWarningToast
          visible={props.store.capWarning()}
          text={props.panelTheme?.capWarningText ?? 'Conversation limit reached. Starting new ones will remove the oldest.'}
          onDismiss={() => props.store.actions.dismissCapWarning()}
        />

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
      </Show>
    </>
  );

  return (
    <Show
      when={props.isDrawer}
      fallback={
        <nav
          role="navigation"
          aria-label="Conversations"
          style={{
            width: collapsed() ? px(props.panelTheme?.collapsedWidth, '44px') : px(props.panelTheme?.width, '260px'),
            background: bg(),
            color: fg(),
            'border-right': `1px solid ${border()}`,
            display: 'flex',
            'flex-direction': 'column',
            height: '100%',
            transition: 'width 150ms ease',
          }}
        >
          {panelBody()}
        </nav>
      }
    >
      <Show when={props.drawerOpen?.() ?? false}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.25)',
            'z-index': 5,
          }}
          onClick={() => props.onDrawerClose?.()}
          aria-hidden="true"
        />
        <nav
          role="navigation"
          aria-label="Conversations"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '75%',
            'z-index': 6,
            background: bg(),
            color: fg(),
            display: 'flex',
            'flex-direction': 'column',
            'box-shadow': '2px 0 8px rgba(0,0,0,0.2)',
          }}
        >
          {panelBody()}
        </nav>
      </Show>
    </Show>
  );
};
