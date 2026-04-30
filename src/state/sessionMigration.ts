import type { MessageType } from '@/components/Bot';
import {
  type ChatflowIndexV2,
  type LeadCaptureData,
  writeIndex,
  writeMessages,
} from './sessionStorage';
import { titleFromMessage } from '@/utils/titleFromMessage';

type RawV1 = {
  chatId?: string;
  chatHistory?: MessageType[];
  lead?: LeadCaptureData;
};

const indexKey = (chatflowid: string) => `${chatflowid}_EXTERNAL`;

const isV1Shape = (raw: unknown): raw is RawV1 => {
  if (!raw || typeof raw !== 'object') return false;
  const r = raw as Record<string, unknown>;
  if ('version' in r) return false;
  return typeof r.chatId === 'string' || Array.isArray(r.chatHistory);
};

/**
 * Read whatever is at localStorage[chatflowid_EXTERNAL] and return a v2 index.
 * - v2 already → returned as-is.
 * - v1 shape  → wrapped into a single session, written back to storage, returned.
 * - unknown shape → log warning, return a fresh v2 (does not clobber).
 * - missing → fresh v2 with one empty session.
 *
 * Pass `newChatId` so callers can plumb in their `customerId+uuid` prefix.
 */
export const loadOrMigrate = (chatflowid: string, newChatId: () => string): ChatflowIndexV2 => {
  const raw = localStorage.getItem(indexKey(chatflowid));

  // No entry → fresh
  if (raw === null) {
    const id = newChatId();
    const fresh: ChatflowIndexV2 = {
      version: 2,
      activeChatId: id,
      sessions: [{ chatId: id, title: 'New chat', createdAt: Date.now(), updatedAt: Date.now() }],
    };
    writeIndex(chatflowid, fresh);
    writeMessages(chatflowid, id, []);
    return fresh;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn(`[sessions] could not parse ${indexKey(chatflowid)}; treating as fresh.`);
    const id = newChatId();
    const fresh: ChatflowIndexV2 = {
      version: 2,
      activeChatId: id,
      sessions: [{ chatId: id, title: 'New chat', createdAt: Date.now(), updatedAt: Date.now() }],
    };
    writeIndex(chatflowid, fresh);
    writeMessages(chatflowid, id, []);
    return fresh;
  }

  // v2 → return as-is
  if (parsed && typeof parsed === 'object' && (parsed as ChatflowIndexV2).version === 2) {
    return parsed as ChatflowIndexV2;
  }

  // v1 → migrate
  if (isV1Shape(parsed)) {
    const v1 = parsed as RawV1;
    const chatId = v1.chatId ?? newChatId();
    const messages = v1.chatHistory ?? [];
    const now = Date.now();
    const title = titleFromMessage(messages) ?? 'Previous chat';

    const v2: ChatflowIndexV2 = {
      version: 2,
      activeChatId: chatId,
      sessions: [{ chatId, title, createdAt: now, updatedAt: now }],
      lead: v1.lead,
    };
    writeIndex(chatflowid, v2);
    writeMessages(chatflowid, chatId, messages);
    return v2;
  }

  // Unknown shape → log, do NOT clobber, return fresh in memory only
  console.warn(`[sessions] unknown shape at ${indexKey(chatflowid)}; using fresh in-memory index.`);
  const id = newChatId();
  return {
    version: 2,
    activeChatId: id,
    sessions: [{ chatId: id, title: 'New chat', createdAt: Date.now(), updatedAt: Date.now() }],
  };
};
