import { createSignal, createEffect, Show } from 'solid-js';
import { isNotDefined, getBubbleButtonSize } from '@/utils/index';
import { ButtonTheme } from '../types';

type Props = ButtonTheme & {
  isBotOpened: boolean;
  toggleBot: () => void;
  setButtonPosition: (position: { bottom: number; right: number }) => void;
  dragAndDrop: boolean;
  autoOpen?: boolean; // Optional parameter to control automatic window opening
  openDelay?: number; // Optional parameter for delay time in seconds
  autoOpenOnMobile?: boolean; // Optional parameter for opening on mobile
};

const defaultButtonColor = '#3B81F6';
const defaultIconColor = 'white';
const defaultBottom = 20;
const defaultRight = 20;

export const BubbleButton = (props: Props) => {
  const buttonSize = getBubbleButtonSize(props.size);

  const [position, setPosition] = createSignal({
    bottom: props.bottom ?? defaultBottom,
    right: props.right ?? defaultRight,
  });

  const [isSmallScreen, setIsSmallScreen] = createSignal(false);
  const [userInteracted, setUserInteracted] = createSignal(false);

  let dragStartX: number;
  let initialRight: number;

  const onMouseDown = (e: MouseEvent) => {
    if (props.dragAndDrop) {
      dragStartX = e.clientX;
      initialRight = position().right;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    const deltaX = dragStartX - e.clientX;
    const newRight = initialRight + deltaX;

    const screenWidth = window.innerWidth;
    const maxRight = screenWidth - buttonSize;

    const newPosition = {
      right: Math.min(Math.max(newRight, defaultRight), maxRight),
      bottom: position().bottom,
    };

    setPosition(newPosition);
    props.setButtonPosition(newPosition);
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  const handleButtonClick = () => {
    props.toggleBot();
    setUserInteracted(true); // Mark that the user has interacted
    if (window.innerWidth <= 640) {
      setIsSmallScreen(true);
    }
  };

  createEffect(() => {
    // Automatically open the chat window if autoOpen is true
    if (props.autoOpen && (props.autoOpenOnMobile || window.innerWidth > 640)) {
      const delayInSeconds = props.openDelay ?? 2; // Default to 2 seconds if openDelay is not defined
      const delayInMilliseconds = delayInSeconds * 1000; // Convert seconds to milliseconds
      setTimeout(() => {
        if (!props.isBotOpened && !userInteracted()) {
          props.toggleBot();
        }
      }, delayInMilliseconds);
    }
  });

  return (
    <Show when={!isSmallScreen() || !props.isBotOpened} keyed>
      <button
        part="button"
        onClick={handleButtonClick}
        onMouseDown={onMouseDown}
        class={`fixed shadow-md rounded-full hover:scale-110 active:scale-95 transition-transform duration-200 flex justify-center items-center animate-fade-in`}
        style={{
          'background-color': props.backgroundColor ?? defaultButtonColor,
          'z-index': 42424242,
          right: `${position().right}px`,
          bottom: `${position().bottom}px`,
          width: `${buttonSize}px`,
          height: `${buttonSize}px`,
          cursor: props.dragAndDrop ? 'grab' : 'pointer',
        }}
      >
        <Show when={isNotDefined(props.customIconSrc)} keyed>
          <svg
            viewBox="0 0 24 24"
            style={{
              stroke: props.iconColor ?? defaultIconColor,
            }}
            class={
              `stroke-2 fill-transparent absolute duration-200 transition ` + (props.isBotOpened ? 'scale-0 opacity-0' : 'scale-100 opacity-100')
            }
            width={buttonSize * 0.6}
            height={buttonSize * 0.6}
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </Show>
        <Show when={props.customIconSrc}>
          <img
            src={props.customIconSrc}
            class={'rounded-full object-cover' + (props.isBotOpened ? 'scale-0 opacity-0' : 'scale-100 opacity-100')}
            style={{
              width: `${buttonSize * 0.6}px`,
              height: `${buttonSize * 0.6}px`,
            }}
            alt="Bubble button icon"
          />
        </Show>

        <svg
          viewBox="0 0 24 24"
          style={{ fill: props.iconColor ?? 'white' }}
          class={`absolute duration-200 transition ` + (props.isBotOpened ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-180 opacity-0')}
          width={buttonSize * 0.6}
          height={buttonSize * 0.6}
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M18.601 8.39897C18.269 8.06702 17.7309 8.06702 17.3989 8.39897L12 13.7979L6.60099 8.39897C6.26904 8.06702 5.73086 8.06702 5.39891 8.39897C5.06696 8.73091 5.06696 9.2691 5.39891 9.60105L11.3989 15.601C11.7309 15.933 12.269 15.933 12.601 15.601L18.601 9.60105C18.9329 9.2691 18.9329 8.73091 18.601 8.39897Z"
          />
        </svg>
      </button>
    </Show>
  );
};
