import { createSignal, createEffect, For, onMount } from 'solid-js'
import { sendMessageQuery } from '@/queries/sendMessageQuery'
import { TextInput } from './inputs/textInput'
import { GuestBubble } from './bubbles/GuestBubble'
import { BotBubble } from './bubbles/BotBubble'
import { LoadingBubble } from './bubbles/LoadingBubble'
import { BotMessageTheme, TextInputTheme, UserMessageTheme } from '@/features/bubble/types'
import { Badge } from './Badge'

type messageType = 'apiMessage' | 'userMessage' | 'usermessagewaiting'

export type MessageType = {
    message: string
    type: messageType
}

export type BotProps = {
    chatflowid: string
    apiHost?: string
    welcomeMessage?: string
    botMessage?: BotMessageTheme
    userMessage?: UserMessageTheme
    textInput?: TextInputTheme
    poweredByTextColor?: string
}

const defaultWelcomeMessage = 'Hi there! How can I help?'

export const Bot = (props: BotProps & { class?: string }) => {
    let chatContainer: HTMLDivElement | undefined
    let bottomSpacer: HTMLDivElement | undefined
    let botContainer: HTMLDivElement | undefined

    const [userInput, setUserInput] = createSignal('')
    const [loading, setLoading] = createSignal(false)
    const [messages, setMessages] = createSignal<MessageType[]>([
        {
            message: props.welcomeMessage ?? defaultWelcomeMessage,
            type: 'apiMessage'
        },
    ])

    onMount(() => {
        if (!bottomSpacer) return
        setTimeout(() => {
            chatContainer?.scrollTo(0, chatContainer.scrollHeight)
        }, 50)
    })

    const scrollToBottom = () => {
        setTimeout(() => {
            chatContainer?.scrollTo(0, chatContainer.scrollHeight)
        }, 50)
    }

    // Handle errors
    const handleError = (message = 'Oops! There seems to be an error. Please try again.') => {
        setMessages((prevMessages) => [...prevMessages, { message, type: 'apiMessage' }])
        setLoading(false)
        setUserInput('')
        scrollToBottom()
    }

    // Handle form submission
    const handleSubmit = async (value: string) => {
        setUserInput(value)

        if (value.trim() === '') {
            return
        }

        setLoading(true)
        setMessages((prevMessages) => [...prevMessages, { message: value, type: 'userMessage' }])
        scrollToBottom()

        // Send user question and history to API
        const { data, error } = await sendMessageQuery({
            chatflowid: props.chatflowid,
            apiHost: props.apiHost,
            body: {
                question: value,
                history: messages().filter((msg) => msg.message !== props.welcomeMessage ?? defaultWelcomeMessage)
            }
        })

        if (data) {
            setMessages((prevMessages) => [...prevMessages, { message: data, type: 'apiMessage' }])
            setLoading(false)
            setUserInput('')
            scrollToBottom()
        }
        if (error) {
            console.error(error)
            const err: any = error
            const errorData = err.response.data || `${err.response.status}: ${err.response.statusText}`
            handleError(errorData)
            return
        }
    }

    // Auto scroll chat to bottom
    createEffect(() => {
        scrollToBottom()
    })

    createEffect(() => {
        return () => {
            setUserInput('')
            setLoading(false)
            setMessages([
                {
                    message: props.welcomeMessage ?? defaultWelcomeMessage,
                    type: 'apiMessage'
                }
            ])
        }
    })

    return (
        <>
            <div ref={botContainer} class={'relative flex w-full h-full text-base overflow-hidden bg-cover bg-center flex-col items-center chatbot-container ' + props.class}>
                <div class="flex w-full h-full justify-center">
                    <div ref={chatContainer} class="overflow-y-scroll w-full min-h-full px-3 pt-10 pb-20 relative scrollable-container chatbot-chat-view scroll-smooth">
                        <For each={[...messages()]}>
                            {(message, index) => (
                                <>
                                    {message.type === 'userMessage' && (
                                        <GuestBubble
                                            message={message.message}
                                            backgroundColor={props.userMessage?.backgroundColor}
                                            textColor={props.userMessage?.textColor}
                                            showAvatar={props.userMessage?.showAvatar}
                                            avatarSrc={props.userMessage?.avatarSrc}
                                        />
                                    )}
                                    {message.type === 'apiMessage' && (
                                        <BotBubble
                                            message={message.message}
                                            backgroundColor={props.botMessage?.backgroundColor}
                                            textColor={props.botMessage?.textColor}
                                            showAvatar={props.botMessage?.showAvatar}
                                            avatarSrc={props.botMessage?.avatarSrc}
                                        />
                                    )}
                                    {message.type === 'userMessage' && loading() && index() === messages().length - 1 && (
                                        <LoadingBubble />
                                    )}
                                </>
                            )}
                        </For>
                    </div>
                    <TextInput
                        backgroundColor={props.textInput?.backgroundColor}
                        textColor={props.textInput?.textColor}
                        placeholder={props.textInput?.placeholder}
                        sendButtonColor={props.textInput?.sendButtonColor}
                        defaultValue={userInput()}
                        onSubmit={handleSubmit}
                    />
                </div>
                <Badge poweredByTextColor={props.poweredByTextColor} botContainer={botContainer} />
                <BottomSpacer ref={bottomSpacer} />
            </div>
        </>
    )
}

type BottomSpacerProps = {
    ref: HTMLDivElement | undefined
}
const BottomSpacer = (props: BottomSpacerProps) => {
    return <div ref={props.ref} class="w-full h-32" />
}
  