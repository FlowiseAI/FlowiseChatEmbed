import { MessageType } from '@/components/Bot';
import { sendRequest } from '@/utils/index';


export type MessageTypeBE = "ai" | "human" | "system";

export type MessageBE = {
  type: string,
  content: string,
}


export type StreamBody = {
  question: string;
  chat_history: MessageBE[];
};

export type IncomingInput = {
  input: StreamBody;
  config?: Record<string, unknown>;
  // overrideConfig?: Record<string, unknown>;
  // socketIOClientId?: string;
  // chatId?: string;
  // fileName?: string; // Only for assistant
};

export type MessageRequest = {
  chatflowid?: string;
  apiHost?: string;
  body?: IncomingInput;
};

export const sendMessageQuery = ({ chatflowid, apiHost = 'http://localhost:3000', body }: MessageRequest) =>
  sendRequest<any>({
    method: 'POST',
    url: `${apiHost}/${chatflowid}/stream`,
    body,
  });

export const getChatbotConfig = ({ chatflowid, apiHost = 'http://localhost:3000' }: MessageRequest) => {
  return { chatflowConfig: {} };
  sendRequest<any>({
    method: 'GET',
    url: `${apiHost}/api/v1/public-chatbotConfig/${chatflowid}`,
  });
}

export const isStreamAvailableQuery = ({ chatflowid, apiHost = 'http://localhost:3000' }: MessageRequest) => {
  return { isStreaming: false };
  sendRequest<any>({
    method: 'GET',
    url: `${apiHost}/api/v1/chatflows-streaming/${chatflowid}`,
  })
};

export const sendFileDownloadQuery = ({ apiHost = 'http://localhost:3000', body }: MessageRequest) =>
  sendRequest<any>({
    method: 'POST',
    url: `${apiHost}/api/v1/openai-assistants-file`,
    body,
    type: 'blob',
  });
