import { createSignal, createMemo, batch } from 'solid-js';
import type { MessageType } from '@/components/Bot';
import { type ChatflowIndexV2, type SessionV2, type LeadCaptureData, readMessages, reconcileOrphans, writeIndex, writeMessages } from './sessionStorage';
import { loadOrMigrate } from './sessionMigration';
import { titleFromMessage } from '@/utils/titleFromMessage';

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
  const [activeMessages, setActiveMessages] = createSignal<MessageType[]>(messageCache.get(initial.activeChatId)!);

  // ---- selectors ----
  const sessions = createMemo(() => [...index().sessions].sort((a, b) => b.updatedAt - a.updatedAt));
  const activeChatId = createMemo(() => index().activeChatId);
  const activeSession = createMemo<SessionV2 | undefined>(() => index().sessions.find((s) => s.chatId === activeChatId()));
  const lead = createMemo(() => index().lead);

  // ---- internal helpers (used by Task 6) ----
  const _persistIndex = (next: ChatflowIndexV2) => {
    writeIndex(chatflowid, next);
    setIndex(next);
  };

  // ---- actions ----
  const newChat = (): string => {
    const id = newChatId();
    const now = Date.now();
    const session: SessionV2 = {
      chatId: id,
      title: 'New chat',
      createdAt: now,
      updatedAt: now,
    };
    writeMessages(chatflowid, id, []);
    messageCache.set(id, []);

    const evicted: string[] = [];
    batch(() => {
      const next: ChatflowIndexV2 = {
        ...index(),
        activeChatId: id,
        sessions: [session, ...index().sessions],
      };

      // Cap eviction (silent FIFO; toast is wired in Task 11).
      while (next.sessions.length > maxSessions) {
        // Find lowest updatedAt that ISN'T the new active.
        let oldestIdx = -1;
        let oldestAt = Infinity;
        for (let i = 0; i < next.sessions.length; i++) {
          const s = next.sessions[i];
          if (s.chatId === id) continue;
          if (s.updatedAt < oldestAt) {
            oldestAt = s.updatedAt;
            oldestIdx = i;
          }
        }
        if (oldestIdx === -1) break;
        const removed = next.sessions.splice(oldestIdx, 1)[0];
        evicted.push(removed.chatId);
      }

      _persistIndex(next);
      setActiveMessages([]);
    });

    for (const eid of evicted) {
      localStorage.removeItem(`${chatflowid}_EXTERNAL_msgs_${eid}`);
      messageCache.delete(eid);
    }

    return id;
  };

  const switchSession = (chatId: string): void => {
    if (chatId === activeChatId()) return;
    const exists = index().sessions.some((s) => s.chatId === chatId);
    if (!exists) return;
    let messages = messageCache.get(chatId);
    if (!messages) {
      messages = readMessages(chatflowid, chatId);
      messageCache.set(chatId, messages);
    }
    batch(() => {
      _persistIndex({ ...index(), activeChatId: chatId });
      setActiveMessages(messages!);
    });
  };

  /**
   * Append or replace a message in the active session.
   * If `messageId` is provided and matches an existing message, that message is
   * replaced (used for streaming token updates). Otherwise the message is appended.
   * Persists with a 150ms debounce on MsgKey writes.
   */
  let pendingPersist: ReturnType<typeof setTimeout> | null = null;
  const flushPending = () => {
    if (pendingPersist === null) return;
    clearTimeout(pendingPersist);
    pendingPersist = null;
    const id = activeChatId();
    const msgs = messageCache.get(id);
    if (msgs) writeMessages(chatflowid, id, msgs);
  };

  const upsertMessage = (msg: MessageType): void => {
    const id = activeChatId();
    const cached = messageCache.get(id) ?? [];
    let next: MessageType[];
    const existingIdx =
      msg.messageId !== undefined ? cached.findIndex((m) => m.messageId === msg.messageId) : -1;
    if (existingIdx >= 0) {
      next = [...cached];
      next[existingIdx] = msg;
    } else {
      next = [...cached, msg];
    }
    messageCache.set(id, next);
    setActiveMessages(next);

    // Debounce MsgKey writes for streaming.
    if (pendingPersist !== null) clearTimeout(pendingPersist);
    pendingPersist = setTimeout(() => {
      pendingPersist = null;
      writeMessages(chatflowid, id, next);
    }, 150);

    // Bump session.updatedAt and (if first user msg) auto-title. Index writes are cheap.
    const isFirstUserMsg =
      msg.type === 'userMessage' && next.filter((m) => m.type === 'userMessage').length === 1;
    const current = index();
    const sIdx = current.sessions.findIndex((s) => s.chatId === id);
    if (sIdx < 0) return;
    const session = current.sessions[sIdx];
    let nextSession: SessionV2 = { ...session, updatedAt: Date.now() };
    if (isFirstUserMsg && session.title === 'New chat') {
      const t = titleFromMessage(next);
      if (t) nextSession = { ...nextSession, title: t };
    }
    const sessions = [...current.sessions];
    sessions[sIdx] = nextSession;
    _persistIndex({ ...current, sessions });
  };

  const renameSession = (chatId: string, rawTitle: string): void => {
    const trimmed = rawTitle.trim().slice(0, 80);
    const current = index();
    const sIdx = current.sessions.findIndex((s) => s.chatId === chatId);
    if (sIdx < 0) return;
    let nextTitle = trimmed;
    if (nextTitle.length === 0) {
      const cached = messageCache.get(chatId) ?? readMessages(chatflowid, chatId);
      nextTitle = titleFromMessage(cached) ?? 'New chat';
    }
    const sessions = [...current.sessions];
    sessions[sIdx] = { ...sessions[sIdx], title: nextTitle };
    _persistIndex({ ...current, sessions });
  };

  const deleteSession = (chatId: string): void => {
    const current = index();
    const sessions = current.sessions.filter((s) => s.chatId !== chatId);
    localStorage.removeItem(`${chatflowid}_EXTERNAL_msgs_${chatId}`);
    messageCache.delete(chatId);

    if (sessions.length === 0) {
      // Last session deleted → seed a fresh one.
      _persistIndex({ ...current, sessions: [] });
      newChat();
      return;
    }

    let nextActive = current.activeChatId;
    if (nextActive === chatId) {
      // Pick most recently updated remaining session.
      const sortedByRecent = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
      nextActive = sortedByRecent[0].chatId;
      const cached = messageCache.get(nextActive) ?? readMessages(chatflowid, nextActive);
      messageCache.set(nextActive, cached);
      setActiveMessages(cached);
    }
    _persistIndex({ ...current, activeChatId: nextActive, sessions });
  };

  const setLead = (lead: LeadCaptureData | undefined): void => {
    _persistIndex({ ...index(), lead });
  };

  return {
    chatflowid,
    maxSessions,
    sessions,
    activeChatId,
    activeSession,
    activeMessages,
    lead,
    actions: {
      newChat,
      switchSession,
      upsertMessage,
      renameSession,
      deleteSession,
      setLead,
      flushPending,
    },
    _internal: {
      index,
      setIndex,
      messageCache,
      setActiveMessages,
      persistIndex: _persistIndex,
    },
  };
};
