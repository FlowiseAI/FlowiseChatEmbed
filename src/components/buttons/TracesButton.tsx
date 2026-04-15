import { JSX, Show } from 'solid-js';
import { Spinner } from './SendButton';
import { TracesIcon } from '../icons';

type TracesButtonProps = {
  feedbackColor?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  disableIcon?: boolean;
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;

const defaultFeedbackColor = '#3B81F6';

export const TracesButton = (props: TracesButtonProps) => {
  return (
    <button
      type="button"
      disabled={props.isDisabled || props.isLoading}
      {...props}
      class={
        'p-1 justify-center font-semibold text-white focus:outline-none flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 transition-all filter hover:brightness-90 active:brightness-75 chatbot-button ' +
        props.class
      }
      style={{ background: 'transparent', border: 'none' }}
      title="Traces"
    >
      <Show when={!props.isLoading} fallback={<Spinner class="text-white" />}>
        <TracesIcon color={props.feedbackColor ?? defaultFeedbackColor} class={'send-icon flex ' + (props.disableIcon ? 'hidden' : '')} />
        <span class="ml-1 text-sm leading-4" style={{ color: props.feedbackColor ?? defaultFeedbackColor }}>Traces</span>
      </Show>
    </button>
  );
};
