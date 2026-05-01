import { Show, createSignal, onCleanup, onMount } from 'solid-js';
import { useSessionStore } from './ChatRoot';

type Props = {
  isFullPage: boolean;
  // Inherit text color from the bot's title config when set so themes that
  // override colors keep working. Default is currentColor (inherits the chat
  // window's color).
  textColor?: string;
  // Bubble theme color (used when isFullPage so the hamburger is visible
  // against the chat surface). Optional.
  bubbleBackground?: string;
};

/**
 * Transparent header shown at the top of <Bot> when multiSession is enabled.
 * Replaces the blue title bar + Clear button with a minimal "left-aligned chat
 * name" + click-menu (Star / Rename / Delete) — matching ChatGPT/Claude/Gemini.
 *
 * On non-full-page mounts (bubble/popup drawer mode), a hamburger button on the
 * left toggles the session drawer.
 */
export const SessionTitleHeader = (props: Props) => {
  const store = useSessionStore();
  if (!store) return null;

  const session = () => store.activeSession();
  const title = () => session()?.title ?? 'New chat';
  const starred = () => session()?.starred === true;

  const [menuOpen, setMenuOpen] = createSignal(false);
  const [editing, setEditing] = createSignal(false);
  const [draft, setDraft] = createSignal('');

  let menuRoot: HTMLDivElement | undefined;

  const openMenu = () => {
    setMenuOpen(true);
  };
  const closeMenu = () => setMenuOpen(false);

  const onDocClick = (e: MouseEvent) => {
    if (!menuOpen()) return;
    if (menuRoot && !menuRoot.contains(e.target as Node)) closeMenu();
  };
  const onDocKey = (e: KeyboardEvent) => {
    if (menuOpen() && e.key === 'Escape') closeMenu();
  };
  onMount(() => {
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onDocKey);
  });
  onCleanup(() => {
    document.removeEventListener('mousedown', onDocClick);
    document.removeEventListener('keydown', onDocKey);
  });

  const startRename = () => {
    setDraft(title());
    setEditing(true);
    closeMenu();
  };
  const commitRename = () => {
    const id = store.activeChatId();
    store.actions.renameSession(id, draft());
    setEditing(false);
  };
  const cancelRename = () => setEditing(false);

  const handleStar = () => {
    store.actions.toggleStarred(store.activeChatId());
    closeMenu();
  };
  const handleDelete = () => {
    store.actions.deleteSession(store.activeChatId());
    closeMenu();
  };

  return (
    <div
      class="flex flex-row items-center w-full absolute top-0 left-0 z-10"
      style={{
        background: 'transparent',
        color: props.textColor ?? 'inherit',
        height: '50px',
        padding: '0 8px',
      }}
    >
      <Show when={!props.isFullPage}>
        <button
          type="button"
          aria-label="Open conversations"
          onClick={() => window.dispatchEvent(new CustomEvent('flowise-toggle-session-drawer'))}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '6px',
            'border-radius': '6px',
            display: 'inline-flex',
            'align-items': 'center',
            'justify-content': 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'color-mix(in srgb, currentColor 10%, transparent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg
            width="18"
            height="18"
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
        </button>
      </Show>

      <div ref={menuRoot} style={{ position: 'relative', flex: 1, 'min-width': 0, 'margin-left': props.isFullPage ? '4px' : '4px' }}>
        <Show
          when={editing()}
          fallback={
            <button
              type="button"
              onClick={openMenu}
              aria-label="Conversation menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen()}
              style={{
                background: menuOpen() ? 'color-mix(in srgb, currentColor 10%, transparent)' : 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '6px 10px',
                'border-radius': '6px',
                'font-size': '14px',
                'font-weight': 600,
                'max-width': '100%',
                display: 'inline-flex',
                'align-items': 'center',
                gap: '6px',
                'text-align': 'left',
                'min-width': 0,
                transition: 'background 120ms ease',
              }}
              onMouseEnter={(e) => {
                if (!menuOpen()) e.currentTarget.style.background = 'color-mix(in srgb, currentColor 8%, transparent)';
              }}
              onMouseLeave={(e) => {
                if (!menuOpen()) e.currentTarget.style.background = 'transparent';
              }}
            >
              <Show when={starred()}>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="#f59e0b"
                  stroke="#f59e0b"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  style={{ 'flex-shrink': 0 }}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </Show>
              <span
                style={{
                  overflow: 'hidden',
                  'text-overflow': 'ellipsis',
                  'white-space': 'nowrap',
                  'min-width': 0,
                }}
              >
                {title()}
              </span>
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
                style={{ opacity: 0.6, 'flex-shrink': 0 }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          }
        >
          <input
            type="text"
            value={draft()}
            onInput={(e) => setDraft(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') cancelRename();
            }}
            onBlur={cancelRename}
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
              background: 'white',
              color: '#111',
              border: '1px solid color-mix(in srgb, currentColor 30%, transparent)',
              padding: '5px 10px',
              'border-radius': '6px',
              'font-size': '14px',
              'font-weight': 600,
              outline: 'none',
              width: '100%',
              'max-width': '320px',
              'box-sizing': 'border-box',
            }}
          />
        </Show>
        <Show when={menuOpen() && !editing()}>
          <div
            role="menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              'min-width': '180px',
              background: 'white',
              color: '#1f2937',
              'border-radius': '8px',
              'box-shadow': '0 4px 16px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
              padding: '4px',
              'z-index': 20,
              'font-size': '13px',
            }}
          >
            <MenuItem
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill={starred() ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              }
              label={starred() ? 'Unstar' : 'Star'}
              onClick={handleStar}
            />
            <MenuItem
              icon={
                <svg
                  width="14"
                  height="14"
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
              }
              label="Rename"
              onClick={startRename}
            />
            <MenuItem
              icon={
                <svg
                  width="14"
                  height="14"
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
                </svg>
              }
              label="Delete"
              onClick={handleDelete}
              danger
            />
          </div>
        </Show>
      </div>
    </div>
  );
};

const MenuItem = (props: { icon: any; label: string; onClick: () => void; danger?: boolean }) => {
  const [hovered, setHovered] = createSignal(false);
  return (
    <button
      type="button"
      role="menuitem"
      onClick={props.onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        background: hovered() ? (props.danger ? 'color-mix(in srgb, #dc2626 10%, transparent)' : 'rgba(0,0,0,0.04)') : 'transparent',
        color: props.danger ? '#dc2626' : 'inherit',
        border: 'none',
        cursor: 'pointer',
        padding: '7px 10px',
        'border-radius': '5px',
        'font-size': '13px',
        display: 'flex',
        'align-items': 'center',
        gap: '10px',
        'text-align': 'left',
        transition: 'background 100ms ease',
      }}
    >
      {props.icon}
      <span>{props.label}</span>
    </button>
  );
};
