import { Show } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';
import { Spinner } from './SendButton';

type StopButtonProps = {
  sendButtonColor?: string;
  isDisabled?: boolean;
  isStopping?: boolean;
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="send-icon flex">
    <circle cx="12" cy="12" r="11" stroke="red" stroke-width="2" fill="none" />
    <rect x="8" y="8" width="8" height="8" rx="1" fill="red" />
  </svg>
);

export const StopButton = (props: StopButtonProps) => {
  return (
    <button
      type="button"
      disabled={props.isDisabled}
      {...props}
      class={
        'py-2 px-4 justify-center font-semibold text-white focus:outline-none flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 transition-all filter hover:brightness-90 active:brightness-75 chatbot-button ' +
        props.class
      }
      style={{ background: 'transparent', border: 'none' }}
      title={props.isStopping ? 'Stopping...' : 'Stop'}
    >
      <Show when={!props.isStopping} fallback={<Spinner class="text-red-500" />}>
        <StopIcon />
      </Show>
    </button>
  );
};
