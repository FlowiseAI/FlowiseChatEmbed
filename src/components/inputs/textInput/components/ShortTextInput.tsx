import { splitProps } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';

type ShortTextInputProps = {
  ref: HTMLInputElement | HTMLTextAreaElement | undefined;
  onInput: (value: string) => void;
  fontSize?: number;
  disabled?: boolean;
} & Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onInput'>;

export const ShortTextInput = (props: ShortTextInputProps) => {
  const [local, others] = splitProps(props, ['ref', 'onInput']);

  return (
    <textarea
      ref={props.ref}
      class="focus:outline-none bg-transparent px-2 py-4 flex-1 w-full text-input disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100"
      disabled={props.disabled}
      style={{ 'font-size': props.fontSize ? `${props.fontSize}px` : '16px', resize: 'none' }}
      onInput={(e) => local.onInput(e.currentTarget.value)}
      rows={1}
      {...others}
    />
  );
};
