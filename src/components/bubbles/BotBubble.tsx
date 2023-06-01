import { Show } from 'solid-js'
import { Avatar } from '../avatars/Avatar'

type Props = {
  message: string
  showAvatar?: boolean
  avatarSrc?: string
  backgroundColor?: string
  textColor?: string
}

const defaultBackgroundColor = '#f7f8ff'
const defaultTextColor = '#303235'

export const BotBubble = (props: Props) => (
  <div
    class="flex justify-start mb-2 items-start animate-fade-in host-container"
    style={{ 'margin-right': '50px' }}
  >
    <Show when={props.showAvatar}>
      <Avatar initialAvatarSrc={props.avatarSrc} />
    </Show>
    <span
      class="px-4 py-2 ml-2 whitespace-pre-wrap max-w-full chatbot-host-bubble"
      data-testid="host-bubble"
      style={{ "background-color": props.backgroundColor ?? defaultBackgroundColor, color: props.textColor ?? defaultTextColor, 'border-radius': '6px' }}
    >
      {props.message}
    </span>
  </div>
)
