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

  const newChatId = () => {
    const customerId = (props.chatflowConfig as { vars?: { customerId?: string } } | undefined)?.vars?.customerId;
    return customerId ? `${customerId.toString()}+${uuidv4()}` : uuidv4();
  };

  const store = createSessionStore({
    chatflowid: props.chatflowid,
    newChatId,
    maxSessions: props.multiSession?.maxSessions,
  });

  // Best-effort theme cascade — first usable theme wins (full > popup > bubble).
  const panelTheme = createMemo(() => {
    const anyProps = props as unknown as Record<string, any>;
    return anyProps.theme?.chatWindow?.sessionPanel ?? anyProps.chatWindow?.sessionPanel ?? undefined;
  });

  return (
    <Show when={enabled()} fallback={<Bot {...props} />}>
      <div class="flex h-full w-full" data-multisession>
        <SessionPanel store={store} isFullPage={!!props.isFullPage} panelTheme={panelTheme()} chatWindowBackground={props.backgroundColor} />
        <div style={{ flex: 1, height: '100%' }}>
          <Bot {...props} />
        </div>
      </div>
    </Show>
  );
};
