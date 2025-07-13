import { ShortTextInput } from './ShortTextInput';
import { isMobile } from '@/utils/isMobileSignal';
import { Show, createSignal, createEffect, onMount, Setter } from 'solid-js';
import { SendButton } from '@/components/buttons/SendButton';
import { CancelButton } from '@/components/buttons/CancelButton';

import { FileEvent, UploadsConfig } from '@/components/Bot';
import { ImageUploadButton } from '@/components/buttons/ImageUploadButton';
import { RecordAudioButton } from '@/components/buttons/RecordAudioButton';
import { AttachmentUploadButton } from '@/components/buttons/AttachmentUploadButton';
import { ChatInputHistory } from '@/utils/chatInputHistory';

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

const defaultBackgroundColor = '#ffffff';
const defaultTextColor = '#000000';
const defaultSendSound = 'https://cdn.jsdelivr.net/gh/FlowiseAI/FlowiseChatEmbed@latest/src/assets/send_message.mp3';

export const TextInput = (props: TextInputProps) => {
  const [isSendButtonDisabled, setIsSendButtonDisabled] = createSignal(false);
  const [warningMessage, setWarningMessage] = createSignal('');
  const [inputHistory] = createSignal(new ChatInputHistory(() => props.maxHistorySize || 10));

  let inputRef: HTMLTextAreaElement | undefined;
  let audioRef: HTMLAudioElement | undefined;
  let fileUploadRef: HTMLInputElement | undefined;
  let imgUploadRef: HTMLInputElement | undefined;

  const handleInput = (inputValue: string) => {
    const wordCount = inputValue.length;
    if (props.maxChars && wordCount > props.maxChars) {
      setWarningMessage(props.maxCharsWarningMessage ?? `You exceeded the characters limit. Please input less than ${props.maxChars} characters.`);
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
      if (props.sendMessageSound && audioRef) {
        audioRef.play();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const isIMEComposition = e.isComposing || e.keyCode === 229;
      if (!isIMEComposition) {
        e.preventDefault();
        submit();
      }
    } else if (props.enableInputHistory) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const previousInput = inputHistory().getPreviousInput(props.inputValue);
        props.onInputChange(previousInput);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextInput = inputHistory().getNextInput();
        props.onInputChange(nextInput);
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
      audioRef = new Audio(props.sendSoundLocation || defaultSendSound);
    }
  });

  const handleFileChange = (event: FileEvent<HTMLInputElement>) => {
    props.handleFileChange(event);
    if (event.target) event.target.value = '';
  };

  const getFileType = () => {
    if (props.isFullFileUpload) return props.fullFileUploadAllowedTypes === '' ? '*' : props.fullFileUploadAllowedTypes;
    if (props.uploadsConfig?.fileUploadSizeAndTypes?.length) {
      const allowedFileTypes = props.uploadsConfig.fileUploadSizeAndTypes.map(f => f.fileTypes).join(',');
      return allowedFileTypes.includes('*') ? '*' : allowedFileTypes;
    }
    return '*';
  };

  return (
    <div class="w-full flex justify-center px-2 mt-3 z-0">
      <div
        class="
          max-w-2xl w-full flex flex-col p-3 border border-black
          bg-white text-black rounded-xl shadow
          chatbot-input
        "
        style={{
          color: props.textColor ?? defaultTextColor,
          'background-color': props.backgroundColor ?? defaultBackgroundColor,
        }}
        onKeyDown={handleKeyDown}
        data-testid="input"
      >
        <Show when={warningMessage() !== ''}>
          <div class="text-red-500 text-sm px-1 pb-1" data-testid="warning-message">
            {warningMessage()}
          </div>
        </Show>

        <div class="w-full flex flex-col gap-2">
          {/* Text Input */}
          <ShortTextInput
            ref={(el) => (inputRef = el)}
            onInput={handleInput}
            value={props.inputValue}
            fontSize={props.fontSize}
            disabled={props.disabled}
            placeholder={props.placeholder ?? 'Type your message...'}
          />

          {/* Buttons Row BELOW input */}
          <div class="flex justify-between items-center w-full">
            <div class="flex items-center gap-2">
              {props.uploadsConfig?.isRAGFileUploadAllowed && (
                <>
                  <AttachmentUploadButton
                    buttonColor={props.sendButtonColor}
                    class="h-9"
                    isDisabled={props.disabled || isSendButtonDisabled()}
                    on:click={() => fileUploadRef?.click()}
                  />
                  <input
                    style={{ display: 'none' }}
                    multiple
                    ref={el => (fileUploadRef = el)}
                    type="file"
                    onChange={handleFileChange}
                    accept={getFileType()}
                  />
                </>
              )}

              {props.uploadsConfig?.isImageUploadAllowed && (
                <>
                  <ImageUploadButton
                    buttonColor={props.sendButtonColor}
                    class="h-9"
                    isDisabled={props.disabled || isSendButtonDisabled()}
                    on:click={() => imgUploadRef?.click()}
                  >
                    Image
                  </ImageUploadButton>
                  <input
                    style={{ display: 'none' }}
                    multiple
                    ref={el => (imgUploadRef = el)}
                    type="file"
                    onChange={handleFileChange}
                    accept={props.uploadsConfig.imgUploadSizeAndTypes?.map(a => a.fileTypes).join(',') || '*'}
                  />
                </>
              )}
            </div>

            <SendButton
              sendButtonColor={props.sendButtonColor}
              isDisabled={props.disabled || isSendButtonDisabled()}
              class="h-9"
              onClick={submit}
            >
              Send
            </SendButton>
          </div>
        </div>

        {/* Optional: Stop button row */}
        <div class="mt-3 w-full flex justify-end gap-2">
          <Show when={props.showStopButton}>
            <CancelButton
              buttonColor={props.sendButtonColor}
              class="h-10"
              isDisabled={false}
              onClick={props.onStopButtonClick}
            >
              Stop
            </CancelButton>
          </Show>
        </div>
      </div>
    </div>
  );
};
