import { FooterTheme } from '@/features/bubble/types';
import { Show, onCleanup, onMount } from 'solid-js';

type Props = {
  footer?: FooterTheme;
  botContainer: HTMLDivElement | undefined;
  poweredByTextColor?: string;
  badgeBackgroundColor?: string;
};

const defaultTextColor = '#303235';

export const Badge = (props: Props) => {
  let liteBadge: HTMLAnchorElement | undefined;
  let observer: MutationObserver | undefined;

  const appendBadgeIfNecessary = (mutations: MutationRecord[]) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((removedNode) => {
        if ('id' in removedNode && liteBadge && removedNode.id == 'lite-badge') {
          console.log("Sorry, you can't remove the brand 😅");
          props.botContainer?.append(liteBadge);
        }
      });
    });
  };

  onMount(() => {
    if (!document || !props.botContainer) return;
    observer = new MutationObserver(appendBadgeIfNecessary);
    observer.observe(props.botContainer, {
      subtree: false,
      childList: true,
    });
  });

  onCleanup(() => {
    if (observer) observer.disconnect();
  });

  return (
    <>
      <Show when={props.footer?.showFooter === undefined || props.footer?.showFooter === null || props.footer?.showFooter === true}>
        <span
          class="w-full text-center px-[10px] pt-[6px] pb-[10px] m-auto text-[13px]"
          style={{
            color: props.footer?.textColor ?? props.poweredByTextColor ?? defaultTextColor,
            'background-color': props.badgeBackgroundColor ?? '#ffffff',
          }}
        >
          {props.footer?.text ?? 'Powered by'}
          <a
            ref={liteBadge}
            href={props.footer?.companyLink ?? 'https://flowiseai.com'}
            target="_blank"
            rel="noopener noreferrer"
            class="lite-badge"
            id="lite-badge"
            style={{ 'font-weight': 'bold', color: props.footer?.textColor ?? props.poweredByTextColor ?? defaultTextColor }}
          >
            <span>&nbsp;{props.footer?.company ?? 'Flowise'}</span>
          </a>
        </span>
      </Show>
      <Show when={props.footer?.showFooter === false}>
        <span
          class="w-full text-center px-[10px] pt-[6px] pb-[10px] m-auto text-[13px]"
          style={{
            color: props.footer?.textColor ?? props.poweredByTextColor ?? defaultTextColor,
            'background-color': props.badgeBackgroundColor ?? '#ffffff',
          }}
        />
      </Show>
    </>
  );
};
