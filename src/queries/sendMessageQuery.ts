import { FileUpload, IAction } from '@/components/Bot';
import { sendRequest } from '@/utils/index';

export type IncomingInput = {
  question?: string;
  form?: Record<string, unknown>;
  uploads?: FileUpload[];
  overrideConfig?: Record<string, unknown>;
  socketIOClientId?: string;
  chatId?: string;
  fileName?: string; // Only for assistant
  leadEmail?: string;
  action?: IAction;
  humanInput?: Record<string, unknown>;
};

type BaseRequest = {
  apiHost?: string;
  onRequest?: (request: RequestInit) => Promise<void>;
  authService?: any; // Add authService parameter
};

export type MessageRequest = BaseRequest & {
  chatflowid?: string;
  body?: IncomingInput;
};

export type FeedbackRatingType = 'THUMBS_UP' | 'THUMBS_DOWN';

export type FeedbackInput = {
  chatId: string;
  messageId: string;
  rating: FeedbackRatingType;
  content?: string;
};

export type CreateFeedbackRequest = BaseRequest & {
  chatflowid?: string;
  body?: FeedbackInput;
};

export type UpdateFeedbackRequest = BaseRequest & {
  id: string;
  body?: Partial<FeedbackInput>;
};

export type UpsertRequest = BaseRequest & {
  chatflowid: string;
  apiHost?: string;
  formData: FormData;
};

export type LeadCaptureInput = {
  chatflowid: string;
  chatId: string;
  name?: string;
  email?: string;
  phone?: string;
};

export type LeadCaptureRequest = BaseRequest & {
  body: Partial<LeadCaptureInput>;
};

export const sendFeedbackQuery = ({ chatflowid, apiHost = 'http://localhost:3000', body, onRequest, authService }: CreateFeedbackRequest) =>
  sendRequest({
    method: 'POST',
    url: `${apiHost}/api/v1/feedback/${chatflowid}`,
    body,
    onRequest: onRequest,
    authService,
  });

export const updateFeedbackQuery = ({ id, apiHost = 'http://localhost:3000', body, onRequest, authService }: UpdateFeedbackRequest) =>
  sendRequest({
    method: 'PUT',
    url: `${apiHost}/api/v1/feedback/${id}`,
    body,
    onRequest: onRequest,
    authService,
  });

export const sendMessageQuery = ({ chatflowid, apiHost = 'http://localhost:3000', body, onRequest, authService }: MessageRequest) =>
  sendRequest<any>({
    method: 'POST',
    url: `${apiHost}/api/v1/prediction/${chatflowid}`,
    body,
    onRequest: onRequest,
    authService,
  });

export const createAttachmentWithFormData = ({ chatflowid, apiHost = 'http://localhost:3000', formData, onRequest, authService }: UpsertRequest) =>
  sendRequest({
    method: 'POST',
    url: `${apiHost}/api/v1/attachments/${chatflowid}/${formData.get('chatId')}`,
    formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onRequest: onRequest,
    authService,
  });

export const upsertVectorStoreWithFormData = ({ chatflowid, apiHost = 'http://localhost:3000', formData, onRequest, authService }: UpsertRequest) =>
  sendRequest({
    method: 'POST',
    url: `${apiHost}/api/v1/vector/upsert/${chatflowid}`,
    formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onRequest: onRequest,
    authService,
  });

export const getChatbotConfig = ({ chatflowid, apiHost = 'http://localhost:3000', onRequest, authService }: MessageRequest) =>
  sendRequest<any>({
    method: 'GET',
    url: `${apiHost}/api/v1/public-chatbotConfig/${chatflowid}`,
    onRequest: onRequest,
    authService,
  });

export const isStreamAvailableQuery = ({ chatflowid, apiHost = 'http://localhost:3000', onRequest, authService }: MessageRequest) =>
  sendRequest<any>({
    method: 'GET',
    url: `${apiHost}/api/v1/chatflows-streaming/${chatflowid}`,
    onRequest: onRequest,
    authService,
  });

export const sendFileDownloadQuery = ({ apiHost = 'http://localhost:3000', body, onRequest, authService }: MessageRequest) =>
  sendRequest<any>({
    method: 'POST',
    url: `${apiHost}/api/v1/openai-assistants-file/download`,
    body,
    type: 'blob',
    onRequest: onRequest,
    authService,
  });

export const addLeadQuery = ({ apiHost = 'http://localhost:3000', body, onRequest, authService }: LeadCaptureRequest) =>
  sendRequest<any>({
    method: 'POST',
    url: `${apiHost}/api/v1/leads/`,
    body,
    onRequest: onRequest,
    authService,
  });
