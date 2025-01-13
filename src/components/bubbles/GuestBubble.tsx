import { For, Show, onMount } from 'solid-js';
import { Avatar } from '../avatars/Avatar';
import { Marked } from '@ts-stack/markdown';
import { FileUpload, MessageType } from '../Bot';
import { AttachmentIcon } from '../icons';

type Props = {
  message: MessageType;
  apiHost?: string;
  chatflowid: string;
  chatId: string;
  showAvatar?: boolean;
  avatarSrc?: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  renderHTML?: boolean;
};

const defaultBackgroundColor = '#3B81F6';
const defaultTextColor = '#ffffff';
const defaultFontSize = 16;

export const GuestBubble = (props: Props) => {
  let userMessageEl: HTMLDivElement | undefined;

  Marked.setOptions({ isNoP: true, sanitize: props.renderHTML !== undefined ? !props.renderHTML : true });

  onMount(() => {
    if (userMessageEl) {
      userMessageEl.innerHTML = Marked.parse(props.message.message);
    }
  });

  const renderFileUploads = (item: Partial<FileUpload>) => {
    if (item?.mime?.startsWith('image/')) {
      const fileData = `${props.apiHost}/api/v1/get-upload-file?chatflowId=${props.chatflowid}&chatId=${props.chatId}&fileName=${item.name}`;
      const src = (item.data as string) ?? fileData;
      return (
        <div class="flex items-center justify-center max-w-[128px] mr-[10px] p-0 m-0">
          <img class="w-full h-full bg-cover" src={src} />
        </div>
      );
    } else if (item?.mime?.startsWith('audio/')) {
      const fileData = `${props.apiHost}/api/v1/get-upload-file?chatflowId=${props.chatflowid}&chatId=${props.chatId}&fileName=${item.name}`;
      const src = (item.data as string) ?? fileData;
      return (
        <audio class="w-[200px] h-10 block bg-cover bg-center rounded-none text-transparent" controls>
          Your browser does not support the &lt;audio&gt; tag.
          <source src={src} type={item.mime} />
        </audio>
      );
    } else {
      return (
        <div class={`inline-flex items-center h-12 max-w-max p-2 mr-1 flex-none bg-transparent border border-gray-300 rounded-md`}>
          <AttachmentIcon color={props.textColor ?? defaultTextColor} />
          <span class={`ml-1.5 text-inherit`}>{item.name}</span>
        </div>
      );
    }
  };

  return (
    <div class="flex justify-end mb-2 items-end guest-container" style={{ 'margin-left': '50px' }}>
      <div
        class="max-w-full flex flex-col justify-center items-start chatbot-guest-bubble px-4 py-2 gap-2 mr-2"
        data-testid="guest-bubble"
        style={{
          'background-color': props.backgroundColor ?? defaultBackgroundColor,
          color: props.textColor ?? defaultTextColor,
          'border-radius': '6px',
        }}
      >
        {props.message.fileUploads && props.message.fileUploads.length > 0 && (
          <div class="flex flex-col items-start flex-wrap w-full gap-2">
            <For each={props.message.fileUploads}>
              {(item) => {
                return renderFileUploads(item);
              }}
            </For>
          </div>
        )}
        {props.message.message && (
          <span
            ref={userMessageEl}
            class="mr-2 whitespace-pre-wrap"
            style={{ 'font-size': props.fontSize ? `${props.fontSize}px` : `${defaultFontSize}px` }}
          />
        )}
      </div>
      <Show when={props.showAvatar}>
        <Avatar initialAvatarSrc={props.avatarSrc} />
      </Show>
    </div>
  );
};
