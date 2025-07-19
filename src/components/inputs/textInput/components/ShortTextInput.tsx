import { createSignal, onMount, splitProps, createEffect } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';

type ShortTextInputProps = {
  ref?: (el: HTMLTextAreaElement) => void;
  onInput: (value: string) => void;
  fontSize?: number;
  disabled?: boolean;
  value: string;
  placeholder?: string;
} & Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onInput'>;

const DEFAULT_HEIGHT = 8;
const MAX_HEIGHT = 112;

export const ShortTextInput = (props: ShortTextInputProps) => {
  const [local, others] = splitProps(props, ['ref', 'onInput', 'fontSize', 'disabled', 'value', 'placeholder']);
  const [height, setHeight] = createSignal(DEFAULT_HEIGHT);
  let textareaRef: HTMLTextAreaElement;

  const updateHeight = () => {
    if (!textareaRef) return;
    textareaRef.style.height = 'auto';
    const raw = textareaRef.scrollHeight;
    const newH = Math.max(DEFAULT_HEIGHT, Math.min(raw, MAX_HEIGHT));
    setHeight(newH);
    textareaRef.style.height = `${newH}px`;
    textareaRef.style.overflowY = raw > MAX_HEIGHT ? 'auto' : 'hidden';
  };

  const handleInput = (e: InputEvent) => {
    const t = e.currentTarget as HTMLTextAreaElement;
    local.onInput(t.value);
    updateHeight();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      const t = e.currentTarget as HTMLTextAreaElement;
      const pos = t.selectionStart;
      t.value = t.value.slice(0, pos) + '\n' + t.value.slice(pos);
      t.selectionStart = t.selectionEnd = pos + 1;
      local.onInput(t.value);
      updateHeight();
    }
  };

  onMount(updateHeight);

  // collapse back when cleared
  createEffect(() => {
    if (props.value.trim() === '') updateHeight();
  });

  return (
    <textarea
      ref={(el) => {
        textareaRef = el!;
        if (typeof local.ref === 'function') local.ref(el!);
      }}
      class="w-full px-2 py-1.5 resize-none focus:outline-none"
      style={{
        height: `${height()}px`,
        'min-height': `${DEFAULT_HEIGHT}px`,
        'max-height': `${MAX_HEIGHT}px`,
        'line-height': `1.5 em`,
        'font-size': props.fontSize ? `${props.fontSize}px` : '16px',
        'box-sizing': 'border-box',
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
