import { JSX, Show } from 'solid-js';
import { Spinner } from './SendButton';
import { DeleteIcon as RefreshIcon } from '../icons';

type RegenerateResponseButtonProps = {
  feedbackColor?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  disableIcon?: boolean;
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;

const defaultFeedbackColor = '#3B81F6';

export const RegenerateResponseButton = (props: RegenerateResponseButtonProps) => {
  return (
    <button
      type="button"
      disabled={props.isDisabled || props.isLoading}
      {...props}
      class={
        'p-2 justify-center font-semibold text-white focus:outline-none flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 transition-all filter hover:brightness-90 active:brightness-75 chatbot-button ' +
        props.class
      }
      style={{ background: 'transparent', border: 'none' }}
      title="Regenerate response"
    >
      <Show when={!props.isLoading} fallback={<Spinner class="text-white" />}>
        <RefreshIcon color={props.feedbackColor ?? defaultFeedbackColor} class={'send-icon flex ' + (props.disableIcon ? 'hidden' : '')} />
      </Show>
    </button>
  );
};
