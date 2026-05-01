export type FullParams = {
  theme?: FullTheme;
};

export type FullTheme = {
  chatWindow?: ChatWindowTheme;
  disclaimer?: DisclaimerPopUpTheme;
  customCSS?: string;
  form?: FormTheme;
};

export type FormTheme = {
  backgroundColor?: string;
  textColor?: string;
};

export type TextInputTheme = {
  backgroundColor?: string;
  textColor?: string;
  placeholder?: string;
  sendButtonColor?: string;
  maxChars?: number;
  maxCharsWarningMessage?: string;
  autoFocus?: boolean;
  sendMessageSound?: boolean;
  sendSoundLocation?: string;
  receiveMessageSound?: boolean;
  receiveSoundLocation?: string;
  enableInputHistory?: boolean;
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
  showAgentMessages?: boolean; // parameter to show agent reasonings when using agentflows
  title?: string;
  titleAvatarSrc?: string;
  titleTextColor?: string;
  titleBackgroundColor?: string;
  welcomeMessage?: string;
  errorMessage?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  height?: number | string;
  width?: number | string;
  fontSize?: number;
  userMessage?: UserMessageTheme;
  botMessage?: BotMessageTheme;
  textInput?: TextInputTheme;
  feedback?: FeedbackTheme;
  footer?: FooterTheme;
  sourceDocsTitle?: string;
  poweredByTextColor?: string;
  starterPrompts?: string[];
  starterPromptFontSize?: number;
  clearChatOnReload?: boolean;
  dateTimeToggle?: DateTimeToggleTheme;
  renderHTML?: boolean;
  headerHtml?: string;
  sessionPanel?: {
    width?: string | number;
    collapsedWidth?: string | number;
    backgroundColor?: string;
    textColor?: string;
    activeBackgroundColor?: string;
    activeTextColor?: string;
    hoverBackgroundColor?: string;
    borderColor?: string;
    newChatButtonColor?: string;
    newChatButtonTextColor?: string;
    newChatLabel?: string;
    emptyStateText?: string;
    capWarningText?: string;
  };
};

export type DisclaimerPopUpTheme = {
  title?: string;
  message?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonText?: string;
  blurredBackgroundColor?: string;
  backgroundColor?: string;
  denyButtonBgColor?: string;
  denyButtonText?: string;
};

export type DateTimeToggleTheme = {
  date?: boolean;
  time?: boolean;
};
