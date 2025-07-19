import { ShortTextInput } from './ShortTextInput';
import { isMobile } from '@/utils/isMobileSignal';
import { Show, createSignal, createEffect, onMount, Setter } from 'solid-js';
import { SendButton } from '@/components/buttons/SendButton';
import { CancelButton } from '@/components/buttons/CancelButton';

import { FileEvent, UploadsConfig } from '@/components/Bot';
import { AttachmentUploadButton } from '@/components/buttons/AttachmentUploadButton';
import { ChatInputHistory } from '@/utils/chatInputHistory';

// Props definition

type TextInputProps = {
  placeholder?: string;
  backgroundColor?: string;
  textColor?: string;
  sendButtonColor?: string;
  inputValue: string;
  fontSize?: number;
  disabled?: boolean;
  onSubmit: (value: string) => void;
  onInputChange: (value: string) => void;
  uploadsConfig?: Partial<UploadsConfig>;
  isFullFileUpload?: boolean;
  setPreviews: Setter<unknown[]>;
  onMicrophoneClicked: () => void;
  handleFileChange: (event: FileEvent<HTMLInputElement>) => void;
  maxChars?: number;
  maxCharsWarningMessage?: string;
  autoFocus?: boolean;
  sendMessageSound?: boolean;
  sendSoundLocation?: string;
  fullFileUploadAllowedTypes?: string;
  enableInputHistory?: boolean;
  maxHistorySize?: number;
  showStopButton?: boolean;
  onStopButtonClick?: () => void;
};

const defaultBackgroundColor = '#FFFFFF';
const defaultTextColor = '#000000';

export const TextInput = (props: TextInputProps) => {
  const [isSendButtonDisabled, setIsSendButtonDisabled] = createSignal(false);
  const [warningMessage, setWarningMessage] = createSignal('');
  const [inputHistory] = createSignal(new ChatInputHistory(() => props.maxHistorySize || 10));
  let inputRef: HTMLTextAreaElement | undefined;
  let fileUploadRef: HTMLInputElement | undefined;
  let audioRef: HTMLAudioElement | undefined;

  const handleInput = (inputValue: string) => {
    if (props.maxChars && inputValue.length > props.maxChars) {
      setWarningMessage(props.maxCharsWarningMessage ?? `Max ${props.maxChars} characters.`);
      setIsSendButtonDisabled(true);
      return;
    }
    props.onInputChange(inputValue);
    setWarningMessage('');
    setIsSendButtonDisabled(false);
  };

  const checkIfInputIsValid = () => warningMessage() === '' && inputRef?.reportValidity();

  const submit = () => {
    if (checkIfInputIsValid()) {
      if (props.enableInputHistory) {
        inputHistory().addToHistory(props.inputValue);
      }
      props.onSubmit(props.inputValue);
      props.onInputChange('');
      if (props.sendMessageSound && audioRef) {
        audioRef.play();
      }
    }
  };

  createEffect(() => {
    const shouldAutoFocus = props.autoFocus !== undefined ? props.autoFocus : !isMobile() && window.innerWidth > 640;
    if (!props.disabled && shouldAutoFocus && inputRef) inputRef.focus();
  });

  onMount(() => {
    const shouldAutoFocus = props.autoFocus !== undefined ? props.autoFocus : !isMobile() && window.innerWidth > 640;
    if (!props.disabled && shouldAutoFocus && inputRef) inputRef.focus();
    if (props.sendMessageSound) {
      audioRef = new Audio(props.sendSoundLocation ?? 'https://cdn.jsdelivr.net/gh/FlowiseAI/FlowiseChatEmbed@latest/src/assets/send_message.mp3');
    }
  });

  const handleFileChange = (event: FileEvent<HTMLInputElement>) => {
    props.handleFileChange(event);
    if (event.target) event.target.value = '';
  };

  const getFileType = () => {
    if (props.isFullFileUpload) return props.fullFileUploadAllowedTypes === '' ? '*' : props.fullFileUploadAllowedTypes;
    if (props.uploadsConfig?.fileUploadSizeAndTypes?.length) {
      const allowedFileTypes = props.uploadsConfig?.fileUploadSizeAndTypes.map((allowed) => allowed.fileTypes).join(',');
      return allowedFileTypes.includes('*') ? '*' : allowedFileTypes;
    }
    return '*';
  };

  return (
    <div
      class="mx-auto max-w-4xl w-full flex items-end gap-3 px-4 py-3 border border-gray-300 bg-white text-black rounded-xl shadow-sm chatbot-input"
      style={{
        color: props.textColor ?? defaultTextColor,
        'background-color': props.backgroundColor ?? defaultBackgroundColor,
      }}
    >
      {/* Input field */}
      <div class="flex-1">
        {/* <ShortTextInput
          ref={(el) => (inputRef = el)}
          onInput={handleInput}
          value={props.inputValue}
          fontSize={props.fontSize}
          disabled={props.disabled}
          placeholder={props.placeholder ?? 'Type your message...'}
        /> */}
        <ShortTextInput
          ref={(el) => (inputRef = el)}
          onInput={handleInput}
          value={props.inputValue}
          fontSize={props.fontSize}
          disabled={props.disabled}
          placeholder={props.placeholder ?? 'Type your message...'}
          onKeyDown={(e) => {
            // Enter = send, Shift+Enter = newline
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
      </div>

      {/* File upload */}
      {props.uploadsConfig?.isRAGFileUploadAllowed && (
        <>
          <AttachmentUploadButton
            buttonColor="black"
            class="h-6 text-black"
            isDisabled={props.disabled || isSendButtonDisabled()}
            on:click={() => fileUploadRef?.click()}
          />
          <input
            style={{ display: 'none' }}
            multiple
            ref={(el) => (fileUploadRef = el)}
            type="file"
            onChange={handleFileChange}
            accept={getFileType()}
          />
        </>
      )}

      {/* Send / Stop Buttons */}
      <div class="flex gap-1 items-end">
        <Show when={props.showStopButton}>
          <CancelButton buttonColor="black" class="h-6 text-black" isDisabled={false} onClick={props.onStopButtonClick}>
            Stop
          </CancelButton>
        </Show>
        <SendButton sendButtonColor="black" class="h-6 text-black" isDisabled={props.disabled || isSendButtonDisabled()} onClick={submit}>
          Send
        </SendButton>
      </div>
    </div>
  );
};
