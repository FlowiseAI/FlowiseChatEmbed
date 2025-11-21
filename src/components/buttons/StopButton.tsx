import { JSX } from 'solid-js/jsx-runtime';
import { SquareStopIcon } from '../icons';

type StopButtonProps = {
  buttonColor?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  disableIcon?: boolean;
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;

export const StopButton = (props: StopButtonProps) => {
  return (
    <button
      type="button"
      disabled={props.isDisabled || props.isLoading}
      {...props}
      class={
        'py-2 px-4 justify-center font-semibold focus:outline-none flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 transition-all filter hover:brightness-90 active:brightness-75 chatbot-button ' +
        props.class
      }
      style={{ background: 'transparent', border: 'none' }}
    >
      <SquareStopIcon color={props.buttonColor} />
    </button>
  );
};
