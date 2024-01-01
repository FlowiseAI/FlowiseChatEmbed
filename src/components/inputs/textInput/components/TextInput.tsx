import { ShortTextInput } from './ShortTextInput';
import { isMobile } from '@/utils/isMobileSignal';
import { createSignal, createEffect, onMount } from 'solid-js';
import { SendButton } from '@/components/SendButton';

type Props = {
  placeholder?: string;
  backgroundColor?: string;
  textColor?: string;
  sendButtonColor?: string;
  defaultValue?: string;
  fontSize?: number;
  disabled?: boolean;
  onSubmit: (value: string) => void;
};

const defaultBackgroundColor = '#ffffff';
const defaultTextColor = '#303235';

export const TextInput = (props: Props) => {
  const [inputValue, setInputValue] = createSignal(props.defaultValue ?? '');
  let inputRef: HTMLInputElement | HTMLTextAreaElement | undefined;

  const handleInput = (inputValue: string) => setInputValue(inputValue);

  const checkIfInputIsValid = () => inputValue() !== '' && inputRef?.reportValidity();

    /* AIT: Not needed, because replaced below
    const submit = () => {
        if (checkIfInputIsValid()) props.onSubmit(inputValue())
        setInputValue('')
    };
    */

    // AIT: Make sure, that after submitting, the textbox height is resetted.
    const submit = () => {
        if (checkIfInputIsValid()) {
            props.onSubmit(inputValue());
            setInputValue('');
            if (inputRef instanceof HTMLTextAreaElement) {
                inputRef.style.height = 'auto'; // AIT: Reset height
                inputRef.style.height = `${inputRef.scrollHeight}px`; // AIT: Adjust to content
            };
        };
    };

    const submitWhenEnter = (e: KeyboardEvent) => {
        // Check if IME composition is in progress
        const isIMEComposition = e.isComposing || e.keyCode === 229
        // if (e.key === 'Enter' && !isIMEComposition) submit() // AIT: Replaced by code below
        if (e.key === 'Enter' && !isIMEComposition && !e.shiftKey) { // AIT added !e.shiftKey to prevent new line break when pressing ENTER without SHIFT
            e.preventDefault() // AIT added this to prevent the default newline behavior
            submit()
        };
    };

  createEffect(() => {
    if (!props.disabled && !isMobile() && inputRef) inputRef.focus();
  });

  onMount(() => {
    if (!isMobile() && inputRef) inputRef.focus();
  });

  return (
    <div
      class={'flex items-end justify-between chatbot-input'}
      data-testid="input"
      style={{
        'border-top': '1px solid #eeeeee',
        position: 'absolute',
        left: '20px',
        right: '20px',
        bottom: '40px',
        margin: 'auto',
        'z-index': 1000,
        'background-color': props.backgroundColor ?? defaultBackgroundColor,
        color: props.textColor ?? defaultTextColor,
      }}
      onKeyDown={submitWhenEnter}
    >
      <ShortTextInput
        ref={inputRef as HTMLTextAreaElement} // AIT: Replace HTMLInputElement with HTMLTextAreaElement
        onInput={handleInput}
        value={inputValue()}
        fontSize={props.fontSize}
        disabled={props.disabled}
        placeholder={props.placeholder ?? 'Type your question'}
      />
      <SendButton
        sendButtonColor={props.sendButtonColor}
        type="button"
        isDisabled={props.disabled || inputValue() === ''}
        class="my-2 ml-2"
        on:click={submit}
      >
        <span style={{ 'font-family': 'Poppins, sans-serif' }}>Send</span>
      </SendButton>
    </div>
  );
};
