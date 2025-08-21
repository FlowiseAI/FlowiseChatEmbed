import { truncateTextByWidth } from '../../utils/textTruncator';

type Props = {
  index: number;
  chunkContent: string;
  title: string;
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
          'width': '139px',
          'height': '139px',
          'border-radius': '4px',
          'border': '1px solid #CED4DA',
          'padding-top': '6px',
          'padding-bottom': '6px',
          'cursor': 'pointer',
          'margin-left': '8px',
          'line-height': '1.0',
        }}
      >
        <span
          style={{
            'width': '123px',
            'font-size': '10px',
            'text-overflow': 'ellipsis',
            'overflow': 'hidden',
            'white-space': 'nowrap',
            'display': 'block',
          }}
        >
          <span
            style={{
              'font-size': '10px',
              'display': 'inline-flex',
              'height': '16px',
              'padding': '2px 5px',
              'align-items': 'center',
              'gap': '10px',
              'flex-shrink': '0',
              'border-radius': '4px',
              'margin-right': '2px',
              'background': 'linear-gradient(0deg, #CAE6FB 0%, #CAE6FB 100%), linear-gradient(0deg, #DCF0FF 0%, #DCF0FF 100%), #E2FFEC',
            }}
          >
            {props.index + 1}
          </span>          
          {props.title}
        </span>
        <span
            style={{
              'width': 'max-content',
              'font-size': '10px',
              'overflow': 'hidden',
              'white-space': 'pre-wrap',
              'word-wrap': 'break-word',
              'overflow-wrap': 'break-word',
            }}
          >
            {truncateTextByWidth(props.chunkContent, 45)}
        </span>
        <img 
          style={{
            'width': '123px',
            'height': '74px',
            'margin-top': '6px',
          }}
          src="data:image/png;base64,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"
          alt="source" 
        />
      </span>
    </div>
  </>
);
