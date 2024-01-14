export type BubbleParams = {
    theme?: BubbleTheme;
};
export type BubbleTheme = {
    chatWindow?: ChatWindowTheme;
    button?: ButtonTheme;
};
export type TextInputTheme = {
    backgroundColor?: string;
    textColor?: string;
    placeholder?: string;
    sendButtonColor?: string;
};
export type UserMessageTheme = {
    currentURL?: string;
    backgroundColor?: string;
    textColor?: string;
    showAvatar?: boolean;
    avatarSrc?: string;
};
export type BotMessageTheme = {
    backgroundColor?: string;
    textColor?: string;
    showAvatar?: boolean;
    avatarSrc?: string;
};
export type ChatWindowTheme = {
    showTitle?: boolean;
    title?: string;
    titleAvatarSrc?: string;
    welcomeMessage?: string;
    backgroundColor?: string;
    height?: number;
    width?: number;
    aitHeightSmall?: string;
    aitWidthSmall?: string;
    aitHeightLarge?: string;
    aitWidthLarge?: string;
    fontSize?: number;
    userMessage?: UserMessageTheme;
    botMessage?: BotMessageTheme;
    textInput?: TextInputTheme;
    poweredByTextColor?: string;
};
export type ButtonTheme = {
    size?: 'medium' | 'large';
    aitBubbleSize?: number;
    aitBubbleIconSize?: number;
    aitBubbleIconBotOpenedSize?: number;
    aitTextFieldBottom?: number;
    backgroundColor?: string;
    iconColor?: string;
    customIconSrc?: string;
    bottom?: number;
    right?: number;
};
//# sourceMappingURL=types.d.ts.map