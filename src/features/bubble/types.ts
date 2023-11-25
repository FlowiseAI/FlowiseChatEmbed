export type BubbleParams = {
    theme?: BubbleTheme
}

export type BubbleTheme = {
    chatWindow?: ChatWindowTheme
    button?: ButtonTheme
}

export type TextInputTheme = {
    backgroundColor?: string
    textColor?: string
    placeholder?: string
    sendButtonColor?: string
}

export type UserMessageTheme = {
    currentURL?: string
    backgroundColor?: string
    textColor?: string
    showAvatar?: boolean
    avatarSrc?: string
}

export type BotMessageTheme = {
    backgroundColor?: string
    textColor?: string
    showAvatar?: boolean
    avatarSrc?: string
}

export type ChatWindowTheme = {
    title?: string
    titleAvatarSrc?: string
    welcomeMessage?: string
    backgroundColor?: string
    height?: number
    width?: number
    fontSize?: number
    userMessage?: UserMessageTheme
    botMessage?: BotMessageTheme
    textInput?: TextInputTheme
    poweredByTextColor?: string
}

export type ButtonTheme = {
    size?: 'medium' | 'large' // AIT created proper ait* variables for easier use
    aitBubbleSize?: number // By AIT: Size of the overall CatChat Button
    aitBubbleIconSize?: number // By AIT: Size of the image/icon inside the CatChat Button
    aitBubbleIconBotOpenedSize?: number // By AIT: Size of the image/icon inside CatChat Button when Chat is opened (currently an arrow)
    aitTextFieldBottom?: number // By AIT: Distance of Chatwindow to bottom
    backgroundColor?: string
    iconColor?: string
    customIconSrc?: string
    bottom?: number
    right?: number
}