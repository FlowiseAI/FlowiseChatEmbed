import { createSignal, createMemo } from 'solid-js';
import type { MessageType } from '@/components/Bot';
import {
  type ChatflowIndexV2,
  type SessionV2,
  readMessages,
  reconcileOrphans,
  writeIndex,
  writeMessages,
} from './sessionStorage';
import { loadOrMigrate } from './sessionMigration';

const DEFAULT_MAX_SESSIONS = 50;

export type SessionStoreOptions = {
  chatflowid: string;
  newChatId: () => string;
  maxSessions?: number;
};

export type SessionStore = ReturnType<typeof createSessionStore>;

export const createSessionStore = (opts: SessionStoreOptions) => {
  const { chatflowid, newChatId } = opts;
  const maxSessions = opts.maxSessions ?? DEFAULT_MAX_SESSIONS;

  // ---- init ----
  const initial = loadOrMigrate(chatflowid, newChatId);
  const reconcile = reconcileOrphans(chatflowid, initial);
  for (const id of reconcile.missingMsgKeys) writeMessages(chatflowid, id, []);

  const [index, setIndex] = createSignal<ChatflowIndexV2>(initial);

  // Lazy in-memory cache: chatId → messages. Populated on read.
  const messageCache = new Map<string, MessageType[]>();
  messageCache.set(initial.activeChatId, readMessages(chatflowid, initial.activeChatId));
  const [activeMessages, setActiveMessages] = createSignal<MessageType[]>(
    messageCache.get(initial.activeChatId)!,
  );

  // ---- selectors ----
  const sessions = createMemo(() =>
    [...index().sessions].sort((a, b) => b.updatedAt - a.updatedAt),
  );
  const activeChatId = createMemo(() => index().activeChatId);
  const activeSession = createMemo<SessionV2 | undefined>(() =>
    index().sessions.find((s) => s.chatId === activeChatId()),
  );
  const lead = createMemo(() => index().lead);

  // ---- internal helpers (used by Task 6) ----
  const _persistIndex = (next: ChatflowIndexV2) => {
    writeIndex(chatflowid, next);
    setIndex(next);
  };

  return {
    chatflowid,
    maxSessions,
    sessions,
    activeChatId,
    activeSession,
    activeMessages,
    lead,
    _internal: {
      index,
      setIndex,
      messageCache,
      setActiveMessages,
      persistIndex: _persistIndex,
    },
  };
};
