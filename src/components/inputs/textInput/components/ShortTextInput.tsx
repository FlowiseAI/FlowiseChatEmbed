import { createSignal, splitProps } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';

type ShortTextInputProps = {
  ref: HTMLInputElement | HTMLTextAreaElement | undefined;
  onInput: (value: string) => void;
  fontSize?: number;
  disabled?: boolean;
  compact?: boolean;
} & Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onInput'>;

const LEGACY_HEIGHT = 56;
const COMPACT_HEIGHT = 42;

export const ShortTextInput = (props: ShortTextInputProps) => {
  const [local, others] = splitProps(props, ['ref', 'onInput', 'compact']);
  const defaultHeight = () => (local.compact ? COMPACT_HEIGHT : LEGACY_HEIGHT);
  const [height, setHeight] = createSignal(defaultHeight());

  // @ts-expect-error: unknown type
  const handleInput = (e) => {
    if (props.ref) {
      if (e.currentTarget.value === '') {
        setHeight(defaultHeight());
      } else {
        setHeight(e.currentTarget.scrollHeight - 24);
      }
      e.currentTarget.scrollTo(0, e.currentTarget.scrollHeight);
      local.onInput(e.currentTarget.value);
    }
  };

  // @ts-expect-error: unknown type
  const handleKeyDown = (e) => {
    if (e.keyCode == 13 && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.value += '\n';
      handleInput(e);
    }
  };

  return (
    <textarea
      ref={props.ref}
      class={
        local.compact
          ? 'focus:outline-none bg-transparent px-3 pt-3 pb-1 flex-1 w-full h-full min-h-[42px] max-h-[128px] text-input disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 '
          : 'focus:outline-none bg-transparent px-4 py-4 flex-1 w-full h-full min-h-[56px] max-h-[128px] text-input disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 '
      }
      disabled={props.disabled}
      style={{
        'font-size': props.fontSize ? `${props.fontSize}px` : '16px',
        resize: 'none',
        height: `${props.value !== '' ? height() : defaultHeight()}px`,
      }}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      {...others}
    />
  );
};
