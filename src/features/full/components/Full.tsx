import styles from '../../../assets/index.css';
import { Bot, BotProps, UserProps } from '@/components/Bot';
import { BubbleParams } from '@/features/bubble/types';
import { createSignal, onCleanup, onMount, Show } from 'solid-js';

const defaultButtonColor = '#3B81F6';
const defaultIconColor = 'white';

export type FullProps = BotProps & BubbleParams & UserProps;

export const Full = (props: FullProps, { element }: { element: HTMLElement }) => {
  const [isBotDisplayed, setIsBotDisplayed] = createSignal(false);

  const launchBot = () => {
    setIsBotDisplayed(true);
  };

  const botLauncherObserver = new IntersectionObserver((intersections) => {
    if (intersections.some((intersection) => intersection.isIntersecting)) launchBot();
  });

  onMount(() => {
    botLauncherObserver.observe(element);
  });

  onCleanup(() => {
    botLauncherObserver.disconnect();
  });

  return (
    <>
      <style>{styles}</style>
      <Show when={isBotDisplayed()}>
        <div
          style={{
            'background-color': props.theme?.chatWindow?.backgroundColor || '#ffffff',
            height: props.theme?.chatWindow?.height ? `${props.theme?.chatWindow?.height.toString()}px` : '100vh',
            width: props.theme?.chatWindow?.width ? `${props.theme?.chatWindow?.width.toString()}px` : '100%',
            margin: '0px',
          }}
        >
          <Bot
            badgeBackgroundColor={props.theme?.chatWindow?.backgroundColor}
            bubbleButtonColor={props.theme?.button?.bubbleButtonColor ?? defaultButtonColor}
            topbarColor={props.theme?.button?.topbarColor ?? defaultButtonColor}
            bubbleTextColor={props.theme?.button?.iconColor ?? defaultIconColor}
            title={props.theme?.chatWindow?.title}
            titleColor={props.theme?.chatWindow?.titleColor}
            titleAvatarSrc={props.theme?.chatWindow?.titleAvatarSrc}
            welcomeMessage={props.theme?.chatWindow?.welcomeMessage}
            poweredByTextColor={props.theme?.chatWindow?.poweredByTextColor}
            textInput={props.theme?.chatWindow?.textInput}
            botMessage={props.theme?.chatWindow?.botMessage}
            userMessage={props.theme?.chatWindow?.userMessage}
            fontSize={props.theme?.chatWindow?.fontSize}
            chatflowid={props.chatflowid}
            chatflowConfig={props.chatflowConfig}
            apiHost={props.apiHost}
            isFullPage={true}
            customerEmail={props.customerEmail}
            customerName={props.customerName}
            starterPrompts={props.theme?.chatWindow?.starterPrompts}
          />
        </div>
      </Show>
    </>
  );
};
