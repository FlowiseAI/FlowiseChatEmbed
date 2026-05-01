import { Show } from 'solid-js';
import { Bot, type BotProps } from '@/components/Bot';

type ChatRootProps = BotProps & { class?: string };

/**
 * Wraps <Bot> with the session panel slot. When multiSession is disabled,
 * renders <Bot> directly. The panel itself is added in a later task.
 */
export const ChatRoot = (props: ChatRootProps) => {
  const enabled = () => props.multiSession?.enabled === true;

  return (
    <Show when={enabled()} fallback={<Bot {...props} />}>
      <div class="flex h-full w-full" data-multisession>
        <div data-session-panel-slot />
        <Bot {...props} />
      </div>
    </Show>
  );
};
