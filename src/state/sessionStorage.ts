import type { MessageType } from '@/components/Bot';

export type LeadCaptureData = Record<string, unknown>;

export type SessionV2 = {
  chatId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

export type ChatflowIndexV2 = {
  version: 2;
  activeChatId: string;
  sessions: SessionV2[];
  lead?: LeadCaptureData;
};

const indexKey = (chatflowid: string) => `${chatflowid}_EXTERNAL`;
const msgKey = (chatflowid: string, chatId: string) => `${chatflowid}_EXTERNAL_msgs_${chatId}`;
const capWarnedKey = (chatflowid: string) => `${chatflowid}_EXTERNAL_capWarned`;
const panelCollapsedKey = (chatflowid: string) => `${chatflowid}_EXTERNAL_panelCollapsed`;

const safeParse = <T>(raw: string | null): T | null => {
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const readIndex = (chatflowid: string): ChatflowIndexV2 | null => {
  const parsed = safeParse<unknown>(localStorage.getItem(indexKey(chatflowid)));
  if (!parsed || typeof parsed !== 'object') return null;
  if ((parsed as ChatflowIndexV2).version === 2) return parsed as ChatflowIndexV2;
  return null;
};

export const readMessages = (chatflowid: string, chatId: string): MessageType[] => {
  const parsed = safeParse<unknown>(localStorage.getItem(msgKey(chatflowid, chatId)));
  return Array.isArray(parsed) ? (parsed as MessageType[]) : [];
};

export const readPanelCollapsed = (chatflowid: string): boolean => {
  return localStorage.getItem(panelCollapsedKey(chatflowid)) === '1';
};

export const readCapWarned = (chatflowid: string): boolean => {
  return localStorage.getItem(capWarnedKey(chatflowid)) === '1';
};

export const _internalKeys = { indexKey, msgKey, capWarnedKey, panelCollapsedKey };
