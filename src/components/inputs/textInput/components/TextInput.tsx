import { ShortTextInput } from './ShortTextInput';
import { isMobile } from '@/utils/isMobileSignal';
import { Show, createSignal, createEffect, onMount, Setter } from 'solid-js';
import { SendButton } from '@/components/buttons/SendButton';
import { StopButton } from '@/components/buttons/StopButton';
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
  sendButtonBackgroundColor?: string;
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
  isLoading?: boolean;
  showAbortButton?: boolean;
  isMessageStopping?: boolean;
  onAbort?: () => void;
};

const defaultBackgroundColor = '#ffffff';
const defaultTextColor = '#303235';
// CDN link for default send sound
const defaultSendSound = 'https://cdn.jsdelivr.net/gh/FlowiseAI/FlowiseChatEmbed@latest/src/assets/send_message.mp3';

export const TextInput = (props: TextInputProps) => {
  const [isSendButtonDisabled, setIsSendButtonDisabled] = createSignal(false);
  const [warningMessage, setWarningMessage] = createSignal('');
  const [inputHistory] = createSignal(new ChatInputHistory(() => props.maxHistorySize || 10));
  let inputRef: HTMLInputElement | HTMLTextAreaElement | undefined;
  let fileUploadRef: HTMLInputElement | HTMLTextAreaElement | undefined;
  let imgUploadRef: HTMLInputElement | HTMLTextAreaElement | undefined;
  let audioRef: HTMLAudioElement | undefined;

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
        audioRef.play().catch(() => {
          /* ignore autoplay errors */
        });
      }
    }
  };

  const handleImageUploadClick = () => {
    if (imgUploadRef) imgUploadRef.click();
  };

  const handleFileUploadClick = () => {
    if (fileUploadRef) fileUploadRef.click();
  };

  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (
      imageFiles.length > 0 &&
      (props.uploadsConfig?.isImageUploadAllowed || props.uploadsConfig?.isRAGFileUploadAllowed || props.isFullFileUpload)
    ) {
      e.preventDefault();
      const dataTransfer = new DataTransfer();
      const timestamp = Date.now();
      imageFiles.forEach((file, index) => {
        const ext = file.name.split('.').pop() || 'png';
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        const uniqueName = `${baseName}_${timestamp}_${index}.${ext}`;
        const renamedFile = new File([file], uniqueName, { type: file.type });
        dataTransfer.items.add(renamedFile);
      });
      const syntheticEvent = { target: { files: dataTransfer.files } } as FileEvent<HTMLInputElement>;
      props.handleFileChange(syntheticEvent);
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
      if (props.sendSoundLocation) {
        audioRef = new Audio(props.sendSoundLocation);
      } else {
        audioRef = new Audio(defaultSendSound);
      }
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
      if (allowedFileTypes.includes('*')) return '*';
      else return allowedFileTypes;
    }
    return '*';
  };

  return (
    <div
      class="w-full h-auto max-h-[192px] min-h-[76px] flex flex-col items-end justify-between border border-[#dfe1e5] overflow-hidden"
      data-testid="input"
      style={{
        margin: 'auto',
        'background-color': props.backgroundColor ?? defaultBackgroundColor,
        color: props.textColor ?? defaultTextColor,
        'border-radius': '14px',
      }}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
    >
      <Show when={warningMessage() !== ''}>
        <div class="w-full px-4 pt-4 pb-1 text-red-500 text-sm" data-testid="warning-message">
          {warningMessage()}
        </div>
      </Show>
      <div class="w-full flex flex-col">
        <ShortTextInput
          ref={inputRef as HTMLTextAreaElement}
          onInput={handleInput}
          value={props.inputValue}
          fontSize={props.fontSize}
          disabled={props.disabled}
          placeholder={props.placeholder ?? 'Type your question'}
        />
        <div class="w-full flex items-center justify-between px-3 pb-1.5">
          <div class="flex items-center gap-3">
            {props.uploadsConfig?.isImageUploadAllowed ? (
              <>
                <ImageUploadButton
                  buttonColor={props.sendButtonColor}
                  type="button"
                  class="m-0 p-0 w-4 h-4 flex items-center justify-center rounded-full"
                  isDisabled={props.disabled || isSendButtonDisabled()}
                  on:click={handleImageUploadClick}
                >
                  <span style={{ 'font-family': 'Poppins, sans-serif' }}>Image Upload</span>
                </ImageUploadButton>
                <input
                  style={{ display: 'none' }}
                  multiple
                  ref={imgUploadRef as HTMLInputElement}
                  type="file"
                  onChange={handleFileChange}
                  accept={
                    props.uploadsConfig?.imgUploadSizeAndTypes?.length
                      ? props.uploadsConfig?.imgUploadSizeAndTypes.map((allowed) => allowed.fileTypes).join(',')
                      : '*'
                  }
                />
              </>
            ) : null}
            {props.uploadsConfig?.isRAGFileUploadAllowed || props.isFullFileUpload ? (
              <>
                <AttachmentUploadButton
                  buttonColor={props.sendButtonColor}
                  type="button"
                  class="m-0 p-0 w-4 h-4 flex items-center justify-center rounded-full"
                  isDisabled={props.disabled || isSendButtonDisabled()}
                  on:click={handleFileUploadClick}
                >
                  <span style={{ 'font-family': 'Poppins, sans-serif' }}>File Upload</span>
                </AttachmentUploadButton>
                <input
                  style={{ display: 'none' }}
                  multiple
                  ref={fileUploadRef as HTMLInputElement}
                  type="file"
                  onChange={handleFileChange}
                  accept={getFileType()}
                />
              </>
            ) : null}
            {props.uploadsConfig?.isSpeechToTextEnabled ? (
              <RecordAudioButton
                buttonColor={props.sendButtonColor}
                type="button"
                class="m-0 p-0 start-recording-button w-4 h-4 shrink-0 flex items-center justify-center rounded-full"
                isDisabled={props.disabled || isSendButtonDisabled()}
                on:click={props.onMicrophoneClicked}
              >
                <span style={{ 'font-family': 'Poppins, sans-serif' }}>Record Audio</span>
              </RecordAudioButton>
            ) : null}
          </div>
          <Show
            when={props.showAbortButton}
            fallback={
              <div
                class="w-9 h-9 rounded-[10px] flex items-center justify-center"
                style={{ background: props.sendButtonBackgroundColor ?? props.sendButtonColor ?? '#3B81F6' }}
              >
                <SendButton
                  sendButtonColor="#ffffff"
                  type="button"
                  isDisabled={props.disabled || isSendButtonDisabled()}
                  class="m-0 p-0 w-11 h-11 flex items-center justify-center"
                  on:click={submit}
                >
                  <span style={{ 'font-family': 'Poppins, sans-serif' }}>Send</span>
                </SendButton>
              </div>
            }
          >
            <StopButton
              sendButtonColor={props.sendButtonColor}
              type="button"
              isDisabled={props.isMessageStopping}
              class="m-0 p-0 w-9 h-9 flex items-center justify-center rounded-[10px]"
              on:click={() => props.onAbort?.()}
              isStopping={props.isMessageStopping}
            >
              <span style={{ 'font-family': 'Poppins, sans-serif' }}>Stop</span>
            </StopButton>
          </Show>
        </div>
      </div>
    </div>
  );
};
