import { createSignal, onMount, splitProps } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';

type ShortTextInputProps = {
  ref?: (el: HTMLTextAreaElement) => void;
  onInput: (value: string) => void;
  fontSize?: number;
  disabled?: boolean;
  value: string;
  placeholder?: string;
} & Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onInput'>;

const DEFAULT_HEIGHT = 36;
const MAX_HEIGHT = 112;

export const ShortTextInput = (props: ShortTextInputProps) => {
  const [local, others] = splitProps(props, ['ref', 'onInput', 'fontSize', 'disabled', 'value', 'placeholder']);
  const [height, setHeight] = createSignal(DEFAULT_HEIGHT);

  let textareaRef: HTMLTextAreaElement | undefined;

  const updateHeight = () => {
    if (textareaRef) {
      textareaRef.style.height = 'auto';
      const newHeight = Math.min(textareaRef.scrollHeight, MAX_HEIGHT);
      setHeight(newHeight);
      textareaRef.style.height = `${newHeight}px`;
      textareaRef.scrollTop = textareaRef.scrollHeight;
    }
  };

  const handleInput = (e: InputEvent) => {
    const target = e.currentTarget as HTMLTextAreaElement;
    updateHeight();
    local.onInput(target.value);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      const target = e.currentTarget as HTMLTextAreaElement;
      const caret = target.selectionStart;
      target.value = target.value.slice(0, caret) + '\n' + target.value.slice(caret);
      target.selectionStart = target.selectionEnd = caret + 1;
      local.onInput(target.value);
      updateHeight();
    }
  };

  onMount(() => {
    updateHeight();
  });

  return (
    <textarea
      ref={(el) => {
        textareaRef = el;
        if (typeof local.ref === 'function') local.ref(el);
      }}
      class="focus:outline-none bg-transparent px-3 py-2 w-full min-h-[36px] max-h-[112px] resize-none overflow-auto"
      style={{
        'font-size': props.fontSize ? `${props.fontSize}px` : '16px',
        height: `${height()}px`,
      }}
      value={local.value}
      disabled={local.disabled}
      placeholder={local.placeholder}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      {...others}
    />
  );
};
