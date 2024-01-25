import { ShortTextInput } from './ShortTextInput';
import { isMobile } from '@/utils/isMobileSignal';
import { createSignal, createEffect, onMount } from 'solid-js';
import { DeleteButton, SendButton } from '@/components/SendButton';

type Props = {
  placeholder?: string;
  backgroundColor?: string;
  textColor?: string;
  sendButtonColor?: string;
  defaultValue?: string;
  fontSize?: number;
  disabled?: boolean;
  onSubmit: (value: string) => void;
  isFullPage?: boolean;
  clearChat: () => void;
  isDeleteEnabled: boolean;
};

const defaultBackgroundColor = '#ffffff';
const defaultTextColor = '#303235';

export const TextInput = (props: Props) => {
  const [inputValue, setInputValue] = createSignal(props.defaultValue ?? '');
  let inputRef: HTMLInputElement | HTMLTextAreaElement | undefined;

  const handleInput = (inputValue: string) => setInputValue(inputValue);

  const checkIfInputIsValid = () => inputValue() !== '' && inputRef?.reportValidity();

  const submit = () => {
    if (checkIfInputIsValid()) props.onSubmit(inputValue());
    setInputValue('');
  };

  const submitWhenEnter = (e: KeyboardEvent) => {
    // Check if IME composition is in progress
    const isIMEComposition = e.isComposing || e.keyCode === 229;
    if (e.key === 'Enter' && !isIMEComposition) submit();
  };

  createEffect(() => {
    if (!props.disabled && !isMobile() && inputRef) inputRef.focus();
  });

  onMount(() => {
    if (!isMobile() && inputRef) inputRef.focus();
  });

  return (
    <div
      class={(props.isFullPage? "" : "rounded-b-3xl") + ' flex items-end justify-between chatbot-input shadow-sm h-14'}
      data-testid="input"
      style={{
        'border-top': '1px solid #eeeeee',
        position: 'absolute',
        left: '0px',
        right: '0px',
        bottom: '0px',
        margin: 'auto',
        'z-index': 1000,
        'background-color': props.backgroundColor ?? defaultBackgroundColor,
        color: props.textColor ?? defaultTextColor,
      }}
      onKeyDown={submitWhenEnter}
    >
      <ShortTextInput
        ref={inputRef as HTMLInputElement}
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
        class="my-2"
        on:click={submit}
      >
        <span style={{ 'font-family': 'Poppins, sans-serif' }}>Send</span>
      </SendButton>
      <DeleteButton
        sendButtonColor={props.sendButtonColor}
        type="button"
        isDisabled={!props.isDeleteEnabled}
        class="my-2"
        on:click={props.clearChat}
      >
        <span style={{ 'font-family': 'Poppins, sans-serif' }}>Clear</span>
      </DeleteButton> 
    </div>
  );
};
