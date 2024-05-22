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
  poweredByTextColor?: string;
  windowVerticalShift?: number;
  windowHorizontalShift?: number;
};

export type ButtonTheme = {
  sizePx?: number; // New prop for custom button size in pixels
  backgroundColor?: string;
  iconColor?: string;
  customIconSrc?: string;
  bottom?: number;
  right?: number;
};
