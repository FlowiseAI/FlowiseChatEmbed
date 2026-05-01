import { Show, createContext, createMemo, createSignal, onCleanup, onMount, useContext } from 'solid-js';
import { Bot, type BotProps } from '@/components/Bot';
import { SessionPanel } from './SessionPanel';
import { createSessionStore, type SessionStore } from '@/state/sessionStore';
import { v4 as uuidv4 } from 'uuid';

const SessionContext = createContext<SessionStore | undefined>();

export const useSessionStore = (): SessionStore | undefined => useContext(SessionContext);

// `theme` is widened to `unknown` here because each mount mode (bubble/full/popup)
// has its own theme shape; Task 21 will tighten this with the actual theme types.
type ChatRootProps = BotProps & { class?: string; theme?: unknown };

export const ChatRoot = (props: ChatRootProps) => {
  const enabled = () => props.multiSession?.enabled === true;

  return (
    <Show when={enabled()} fallback={<Bot {...props} />}>
      <ChatRootEnabled {...props} />
    </Show>
  );
};

// Inner component so that createSessionStore (which runs loadOrMigrate and may
// persist a v2 index on first read) only executes when multiSession is enabled.
const ChatRootEnabled = (props: ChatRootProps) => {
  const newChatId = () => {
    const customerId = (props.chatflowConfig as { vars?: { customerId?: string } } | undefined)?.vars?.customerId;
    return customerId ? `${customerId.toString()}+${uuidv4()}` : uuidv4();
  };

  const store = createSessionStore({
    chatflowid: props.chatflowid,
    newChatId,
    maxSessions: props.multiSession?.maxSessions,
  });

  // Theme cascade: every mount surface passes `theme` as a structured object;
  // Task 21 will tighten the typing per mode.
  const panelTheme = createMemo(() => {
    const themeAny = (props as unknown as Record<string, any>).theme;
    return themeAny?.chatWindow?.sessionPanel ?? undefined;
  });

  // Brand accent: drive the panel's active highlight, "+ New chat" button, and
  // subtle background hue from the user-message bubble color (the chat's most
  // prominent brand color). Falls back to GuestBubble's default if unset.
  const chatBrandColor = createMemo<string>(() => {
    const themeAny = (props as unknown as Record<string, any>).theme;
    return themeAny?.chatWindow?.userMessage?.backgroundColor ?? '#3B81F6';
  });

  const isDrawer = !props.isFullPage;
  const [drawerOpen, setDrawerOpen] = createSignal(false);
  const onToggleDrawer = () => setDrawerOpen((v) => !v);
  onMount(() => window.addEventListener('flowise-toggle-session-drawer', onToggleDrawer));
  onCleanup(() => window.removeEventListener('flowise-toggle-session-drawer', onToggleDrawer));

  const onNew = () => store.actions.newChat();
  const onSwitch = (e: Event) => {
    const detail = (e as CustomEvent<{ chatId?: string }>).detail;
    if (detail?.chatId) store.actions.switchSession(detail.chatId);
  };
  const onClear = () => {
    store.actions.deleteSession(store.activeChatId());
  };

  store.actions.setOnSessionChanged((detail) => {
    window.dispatchEvent(new CustomEvent('flowise-session-changed', { detail }));
  });

  onMount(() => {
    window.addEventListener('flowise-new-session', onNew);
    window.addEventListener('flowise-switch-session', onSwitch);
    window.addEventListener('flowise-clear-chat', onClear);
  });
  onCleanup(() => {
    window.removeEventListener('flowise-new-session', onNew);
    window.removeEventListener('flowise-switch-session', onSwitch);
    window.removeEventListener('flowise-clear-chat', onClear);
    store.dispose();
  });

  return (
    <SessionContext.Provider value={store}>
      <div class="flex h-full w-full" data-multisession style={{ position: 'relative' }}>
        <SessionPanel
          store={store}
          isFullPage={!!props.isFullPage}
          isDrawer={isDrawer}
          drawerOpen={drawerOpen}
          onDrawerClose={() => setDrawerOpen(false)}
          panelTheme={panelTheme()}
          chatWindowBackground={props.backgroundColor}
          chatBrandColor={chatBrandColor()}
        />
        <div style={{ flex: 1, height: '100%' }}>
          <Bot {...props} />
        </div>
      </div>
    </SessionContext.Provider>
  );
};
