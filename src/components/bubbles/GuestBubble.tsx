import { Show, onMount } from 'solid-js';
import { Avatar } from '../avatars/Avatar';
import { Marked } from '@ts-stack/markdown';

type Props = {
  message: string;
  showAvatar?: boolean;
  avatarSrc?: string;
  backgroundColor?: string;
  textColor?: string;
};

const defaultBackgroundColor = '#3B81F6';
const defaultTextColor = '#ffffff';

Marked.setOptions({ isNoP: true });

export const GuestBubble = (props: Props) => {
  let userMessageEl: HTMLDivElement | undefined;

  // AIT: Ensure that MathJax ist loaded
  const typesetMath = () => {
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      window.MathJax.typesetPromise([userMessageEl]).catch(err => console.error('MathJax typeset error:', err));
    } else {
      // Retry after a delay if MathJax is not ready
      setTimeout(typesetMath, 100);
    }
  }  

  onMount(() => {
    if (userMessageEl) {
      userMessageEl.innerHTML = Marked.parse(props.message);
        // AIT: Typeset the content
        typesetMath();
    }
  });

  return (
    <div class="flex justify-end mb-2 items-end guest-container" style={{ 'margin-left': '50px' }}>
      <span
        ref={userMessageEl}
        class="px-4 py-2 mr-2 whitespace-pre-wrap max-w-full chatbot-guest-bubble"
        data-testid="guest-bubble"
        style={{
          'background-color': props.backgroundColor ?? defaultBackgroundColor,
          color: props.textColor ?? defaultTextColor,
          'border-radius': '6px',
        }}
      />
      <Show when={props.showAvatar}>
        <Avatar initialAvatarSrc={props.avatarSrc} />
      </Show>
    </div>
  );
};
