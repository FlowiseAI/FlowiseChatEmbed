import { readIndex, readMessages, writeIndex } from '@/state/sessionStorage';

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
        headers?: Record<string, any>;
        formData?: FormData;
        onRequest?: (request: RequestInit) => Promise<void>;
        signal?: AbortSignal;
      }
    | string,
): Promise<{ data?: ResponseData; error?: Error }> => {
  try {
    const url = typeof params === 'string' ? params : params.url;
    const headers =
      typeof params !== 'string' && isDefined(params.body)
        ? {
            'Content-Type': 'application/json',
            ...params.headers,
          }
        : undefined;
    let body: string | FormData | undefined = typeof params !== 'string' && isDefined(params.body) ? JSON.stringify(params.body) : undefined;
    if (typeof params !== 'string' && params.formData) body = params.formData;

    const requestInfo: RequestInit = {
      method: typeof params === 'string' ? 'GET' : params.method,
      mode: 'cors',
      headers,
      body,
      signal: typeof params !== 'string' ? params.signal : undefined,
    };

    if (typeof params !== 'string' && params.onRequest) {
      await params.onRequest(requestInfo);
    }

    const response = await fetch(url, requestInfo);

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

/**
 * v1-compatible wrapper. Writes are field-level merges over the v2 index
 * (and active-session messages where applicable), so callers writing
 * `{ lead }` or `{ chatHistory }` don't clobber other v2 fields.
 */
export const setLocalStorageChatflow = (chatflowid: string, chatId: string, saveObj: Record<string, any> = {}) => {
  const idx = readIndex(chatflowid);
  if (!idx) {
    // No v2 yet: fall back to legacy single-key write so nothing breaks if
    // the store hasn't initialized. The store will migrate on next mount.
    const existingRaw = localStorage.getItem(`${chatflowid}_EXTERNAL`);
    let existing: Record<string, any> = {};
    if (existingRaw) {
      try {
        existing = JSON.parse(existingRaw);
      } catch {
        // ignore
      }
    }
    const merged = { ...existing, ...saveObj };
    if (chatId) merged.chatId = chatId;
    localStorage.setItem(`${chatflowid}_EXTERNAL`, JSON.stringify(merged));
    return;
  }

  // v2 path: merge known fields.
  const next = { ...idx };
  if ('lead' in saveObj) next.lead = saveObj.lead;
  // chatHistory writes are no-ops on the v2 index (messages live elsewhere); the
  // new write path is via store.upsertMessage.
  writeIndex(chatflowid, next);
};

/**
 * v1-compatible projection. Returns a v1-shaped object derived from the active
 * session of the v2 index, so existing callers (notably the lead-capture path)
 * keep working.
 */
export const getLocalStorageChatflow = (chatflowid: string) => {
  const idx = readIndex(chatflowid);
  if (!idx) {
    const raw = localStorage.getItem(`${chatflowid}_EXTERNAL`);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  const messages = readMessages(chatflowid, idx.activeChatId);
  return {
    chatId: idx.activeChatId,
    chatHistory: messages,
    lead: idx.lead,
  };
};

export const removeLocalStorageChatHistory = (chatflowid: string) => {
  const chatDetails = localStorage.getItem(`${chatflowid}_EXTERNAL`);
  if (!chatDetails) return;
  try {
    const parsed = JSON.parse(chatDetails);
    // v2 path: the index lives at the same key. Stringifying `{ lead }` over it
    // would destroy `version` / `activeChatId` / `sessions` and the next mount
    // would fall into the "unknown shape" branch, dropping every conversation.
    // Per-session deletion in store mode is opt-in via store.actions.deleteSession,
    // so this legacy clear-history path becomes a no-op on a v2 index.
    if (parsed && typeof parsed === 'object' && parsed.version === 2) return;
    if (parsed?.lead) {
      localStorage.setItem(`${chatflowid}_EXTERNAL`, JSON.stringify({ lead: parsed.lead }));
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

export const setCookie = (cname: string, cvalue: string, exdays: number) => {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  const expires = 'expires=' + d.toUTCString();
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
};

export const getCookie = (cname: string): string => {
  const name = cname + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
};

export const resolveDialogContainer = (raw: unknown): HTMLElement | undefined => {
  if (typeof raw === 'string') {
    try {
      const el = document.querySelector(raw) as HTMLElement | null;
      if (el === null) {
        console.warn(`[Flowise] dialogContainer selector "${raw}" did not match any element. Dialog will render inline.`);
      }
      return el ?? undefined;
    } catch {
      console.warn(`[Flowise] Invalid dialogContainer selector: "${raw}". Dialog will render inline.`);
      return undefined;
    }
  }
  if (raw instanceof HTMLElement) return raw;
  return undefined;
};

export const getRecordingExtensionForMime = (mime: string) => {
  const mimeToExt: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/ogg': 'ogg',
    'audio/oga': 'ogg',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/x-wav': 'wav',
  };
  const extension = mimeToExt[mime];
  if (extension) {
    return extension;
  }
  console.warn(`Unsupported audio MIME type: ${mime}. Defaulting to 'webm'.`);
  return 'webm';
};
