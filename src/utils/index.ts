export const isNotDefined = <T>(value: T | undefined | null): value is undefined | null => value === undefined || value === null;

export const isDefined = <T>(value: T | undefined | null): value is NonNullable<T> => value !== undefined && value !== null;

export const isEmpty = (value: string | undefined | null): value is undefined => value === undefined || value === null || value === '';

export const isNotEmpty = (value: string | undefined | null): value is string => value !== undefined && value !== null && value !== '';

export const sendRequest = async <ResponseData>(
  params:
    | {
        url: string;
        method: string;
        body?: Record<string, unknown> | FormData;
        type?: string;
      }
    | string,
): Promise<{ data?: ResponseData; error?: Error }> => {
  try {
    const url = typeof params === 'string' ? params : params.url;
    const response = await fetch(url, {
      method: typeof params === 'string' ? 'GET' : params.method,
      mode: 'cors',
      headers:
        typeof params !== 'string' && isDefined(params.body)
          ? {
              'Content-Type': 'application/json',
            }
          : undefined,
      body: typeof params !== 'string' && isDefined(params.body) ? JSON.stringify(params.body) : undefined,
    });
    let data: any;
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (typeof params !== 'string' && params.type === 'blob') {
      data = await response.blob();
    } else {
      data = await response.text();
    }
    if (!response.ok) {
      let errorMessage;

      if (typeof data === 'object' && 'error' in data) {
        errorMessage = data.error;
      } else {
        errorMessage = data || response.statusText;
      }

      throw errorMessage;
    }

    return { data };
  } catch (e) {
    console.error(e);
    return { error: e as Error };
  }
};

export const setLocalStorageChatflow = (chatflowid: string, chatId: string, saveObj: Record<string, any> = {}) => {
  const chatDetails = localStorage.getItem(`${chatflowid}_EXTERNAL`);
  const obj = { ...saveObj };
  if (chatId) obj.chatId = chatId;

  if (!chatDetails) {
    localStorage.setItem(`${chatflowid}_EXTERNAL`, JSON.stringify(obj));
  } else {
    try {
      const parsedChatDetails = JSON.parse(chatDetails);
      localStorage.setItem(`${chatflowid}_EXTERNAL`, JSON.stringify({ ...parsedChatDetails, ...obj }));
    } catch (e) {
      const chatId = chatDetails;
      obj.chatId = chatId;
      localStorage.setItem(`${chatflowid}_EXTERNAL`, JSON.stringify(obj));
    }
  }
};

export const getLocalStorageChatflow = (chatflowid: string) => {
  const chatDetails = localStorage.getItem(`${chatflowid}_EXTERNAL`);
  if (!chatDetails) return {};
  try {
    return JSON.parse(chatDetails);
  } catch (e) {
    return {};
  }
};

export const removeLocalStorageChatHistory = (chatflowid: string) => {
  const chatDetails = localStorage.getItem(`${chatflowid}_EXTERNAL`);
  if (!chatDetails) return;
  try {
    const parsedChatDetails = JSON.parse(chatDetails);
    if (parsedChatDetails.lead) {
      // Dont remove lead when chat is cleared
      const obj = { lead: parsedChatDetails.lead };
      localStorage.removeItem(`${chatflowid}_EXTERNAL`);
      localStorage.setItem(`${chatflowid}_EXTERNAL`, JSON.stringify(obj));
    } else {
      localStorage.removeItem(`${chatflowid}_EXTERNAL`);
    }
  } catch (e) {
    return;
  }
};

export const getBubbleButtonSize = (size: 'small' | 'medium' | 'large' | number | undefined) => {
  if (!size) return 48;
  if (typeof size === 'number') return size;
  if (size === 'small') return 32;
  if (size === 'medium') return 48;
  if (size === 'large') return 64;
  return 48;
};
