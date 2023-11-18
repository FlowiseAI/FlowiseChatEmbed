import { Show, onMount } from 'solid-js'
import { Avatar } from '../avatars/Avatar'
import { Marked } from '@ts-stack/markdown'

type Props = {
  message: string
  showAvatar?: boolean
  avatarSrc?: string
  backgroundColor?: string
  textColor?: string
}

const defaultBackgroundColor = '#f7f8ff'
const defaultTextColor = '#303235'

Marked.setOptions({ isNoP: true })

export const BotBubble = (props: Props) => {
  let botMessageEl: HTMLDivElement | undefined

  // AIT: Ensure that MathJax ist loaded
  const typesetMath = () => {
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      window.MathJax.typesetPromise([botMessageEl]).catch(err => console.error('MathJax typeset error:', err));
    } else {
      // Retry after a delay if MathJax is not ready
      setTimeout(typesetMath, 100);
    }
  }  

  onMount(() => {
    if (botMessageEl) {
      botMessageEl.innerHTML = Marked.parse(props.message)
        // AIT: Typeset the content
        typesetMath()
      }
    })

  return (
    <div
      class="flex justify-start mb-2 items-start host-container"
      style={{ 'margin-right': '50px' }}
    >
      <Show when={props.showAvatar}>
        <Avatar initialAvatarSrc={props.avatarSrc} />
      </Show>
      <span
        ref={botMessageEl}
        class="px-4 py-2 ml-2 whitespace-pre-wrap max-w-full chatbot-host-bubble"
        data-testid="host-bubble"
        style={{ "background-color": props.backgroundColor ?? defaultBackgroundColor, color: props.textColor ?? defaultTextColor, 'border-radius': '6px' }}
      />
    </div>
  )
}
