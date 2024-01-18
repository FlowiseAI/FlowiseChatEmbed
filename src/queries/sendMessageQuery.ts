import { sendRequest } from '@/utils/index';
import { chatInfo } from '@/window';

export type IncomingInput = {
  question: string;
  overrideConfig?: Record<string, unknown>;
  chatId?: string;
};

export const sendMessageQuery = (data: IncomingInput) =>
  sendRequest<any>({
    method: 'POST',
    url: `${chatInfo.apiHost}/v1/chat-open/prediction`,
    headers: {
      apptoken: chatInfo.apptoken,
    },
    body: {
      ...data,
      groupId: chatInfo.groupId,
      thirdUserId: chatInfo.thirdUserId,
    },
  });



export const clearMessages = () =>
  sendRequest<any>({
    method: 'DELETE',
    url: `${chatInfo.apiHost}/v1/chat-open/chatmessage`,
    headers: {
      apptoken: chatInfo.apptoken,
    },
    body: {
      groupId: chatInfo.groupId,
      thirdUserId: chatInfo.thirdUserId,
    },
  });

export const getChatbotConfig = () =>
  sendRequest<any>({
    method: 'GET',
    url: `${chatInfo.apiHost}/v1/chat-open/chatbot-config`,
    headers: {
      apptoken: chatInfo.apptoken,
    },
  });

export const isStreamAvailableQuery = () =>
  sendRequest<any>({
    method: 'GET',
    url: `${chatInfo.apiHost}/v1/chat-open/chatflows-streaming`,
    headers: {
      apptoken: chatInfo.apptoken,
    },
  });
