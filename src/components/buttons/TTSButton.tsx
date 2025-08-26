import { Show } from 'solid-js';
import { VolumeIcon, SquareStopIcon } from '../icons';

type Props = {
  isLoading?: boolean;
  isPlaying?: boolean;
  feedbackColor?: string;
  onClick: () => void;
  class?: string;
};

const defaultButtonColor = '#3B81F6';

export const TTSButton = (props: Props) => {
  const handleClick = (event: MouseEvent) => {
    event.preventDefault();
    props.onClick();
  };

  return (
    <button
      class={`py-2 px-2 justify-center font-semibold text-white focus:outline-none flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all filter hover:brightness-90 active:brightness-75 ${props.class ?? ''}`}
      style={{
        background: 'transparent',
        border: 'none',
        color: props.feedbackColor ?? defaultButtonColor,
      }}
      disabled={props.isLoading}
      onClick={handleClick}
      type="button"
      title={props.isPlaying ? 'Stop audio' : 'Play audio'}
    >
      <Show
        when={!props.isLoading}
        fallback={
          <div
            class="animate-spin rounded-full border-2 border-current border-t-transparent"
            style={{
              width: '16px',
              height: '16px',
            }}
          />
        }
      >
        <Show when={!props.isPlaying} fallback={<SquareStopIcon color={props.feedbackColor ?? defaultButtonColor} />}>
          <VolumeIcon color={props.feedbackColor ?? defaultButtonColor} />
        </Show>
      </Show>
    </button>
  );
};
