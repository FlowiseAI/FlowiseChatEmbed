import { ShortTextInput } from './ShortTextInput';
import { isMobile } from '@/utils/isMobileSignal';
import { Show, createSignal, createEffect, onMount, Setter, JSX, onCleanup, For } from 'solid-js';
import { SendButton } from '@/components/buttons/SendButton';
import { CancelButton } from '@/components/buttons/CancelButton';
import { FileEvent, UploadsConfig } from '@/components/Bot';
import { ChatInputHistory } from '@/utils/chatInputHistory';
import { Mic, SlidersHorizontal, Paperclip } from 'lucide-solid';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type TextInputProps = {
  placeholder?: string;
  selectedTool: string | null;
  onToolSelect: (tool: string | null) => void;
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
  handleFileChange: (event: FileEvent<HTMLInputElement>) => void;
  fullFileUploadAllowedTypes?: string;
  onMicrophoneClicked: () => void;
  maxChars?: number;
  maxCharsWarningMessage?: string;
  autoFocus?: boolean;
  sendMessageSound?: boolean;
  sendSoundLocation?: string;
  enableInputHistory?: boolean;
  maxHistorySize?: number;
  showStopButton?: boolean;
  onStopButtonClick?: () => void;
};

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const defaultBackgroundColor = '#FFFFFF';
const defaultTextColor = '#000000';

/* ------------------------------------------------------------------ */
/* InlineToolsMenu – ChatGPT‑style Tools dropdown                     */
/* ------------------------------------------------------------------ */

type ToolAction = {
  label: string;
  icon?: string;
};

function InlineToolsMenu(props: {
  disabled?: boolean;
  actions: ToolAction[];
  selectedTool: string | null;
  onToolSelect: (label: string | null) => void;
}) {
  const [open, setOpen] = createSignal(false);
  let btnRef: HTMLButtonElement | undefined;
  let menuRef: HTMLDivElement | undefined;

  const handleDocClick = (e: MouseEvent) => {
    if (!open()) return;
    const t = e.target as Node;
    if (menuRef?.contains(t) || btnRef?.contains(t)) return;
    setOpen(false);
  };
  document.addEventListener('mousedown', handleDocClick);
  onCleanup(() => document.removeEventListener('mousedown', handleDocClick));

  return (
    <div class="relative">
      <button
        ref={btnRef}
        type="button"
        disabled={props.disabled}
        class="inline-flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        aria-haspopup="menu"
        aria-expanded={open() ? 'true' : 'false'}
        onClick={() => setOpen(!open())}
      >
        <SlidersHorizontal class="w-5 h-5" />
        <span>Tools</span>
      </button>

      <Show when={open()}>
        <div ref={menuRef} role="menu" class="absolute left-0 bottom-full mb-1 w-52 bg-white border border-gray-200 rounded-md shadow-md z-50 py-1">
          <For each={props.actions}>
            {(a) => {
              const isSelected = props.selectedTool === a.label;
              return (
                <button
                  type="button"
                  role="menuitem"
                  class={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                    isSelected ? 'text-blue-600 font-medium' : 'text-black'
                  }`}
                  onClick={() => {
                    props.onToolSelect(isSelected ? null : a.label);
                    setOpen(false);
                  }}
                >
                  <span>{a.icon}</span>
                  <span class="flex-1">{a.label}</span>
                  {isSelected && (
                    <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414L9 14.414l-3.707-3.707a1 1 0 011.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TextInput component                                                 */
/* ------------------------------------------------------------------ */

export const TextInput = (props: TextInputProps) => {
  const [isSendButtonDisabled, setIsSendButtonDisabled] = createSignal(false);
  const [warningMessage, setWarningMessage] = createSignal('');
  const [inputHistory] = createSignal(new ChatInputHistory(() => props.maxHistorySize || 10));

  let inputRef: HTMLTextAreaElement | undefined;
  let fileUploadRef: HTMLInputElement | undefined;
  let audioRef: HTMLAudioElement | undefined;

  /* -------------------------------------------------------------- */
  /* Input handling                                                 */
  /* -------------------------------------------------------------- */
  const handleInput = (v: string) => {
    if (props.maxChars && v.length > props.maxChars) {
      setWarningMessage(props.maxCharsWarningMessage ?? `Max ${props.maxChars} characters.`);
      setIsSendButtonDisabled(true);
      return;
    }
    props.onInputChange(v);
    setWarningMessage('');
    setIsSendButtonDisabled(false);
  };

  /* -------------------------------------------------------------- */
  /* Submit (prepends slash‑command if a tool is selected)          */
  /* -------------------------------------------------------------- */
  const submit = () => {
    if (warningMessage() !== '' || !inputRef?.reportValidity()) return;

    const raw = props.inputValue.trim();
    const tool = props.selectedTool;
    const withCmd = tool ? `/${tool.toLowerCase().replace(/ /g, '-')} ${raw}` : raw;

    if (props.enableInputHistory) inputHistory().addToHistory(raw);
    props.onSubmit(withCmd);
    props.onInputChange('');
    props.onToolSelect(null);
    if (props.sendMessageSound && audioRef) audioRef.play();
  };

  /* -------------------------------------------------------------- */
  /* Autofocus + sound preload                                      */
  /* -------------------------------------------------------------- */
  createEffect(() => {
    const focus = props.autoFocus !== undefined ? props.autoFocus : !isMobile() && window.innerWidth > 640;
    if (!props.disabled && focus && inputRef) inputRef.focus();
  });
  onMount(() => {
    const focus = props.autoFocus !== undefined ? props.autoFocus : !isMobile() && window.innerWidth > 640;
    if (!props.disabled && focus && inputRef) inputRef.focus();
    if (props.sendMessageSound) {
      audioRef = new Audio(props.sendSoundLocation ?? 'https://cdn.jsdelivr.net/gh/FlowiseAI/FlowiseChatEmbed@latest/src/assets/send_message.mp3');
    }
  });

  /* -------------------------------------------------------------- */
  /* Upload helpers                                                 */
  /* -------------------------------------------------------------- */
  const fileInputAcceptAttr = () => {
    if (props.isFullFileUpload) {
      return props.fullFileUploadAllowedTypes === '' ? '*' : props.fullFileUploadAllowedTypes!;
    }
    if (props.uploadsConfig?.fileUploadSizeAndTypes?.length) {
      const allowed = props.uploadsConfig.fileUploadSizeAndTypes
        .map((a) => a.fileTypes)
        .flat()
        .join(',');
      return allowed.includes('*') ? '*' : allowed;
    }
    return '*';
  };
  const handleFileInputChange = (e: FileEvent<HTMLInputElement>) => {
    props.handleFileChange(e);
    if (e.target) e.target.value = '';
  };

  /* -------------------------------------------------------------- */
  /* Tool actions                                                   */
  /* -------------------------------------------------------------- */
  const toolActions: ToolAction[] = [
    { label: 'Run deep research', icon: '🧑‍🔬' },
    { label: 'Create an image', icon: '🖼️' },
    { label: 'Search the web', icon: '🌐' },
    { label: 'Write or code', icon: '💻' },
  ];

  /* -------------------------------------------------------------- */
  /* Render                                                         */
  /* -------------------------------------------------------------- */
  return (
    <div class="relative mx-auto max-w-4xl w-full">
      <input
        ref={(el) => (fileUploadRef = el)}
        type="file"
        multiple
        accept={fileInputAcceptAttr()}
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      <div
        class="rounded-2xl border border-gray-300 bg-white text-black shadow-sm px-4 py-2 space-y-2"
        style={{
          color: props.textColor ?? defaultTextColor,
          'background-color': props.backgroundColor ?? defaultBackgroundColor,
        }}
      >
        <ShortTextInput
          ref={(el) => (inputRef = el)}
          onInput={handleInput}
          value={props.inputValue}
          fontSize={props.fontSize}
          disabled={props.disabled}
          placeholder={props.placeholder ?? 'Type your message...'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          class="rounded-lg w-full resize-none border-none focus:ring-0 focus:outline-none text-sm"
        />

        <div class="flex justify-between items-center pt-1">
          {/* Left: Upload + Tools + selected‑tool pill */}
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => fileUploadRef?.click()}
              aria-label="Upload files"
              disabled={props.disabled}
            >
              <Paperclip class="w-5 h-5" />
            </button>

            <InlineToolsMenu disabled={props.disabled} actions={toolActions} selectedTool={props.selectedTool} onToolSelect={props.onToolSelect} />

            <Show when={props.selectedTool}>
              <button
                type="button"
                class="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm inline-flex items-center gap-1"
                onClick={() => props.onToolSelect(null)}
              >
                <span>{props.selectedTool}</span>
                <span class="text-xl leading-none">×</span>
              </button>
            </Show>
          </div>

          {/* Right: Stop, Mic, Send */}
          <div class="flex items-center gap-2">
            <Show when={props.showStopButton}>
              <CancelButton
                buttonColor={props.sendButtonColor ?? 'black'}
                class="h-6 text-black"
                isDisabled={false}
                onClick={props.onStopButtonClick}
              >
                Stop
              </CancelButton>
            </Show>

            <button
              type="button"
              class="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={props.onMicrophoneClicked}
              aria-label="Record audio"
              disabled={props.disabled}
            >
              <Mic class="w-5 h-5" />
            </button>

            <SendButton
              sendButtonColor={props.sendButtonColor ?? 'black'}
              class="h-6 text-black"
              isDisabled={props.disabled || isSendButtonDisabled()}
              onClick={submit}
            >
              Send
            </SendButton>
          </div>
        </div>
      </div>

      <Show when={warningMessage()}>
        <p class="mt-1 text-xs text-red-500">{warningMessage()}</p>
      </Show>
    </div>
  );
};
