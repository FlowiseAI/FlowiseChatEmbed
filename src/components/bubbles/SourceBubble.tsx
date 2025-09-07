import { Show } from 'solid-js';
import { truncateTextByWidth } from '../../utils/textTruncator';

type Props = {
  index: number;
  chunkContent: string;
  title: string;
  imageSrc: string;
  onSourceClick?: () => void;
};
export const SourceBubble = (props: Props) => (
  <>
    <div
      data-modal-target="defaultModal"
      data-modal-toggle="defaultModal"
      class="flex justify-start mb-2 items-start animate-fade-in host-container hover:brightness-90 active:brightness-75"
      onClick={() => props.onSourceClick?.()}
    >
      <span
        class="px-2 py-1 ml-1 whitespace-pre-wrap max-w-full chatbot-host-bubble"
        data-testid="host-bubble"
        style={{
          width: '139px',
          height: '139px',
          'border-radius': '4px',
          border: '1px solid #CED4DA',
          'padding-top': '6px',
          'padding-bottom': '6px',
          cursor: 'pointer',
          'margin-left': '8px',
          'line-height': '1.0',
        }}
      >
        <span
          style={{
            width: '123px',
            'font-size': '10px',
            'text-overflow': 'ellipsis',
            overflow: 'hidden',
            'white-space': 'nowrap',
            display: 'flex',
            'align-items': 'center',
            gap: '4px',
          }}
        >
          <span
            style={{
              width: '16px',
              height: '16px',
              'flex-shrink': '0',
              'background-image': 'url(./pdf_icon.png)',
              'background-size': '16px 16px',
              'background-position': 'center',
              'background-repeat': 'no-repeat',
            }}
          />
          <span
            style={{
              'text-overflow': 'ellipsis',
              overflow: 'hidden',
              'white-space': 'nowrap',
              flex: '1',
            }}
          >
            {props.title}
          </span>
        </span>
        <span
          style={{
            'font-size': '10px',
            overflow: 'hidden',
            height: props.imageSrc && props.imageSrc.trim() !== '' ? 'auto' : '110px',
            display: props.imageSrc && props.imageSrc.trim() !== '' ? undefined : 'block',
            'line-height': props.imageSrc && props.imageSrc.trim() !== '' ? undefined : '1.8',
          }}
        >
          {props.imageSrc && props.imageSrc.trim() !== '' ? truncateTextByWidth(props.chunkContent, 50) : props.chunkContent}
        </span>
        <Show when={props.imageSrc && props.imageSrc.trim() !== ''}>
          <img
            style={{
              width: '123px',
              height: '74px',
              'margin-top': '6px',
            }}
            src={`data:image/png;base64,${props.imageSrc}`}
            alt="source"
          />
        </Show>
      </span>
    </div>
  </>
);
