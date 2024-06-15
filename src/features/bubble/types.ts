export type BubbleParams = {
  theme?: BubbleTheme;
};

export type BubbleTheme = {
  chatWindow?: ChatWindowTheme;
  button?: ButtonTheme;
  tooltip?: ToolTipTheme;
};

export type TextInputTheme = {
  backgroundColor?: string;
  textColor?: string;
  placeholder?: string;
  sendButtonColor?: string;
  maxChars?: number;
  maxCharsWarningMessage?: string;
  autoFocus?: boolean;
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
  size?: 'small' | 'medium' | 'large' | number; // custom size of chatbot in pixels
  backgroundColor?: string;
  iconColor?: string;
  customIconSrc?: string;
  bottom?: number;
  right?: number;
  dragAndDrop?: boolean; // parameter to enable drag and drop(true or false)
};
export type ToolTipTheme = {
  showTooltip?: boolean; // parameter to enable tooltip(true or false)
  tooltipMessage?: string;
  tooltipBackgroundColor?: string;
  tooltipTextColor?: string;
  tooltipFontSize?: number;
};
