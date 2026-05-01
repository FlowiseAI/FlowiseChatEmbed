import { For, Show, createEffect, createSignal, onCleanup, onMount, type JSX } from 'solid-js';
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
  // Brand accent (typically userMessage.backgroundColor) — drives the
  // "+ New chat" button, the active row highlight, hover feedback, and a
  // subtle hue on the panel background. Each is overridable via panelTheme.*.
  chatBrandColor: string;
};

const px = (v: string | number | undefined, fallback: string) => (v === undefined ? fallback : typeof v === 'number' ? `${v}px` : v);

// Mix the brand color toward white at the given percent, using CSS color-mix.
// e.g. tint('#3B81F6', 4) → 4% brand on a 96% white base.
const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, white)`;
// Overlay the brand color at the given alpha (against whatever sits beneath).
const overlay = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

export const SessionPanel = (props: Props) => {
  const sessions = () => props.store.sessions();
  const starred = () => props.store.starredSessions();
  const recents = () => props.store.recentSessions();
  const activeId = () => props.store.activeChatId();
  const newChatLabel = () => props.panelTheme?.newChatLabel ?? 'New chat';
  const emptyText = () => props.panelTheme?.emptyStateText ?? 'No conversations yet';

  const brand = () => props.chatBrandColor;

  // Brand-driven palette with explicit overrides falling through.
  const bg = () => props.panelTheme?.backgroundColor ?? tint(brand(), 4);
  const fg = () => props.panelTheme?.textColor ?? props.chatWindowText ?? '#1f2937';
  const mutedFg = () => 'color-mix(in srgb, currentColor 60%, transparent)';
  const activeBg = () => props.panelTheme?.activeBackgroundColor ?? overlay(brand(), 14);
  const activeFg = () => props.panelTheme?.activeTextColor ?? brand();
  const hoverBg = () => props.panelTheme?.hoverBackgroundColor ?? overlay(brand(), 7);
  const border = () => props.panelTheme?.borderColor ?? overlay(brand(), 12);
  // Default: subdued left-aligned "compose" affordance matching ChatGPT/Claude/
  // Gemini patterns — transparent bg, hover gives a subtle brand-tinted feedback.
  // Embedders can opt into a prominent solid button by setting
  // panelTheme.newChatButtonColor (we honor that and switch to solid styling).
  const isNewBtnSolid = () => props.panelTheme?.newChatButtonColor !== undefined;
  const newBtnBg = () => props.panelTheme?.newChatButtonColor ?? 'transparent';
  const newBtnFg = () => props.panelTheme?.newChatButtonTextColor ?? (isNewBtnSolid() ? '#ffffff' : 'inherit');

  const [collapsed, setCollapsed] = createSignal(props.isFullPage ? readPanelCollapsed(props.store.chatflowid) : false);
  const [newBtnHovered, setNewBtnHovered] = createSignal(false);
  const [collapseBtnHovered, setCollapseBtnHovered] = createSignal(false);

  // Edit/delete state lives at the panel level keyed by chatId. Solid's <For>
  // re-mounts a SessionListItem whenever the SessionV2 reference changes, and
  // the streaming session's reference changes on every token (auto-title bump).
  // Holding state inside the row would reset edits mid-stream — keep it here.
  const [editingChatId, setEditingChatId] = createSignal<string | null>(null);
  const [editingDraft, setEditingDraft] = createSignal('');
  const [confirmingDeleteChatId, setConfirmingDeleteChatId] = createSignal<string | null>(null);
  const startEditing = (chatId: string, currentTitle: string) => {
    setEditingDraft(currentTitle);
    setEditingChatId(chatId);
  };
  const cancelEditing = () => setEditingChatId(null);
  const commitEditing = (chatId: string) => {
    const next = editingDraft();
    props.store.actions.renameSession(chatId, next);
    setEditingChatId(null);
  };

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

  const onListKey = (e: KeyboardEvent) => {
    const target = e.currentTarget as HTMLElement;
    const items = target.querySelectorAll<HTMLElement>('[role="listitem"]');
    if (items.length === 0) return;
    const focused = document.activeElement as HTMLElement | null;
    let idx = -1;
    items.forEach((el, i) => {
      if (el === focused) idx = i;
    });
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[Math.min(items.length - 1, Math.max(idx + 1, 0))].focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[Math.max(0, idx - 1)].focus();
    }
  };

  let drawerRoot: HTMLElement | undefined;

  createEffect(() => {
    if (!props.isDrawer) return;
    const open = props.drawerOpen?.() ?? false;
    if (open && drawerRoot) {
      queueMicrotask(() => {
        const first = drawerRoot?.querySelector<HTMLElement>('button, [tabindex="0"]');
        first?.focus();
      });
    }
  });

  const onEscapeKey = (e: KeyboardEvent) => {
    if (!props.isDrawer || !(props.drawerOpen?.() ?? false)) return;
    if (e.key === 'Escape') props.onDrawerClose?.();
  };
  onMount(() => document.addEventListener('keydown', onEscapeKey));
  onCleanup(() => document.removeEventListener('keydown', onEscapeKey));

  // Render helpers, NOT components. Do not add lifecycle primitives
  // (createEffect, onMount, onCleanup) or new signals here — those must live
  // in component scope so Solid can track ownership correctly. Pure JSX +
  // signal reads only.
  type SessionRow = ReturnType<typeof props.store.starredSessions>[number];
  const renderItem = (s: SessionRow): JSX.Element => (
    <SessionListItem
      session={s}
      active={s.chatId === activeId()}
      editing={editingChatId() === s.chatId}
      editingDraft={editingDraft()}
      confirmingDelete={confirmingDeleteChatId() === s.chatId}
      theme={{
        textColor: fg(),
        activeBackgroundColor: activeBg(),
        activeTextColor: activeFg(),
        hoverBackgroundColor: hoverBg(),
        accentColor: brand(),
      }}
      onSwitch={() => handleSwitch(s.chatId)}
      onStartEdit={() => startEditing(s.chatId, s.title)}
      onChangeDraft={(next: string) => setEditingDraft(next)}
      onCommitEdit={() => commitEditing(s.chatId)}
      onCancelEdit={cancelEditing}
      onStartDelete={() => setConfirmingDeleteChatId(s.chatId)}
      onCancelDelete={() => setConfirmingDeleteChatId(null)}
      onConfirmDelete={() => {
        setConfirmingDeleteChatId(null);
        props.store.actions.deleteSession(s.chatId);
      }}
      onToggleStar={() => props.store.actions.toggleStarred(s.chatId)}
    />
  );

  const panelBody = (): JSX.Element => (
    <>
      <div
        style={{
          padding: collapsed() ? '14px 8px' : '14px 16px',
          display: 'flex',
          'align-items': 'center',
          'justify-content': collapsed() ? 'center' : 'space-between',
          'min-height': '52px',
          'box-sizing': 'border-box',
        }}
      >
        <Show when={!collapsed()}>
          <span
            style={{
              'font-size': '12px',
              'font-weight': 600,
              'letter-spacing': '0.04em',
              'text-transform': 'uppercase',
              color: mutedFg(),
            }}
          >
            Chats
          </span>
        </Show>
        <Show when={props.isFullPage}>
          <button
            type="button"
            onClick={toggleCollapsed}
            onMouseEnter={() => setCollapseBtnHovered(true)}
            onMouseLeave={() => setCollapseBtnHovered(false)}
            aria-label={collapsed() ? 'Expand conversations panel' : 'Collapse conversations panel'}
            style={{
              background: collapseBtnHovered() ? hoverBg() : 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              padding: '6px',
              'border-radius': '6px',
              display: 'inline-flex',
              'align-items': 'center',
              'justify-content': 'center',
              transition: 'background 120ms ease',
            }}
          >
            <Show
              when={collapsed()}
              fallback={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </Show>
          </button>
        </Show>
      </div>

      <Show when={!collapsed()}>
        <div style={{ padding: '0 8px 4px 8px' }}>
          <button
            type="button"
            onClick={handleNewChat}
            onMouseEnter={() => setNewBtnHovered(true)}
            onMouseLeave={() => setNewBtnHovered(false)}
            style={{
              width: '100%',
              background: isNewBtnSolid()
                ? newBtnHovered()
                  ? `color-mix(in srgb, ${newBtnBg()} 88%, black)`
                  : newBtnBg()
                : newBtnHovered()
                  ? hoverBg()
                  : 'transparent',
              color: newBtnFg(),
              border: 'none',
              padding: '8px 10px 8px 14px',
              'border-radius': '8px',
              'font-size': '13px',
              'font-weight': 500,
              cursor: 'pointer',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'flex-start',
              gap: '10px',
              transition: 'background 120ms ease',
              'text-align': 'left',
              ...(isNewBtnSolid() ? { 'box-shadow': '0 1px 2px rgba(0,0,0,0.04)' } : {}),
            }}
          >
            <svg
              fill="#000000"
              width="16px"
              height="16px"
              viewBox="0 0 24 24"
              id="plus"
              data-name="Line Color"
              xmlns="http://www.w3.org/2000/svg"
              class="icon line-color"
            >
              <path
                id="primary"
                d="M5,12H19M12,5V19"
                style={{ fill: 'none', stroke: 'rgb(0, 0, 0)', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2' }}
              />
            </svg>
            <span>{newChatLabel()}</span>
          </button>
        </div>

        <CapWarningToast
          visible={props.store.capWarning()}
          text={props.panelTheme?.capWarningText ?? 'Conversation limit reached. Starting new ones will remove the oldest.'}
          onDismiss={() => props.store.actions.dismissCapWarning()}
        />

        <Show
          when={sessions().length > 0}
          fallback={<div style={{ padding: '32px 16px', 'text-align': 'center', 'font-size': '12px', color: mutedFg() }}>{emptyText()}</div>}
        >
          <div role="list" onKeyDown={onListKey} style={{ flex: 1, overflow: 'auto', padding: '4px 8px 12px 8px' }}>
            <Show when={starred().length > 0}>
              <div
                aria-hidden="true"
                style={{
                  padding: '8px 6px 4px 6px',
                  'font-size': '11px',
                  'font-weight': 600,
                  'letter-spacing': '0.04em',
                  'text-transform': 'uppercase',
                  color: mutedFg(),
                }}
              >
                Starred
              </div>
              <For each={starred()}>{(s) => renderItem(s)}</For>
              <Show when={recents().length > 0}>
                <div
                  aria-hidden="true"
                  style={{
                    padding: '12px 6px 4px 6px',
                    'font-size': '11px',
                    'font-weight': 600,
                    'letter-spacing': '0.04em',
                    'text-transform': 'uppercase',
                    color: mutedFg(),
                  }}
                >
                  Recents
                </div>
              </Show>
            </Show>
            <For each={recents()}>{(s) => renderItem(s)}</For>
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
            width: collapsed() ? px(props.panelTheme?.collapsedWidth, '52px') : px(props.panelTheme?.width, '272px'),
            background: bg(),
            color: fg(),
            'border-right': `1px solid ${border()}`,
            display: 'flex',
            'flex-direction': 'column',
            height: '100%',
            transition: 'width 180ms cubic-bezier(0.4, 0, 0.2, 1)',
            'font-family': 'inherit',
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
            background: 'rgba(0,0,0,0.32)',
            'z-index': 5,
            'backdrop-filter': 'blur(2px)',
          }}
          onClick={() => props.onDrawerClose?.()}
          aria-hidden="true"
        />
        <nav
          ref={drawerRoot}
          role="navigation"
          aria-label="Conversations"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '78%',
            'max-width': '320px',
            'z-index': 6,
            background: bg(),
            color: fg(),
            display: 'flex',
            'flex-direction': 'column',
            'box-shadow': '4px 0 24px rgba(0,0,0,0.18)',
            'font-family': 'inherit',
          }}
        >
          chloe
          {panelBody()}
        </nav>
      </Show>
    </Show>
  );
};
