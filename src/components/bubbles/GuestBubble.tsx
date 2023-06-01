import { Show } from 'solid-js'
import { Avatar } from '../avatars/Avatar'

type Props = {
  message: string
  showAvatar?: boolean
  avatarSrc?: string
  backgroundColor?: string
  textColor?: string
}

const defaultBackgroundColor = '#3B81F6'
const defaultTextColor = '#ffffff'

export const GuestBubble = (props: Props) => (
  <div
    class="flex justify-end mb-2 items-end animate-fade-in guest-container"
    style={{ 'margin-left': '50px' }}
  >
    <span
      class="px-4 py-2 mr-2 whitespace-pre-wrap max-w-full chatbot-guest-bubble"
      data-testid="guest-bubble"
      style={{ "background-color": props.backgroundColor ?? defaultBackgroundColor, color: props.textColor ?? defaultTextColor, 'border-radius': '6px' }}
    >
      {props.message}
    </span>
    <Show when={props.showAvatar}>
      <Avatar initialAvatarSrc={props.avatarSrc} />
    </Show>
  </div>
)
