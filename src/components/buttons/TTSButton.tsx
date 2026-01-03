import { Show } from 'solid-js';
import { VolumeIcon, SquareStopIcon, CircleDotIcon } from '../icons';

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
    if (props.isLoading) return; // Prevent clicks during loading
    props.onClick();
  };

  const getButtonStyle = () => {
    const baseColor = props.feedbackColor ?? defaultButtonColor;

    if (props.isPlaying) {
      return {
        'background-color': 'transparent',
        color: baseColor,
        border: 'none',
        'border-radius': '4px',
      };
    }

    return {
      'background-color': 'transparent',
      border: 'none',
      color: baseColor,
    };
  };

  const getTooltip = () => {
    if (props.isLoading) return 'Loading audio...';
    if (props.isPlaying) return 'Stop audio';
    return 'Play audio';
  };

  return (
    <button
      class={`py-2 px-2 justify-center font-semibold focus:outline-none flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all filter hover:brightness-90 active:brightness-75 ${
        props.class ?? ''
      }`}
      style={getButtonStyle()}
      disabled={props.isLoading}
      onClick={handleClick}
      type="button"
      title={getTooltip()}
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
        <Show when={!props.isPlaying} fallback={<CircleDotIcon color="red" />}>
          <VolumeIcon color={props.isPlaying ? 'white' : props.feedbackColor ?? defaultButtonColor} />
        </Show>
      </Show>
    </button>
  );
};
