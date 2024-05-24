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
export type FooterTheme = {
    showFooter?: boolean;
    textColor?: string;
    text?: string;
    company?: string;
    companyLink?: string;
};
export type FeedbackTheme = {
    color?: string;
};
export type ChatWindowTheme = {
    showTitle?: boolean;
    title?: string;
    titleAvatarSrc?: string;
    welcomeMessage?: string;
    errorMessage?: string;
    backgroundColor?: string;
    height?: number;
    width?: number;
    fontSize?: number;
    userMessage?: UserMessageTheme;
    botMessage?: BotMessageTheme;
    textInput?: TextInputTheme;
    feedback?: FeedbackTheme;
    footer?: FooterTheme;
    poweredByTextColor?: string;
};
export type ButtonTheme = {
    size?: 'medium' | 'large';
    backgroundColor?: string;
    iconColor?: string;
    customIconSrc?: string;
    bottom?: number;
    right?: number;
};
//# sourceMappingURL=types.d.ts.map