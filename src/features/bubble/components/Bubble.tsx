import { createSignal, Show, splitProps } from 'solid-js';
import styles from '../../../assets/index.css';
import { BubbleButton } from './BubbleButton';
import { BubbleParams } from '../types';
import { Bot, BotProps } from '../../../components/Bot';

const defaultButtonColor = '#3B81F6';
const defaultIconColor = 'white';

export type BubbleProps = BotProps & BubbleParams;

export const Bubble = (props: BubbleProps) => {
  const [bubbleProps] = splitProps(props, ['theme']);

  const [isBotOpened, setIsBotOpened] = createSignal(false);
  const [isBotStarted, setIsBotStarted] = createSignal(false);
  const [windowSize, setWindowSize] = createSignal('small'); // Created by AIT to toggle between small and big chat window

  const openBot = () => {
    if (!isBotStarted()) setIsBotStarted(true);
    setIsBotOpened(true);
  };

  const closeBot = () => {
    setIsBotOpened(false);
  };

  const toggleBot = () => {
    isBotOpened() ? closeBot() : openBot();
  };

  // AIT: Values of WindowSize can be 'small' or 'big'
  const toggleSize = () => {
      setWindowSize(windowSize() === 'small' ? 'big' : 'small')
  };

  return (
    <>
      <style>{styles}</style>
      <BubbleButton {...bubbleProps.theme?.button} toggleBot={toggleBot} isBotOpened={isBotOpened()} />
      <div
        id={'ChatCat-Window'}
        part="bot"
        style={{
          'min-height': '200px', // Ensure height is not less than 200px
          'min-width': '200px', // Ensure width is not less than 200px
          'max-height': 'calc(100% - 100px)', // Ensure height is not larger screen
          'max-width': 'calc(100% - 100px)', // Ensure width is not larger screen
          //height: bubbleProps.theme?.chatWindow?.height ? `${bubbleProps.theme?.chatWindow?.height.toString()}px` : 'calc(100% - 100px)', // AIT Not needed anymore
          height: windowSize() === 'small' ? `${bubbleProps.theme?.chatWindow?.aitHeightSmall}` : `${bubbleProps.theme?.chatWindow?.aitHeightLarge}`, // AIT: Added height for toggle between "small" and "large"
          width: windowSize() === 'small' ? `${bubbleProps.theme?.chatWindow?.aitWidthSmall}` : `${bubbleProps.theme?.chatWindow?.aitWidthLarge}`, // AIT: Added width for toggle between "small" and "large"                   
          bottom: `${props.theme?.button?.aitTextFieldBottom}px`, // AIT: Added AIT Variable for Bottom distance
          //transition: 'transform 200ms cubic-bezier(0, 1.2, 1, 1), opacity 150ms ease-out', // AIT: Replaced with line below
          transition: 'width 350ms cubic-bezier(0.45,0.05,0.55,0.95), height 350ms cubic-bezier(0.45,0.05,0.55,0.95), transform 200ms cubic-bezier(0, 1.2, 1, 1), opacity 150ms ease-out', // AIT: Added transition for width and height
          'transform-origin': 'bottom right',
          transform: isBotOpened() ? 'scale3d(1, 1, 1)' : 'scale3d(0, 0, 1)',
          'box-shadow': 'rgb(0 0 0 / 16%) 0px 5px 40px',
          'background-color': bubbleProps.theme?.chatWindow?.backgroundColor || '#ffffff',
          'z-index': 42424242,
        }}
        class={
          //`fixed sm:right-5 rounded-lg w-full sm:w-[400px] max-h-[704px]` + // AIT: Remove this. Fixed stuff is not wanted.
          `fixed sm:right-5 rounded-lg` + // AIT: Only keep the good styling.
          (isBotOpened() ? ' opacity-1' : ' opacity-0 pointer-events-none') //+ // AIT: Not needed anymore
          //(props.theme?.button?.size === 'large' ? ' bottom-24' : ' bottom-20') // AIT: Not needed anymore
        }
      >
        <Show when={isBotStarted()}>
          <Bot
            badgeBackgroundColor={bubbleProps.theme?.chatWindow?.backgroundColor}
            bubbleBackgroundColor={bubbleProps.theme?.button?.backgroundColor ?? defaultButtonColor}
            bubbleTextColor={bubbleProps.theme?.button?.iconColor ?? defaultIconColor}
            showTitle={bubbleProps.theme?.chatWindow?.showTitle}
            title={bubbleProps.theme?.chatWindow?.title}
            titleAvatarSrc={bubbleProps.theme?.chatWindow?.titleAvatarSrc}
            welcomeMessage={bubbleProps.theme?.chatWindow?.welcomeMessage}
            poweredByTextColor={bubbleProps.theme?.chatWindow?.poweredByTextColor}
            textInput={bubbleProps.theme?.chatWindow?.textInput}
            botMessage={bubbleProps.theme?.chatWindow?.botMessage}
            userMessage={bubbleProps.theme?.chatWindow?.userMessage}
            fontSize={bubbleProps.theme?.chatWindow?.fontSize}
            chatflowid={props.chatflowid}
            chatflowConfig={props.chatflowConfig}
            apiHost={props.apiHost}
            toggleSize={toggleSize}
          />
          {/* AIT: Added toggleSize above to pass toggleSize as a prop */}
        </Show>
      </div>
    </>
  );
};
