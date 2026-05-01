import { Show, createMemo } from 'solid-js';
import { Bot, type BotProps } from '@/components/Bot';
import { SessionPanel } from './SessionPanel';
import { createSessionStore } from '@/state/sessionStore';
import { v4 as uuidv4 } from 'uuid';

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

  return (
    <div class="flex h-full w-full" data-multisession>
      <SessionPanel store={store} isFullPage={!!props.isFullPage} panelTheme={panelTheme()} chatWindowBackground={props.backgroundColor} />
      <div style={{ flex: 1, height: '100%' }}>
        <Bot {...props} />
      </div>
    </div>
  );
};
