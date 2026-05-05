import type { MessageType } from '@/components/Bot';

export type LeadCaptureData = Record<string, unknown>;

export type SessionV2 = {
  chatId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  // Optional pin: starred sessions render in a "Starred" section above
  // "Recents" in the panel. Persisted in the v2 index. Absence is treated as
  // false so legacy/v2 records without the field continue to work.
  starred?: boolean;
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

const safeParse = <T>(raw: string | null, warnContext?: string): T | null => {
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    if (warnContext) {
      console.warn(`[Flowise] sessionStorage: failed to parse ${warnContext} (length=${raw.length}); treating as missing.`);
    }
    return null;
  }
};

export const readIndex = (chatflowid: string): ChatflowIndexV2 | null => {
  const key = indexKey(chatflowid);
  const parsed = safeParse<unknown>(localStorage.getItem(key), key);
  if (!parsed || typeof parsed !== 'object') return null;
  if ((parsed as ChatflowIndexV2).version === 2) return parsed as ChatflowIndexV2;
  return null;
};

export const readMessages = (chatflowid: string, chatId: string): MessageType[] => {
  const key = msgKey(chatflowid, chatId);
  const parsed = safeParse<unknown>(localStorage.getItem(key), key);
  if (parsed === null) return [];
  if (Array.isArray(parsed)) return parsed as MessageType[];
  console.warn(`[Flowise] sessionStorage: ${key} is not an array; treating as empty.`);
  return [];
};

export const readPanelCollapsed = (chatflowid: string): boolean => {
  return localStorage.getItem(panelCollapsedKey(chatflowid)) === '1';
};

export const readCapWarned = (chatflowid: string): boolean => {
  return localStorage.getItem(capWarnedKey(chatflowid)) === '1';
};

export const _internalKeys = { indexKey, msgKey, capWarnedKey, panelCollapsedKey };

export class StorageQuotaError extends Error {
  constructor() {
    super('localStorage quota exceeded');
    this.name = 'StorageQuotaError';
  }
}

export const isQuotaError = (e: unknown): boolean => {
  if (!(e instanceof Error)) return false;
  if (e.name === 'StorageQuotaError') return true;
  return e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || (e as { code?: number }).code === 22;
};

const safeWrite = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (isQuotaError(e)) throw new StorageQuotaError();
    throw e;
  }
};

export const writeIndex = (chatflowid: string, index: ChatflowIndexV2): void => {
  safeWrite(indexKey(chatflowid), JSON.stringify(index));
};

export const writeMessages = (chatflowid: string, chatId: string, messages: MessageType[]): void => {
  safeWrite(msgKey(chatflowid, chatId), JSON.stringify(messages));
};

export const removeMessages = (chatflowid: string, chatId: string): void => {
  localStorage.removeItem(msgKey(chatflowid, chatId));
};

export const writePanelCollapsed = (chatflowid: string, collapsed: boolean): void => {
  safeWrite(panelCollapsedKey(chatflowid), collapsed ? '1' : '0');
};

export const writeCapWarned = (chatflowid: string): void => {
  safeWrite(capWarnedKey(chatflowid), '1');
};

/**
 * Reconcile MsgKey orphans against an Index.
 * - Returns chatIds whose MsgKey was deleted (orphans, not in index).
 * - Returns chatIds in index that have no MsgKey (caller should seed empty).
 */
export const reconcileOrphans = (chatflowid: string, index: ChatflowIndexV2): { deletedOrphans: string[]; missingMsgKeys: string[] } => {
  const indexIds = new Set(index.sessions.map((s) => s.chatId));
  const prefix = `${chatflowid}_EXTERNAL_msgs_`;

  // Snapshot matching keys first; mutating localStorage while iterating
  // localStorage.key(i) is fragile across browsers (Safari has historically
  // reindexed unpredictably).
  const orphanKeys: string[] = [];
  const deletedOrphans: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith(prefix)) continue;
    const chatId = k.slice(prefix.length);
    if (!indexIds.has(chatId)) {
      orphanKeys.push(k);
      deletedOrphans.push(chatId);
    }
  }
  for (const k of orphanKeys) localStorage.removeItem(k);

  const missingMsgKeys: string[] = [];
  for (const s of index.sessions) {
    if (localStorage.getItem(msgKey(chatflowid, s.chatId)) === null) {
      missingMsgKeys.push(s.chatId);
    }
  }

  return { deletedOrphans, missingMsgKeys };
};
