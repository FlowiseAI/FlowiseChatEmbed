import { BubbleProps, ChatInfo } from "./types";

export const initFull = (props: BubbleProps & { id?: string }) => {
  // eslint-disable-next-line solid/reactivity
  const fullElement = props.id ? document.getElementById(props.id) : document.querySelector('flowise-fullchatbot');
  if (!fullElement) throw new Error('<flowise-fullchatbot> element not found.');
  Object.assign(fullElement, props);
};

export const init = (props: BubbleProps) => {
  const element = document.createElement('flowise-chatbot');
  Object.assign(element, props);
  document.body.appendChild(element);
};

export const chatInfo = {
    apiHost: 'http://localhost:3002',
    apptoken: '',
    groupId: '',
    thirdUserId: ''
}

export const initChatInfo = (info: ChatInfo)=> {
  if (!info.apptoken) throw new Error('apptoken is required.');
  if (!info.groupId) throw new Error('groupId is required.');
  if (!info.thirdUserId) throw new Error('thirdUserId is required.');
  Object.assign(chatInfo, info);
}

type Chatbot = {
  initFull: typeof initFull;
  init: typeof init;
  initChatInfo: typeof initChatInfo;
};

declare const window:
  | {
      Chatbot: Chatbot | undefined;
    }
  | undefined;

export const parseChatbot = () => ({
  initFull,
  init,
  initChatInfo
});

export const injectChatbotInWindow = (bot: Chatbot) => {
  if (typeof window === 'undefined') return;
  window.Chatbot = { ...bot };
};
