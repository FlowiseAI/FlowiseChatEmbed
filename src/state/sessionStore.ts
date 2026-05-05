import { createSignal, createMemo, batch } from 'solid-js';
import type { MessageType } from '@/components/Bot';
import {
  type ChatflowIndexV2,
  type SessionV2,
  type LeadCaptureData,
  isQuotaError,
  readCapWarned,
  readMessages,
  reconcileOrphans,
  writeCapWarned,
  writeIndex,
  writeMessages,
} from './sessionStorage';
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

  // Bot.tsx registers a getter so onStorage can tell whether the active session
  // is currently streaming; rescue logic only protects in-flight streams.
  let getStreamingChatId: (() => string | undefined) | null = null;
  const setStreamingChatIdGetter = (fn: (() => string | undefined) | null) => {
    getStreamingChatId = fn;
  };

  // ---- cross-tab sync ----
  const indexLsKey = `${chatflowid}_EXTERNAL`;
  const onStorage = (e: StorageEvent) => {
    if (e.key !== indexLsKey || e.newValue === null) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(e.newValue);
    } catch {
      console.error(`[Flowise] sessionStore: ignored corrupt cross-tab index write at ${indexLsKey}.`);
      return;
    }
    if (!parsed || typeof parsed !== 'object' || (parsed as ChatflowIndexV2).version !== 2) return;
    const incoming = parsed as ChatflowIndexV2;
    const prevActiveChatId = activeChatId();
    // Only rescue if active is streaming — a legitimate remote delete must propagate, not be resurrected.
    const localActive = index().sessions.find((s) => s.chatId === prevActiveChatId);
    const remoteDroppedActive = !!localActive && !incoming.sessions.some((s) => s.chatId === prevActiveChatId);
    const protectStream = remoteDroppedActive && getStreamingChatId?.() === prevActiveChatId;
    const next: ChatflowIndexV2 = protectStream
      ? { ...incoming, activeChatId: prevActiveChatId, sessions: [localActive!, ...incoming.sessions] }
      : incoming;
    setIndex(next);
    if (next.activeChatId !== prevActiveChatId) {
      const msgs = readMessages(chatflowid, next.activeChatId);
      messageCache.set(next.activeChatId, msgs);
      setActiveMessages(msgs);
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }

  const dispose = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };

  // Lazy in-memory cache: chatId → messages. Populated on read.
  const messageCache = new Map<string, MessageType[]>();
  messageCache.set(initial.activeChatId, readMessages(chatflowid, initial.activeChatId));
  const [activeMessages, setActiveMessages] = createSignal<MessageType[]>(messageCache.get(initial.activeChatId)!);
  const [capWarning, setCapWarning] = createSignal(false);

  // ---- selectors ----
  const sessions = createMemo(() => [...index().sessions].sort((a, b) => b.updatedAt - a.updatedAt));
  // Split for the panel's "Starred" / "Recents" sections. Within each group,
  // sort by updatedAt desc — same as the unified `sessions` selector.
  const starredSessions = createMemo(() => [...index().sessions].filter((s) => s.starred === true).sort((a, b) => b.updatedAt - a.updatedAt));
  const recentSessions = createMemo(() => [...index().sessions].filter((s) => s.starred !== true).sort((a, b) => b.updatedAt - a.updatedAt));
  const activeChatId = createMemo(() => index().activeChatId);
  const activeSession = createMemo<SessionV2 | undefined>(() => index().sessions.find((s) => s.chatId === activeChatId()));
  const lead = createMemo(() => index().lead);

  const _persistIndex = (next: ChatflowIndexV2) => {
    writeIndex(chatflowid, next);
    setIndex(next);
  };

  // ---- session-changed callback ----
  let onSessionChanged: ((detail: { chatId: string; title: string }) => void) | null = null;
  const setOnSessionChanged = (cb: typeof onSessionChanged) => {
    onSessionChanged = cb;
  };
  const emitSessionChanged = () => {
    if (!onSessionChanged) return;
    const s = activeSession();
    if (s) onSessionChanged({ chatId: s.chatId, title: s.title });
  };

  // Distinct from capWarning: panic = recovery failed (write lost); capWarning = successful eviction.
  const [quotaPanic, setQuotaPanic] = createSignal(false);

  const withQuotaRecovery = (op: () => void) => {
    let attempt = 0;
    while (attempt < 5) {
      try {
        op();
        return;
      } catch (e) {
        if (!isQuotaError(e)) throw e;
        const cur = index();
        const candidates = cur.sessions.filter((s) => s.chatId !== cur.activeChatId).sort((a, b) => a.updatedAt - b.updatedAt);
        if (candidates.length === 0) break;
        const victim = candidates[0];
        localStorage.removeItem(`${chatflowid}_EXTERNAL_msgs_${victim.chatId}`);
        messageCache.delete(victim.chatId);
        cancelPendingPersist(victim.chatId);
        const sessions = cur.sessions.filter((s) => s.chatId !== victim.chatId);
        try {
          writeIndex(chatflowid, { ...cur, sessions });
          setIndex({ ...cur, sessions });
        } catch (innerErr) {
          // Only swallow quota-class errors so corruption/illegal state isn't masked.
          if (!isQuotaError(innerErr)) throw innerErr;
        }
        attempt++;
      }
    }
    setQuotaPanic(true);
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
    withQuotaRecovery(() => writeMessages(chatflowid, id, []));
    messageCache.set(id, []);

    const evicted: string[] = [];
    batch(() => {
      const next: ChatflowIndexV2 = {
        ...index(),
        activeChatId: id,
        sessions: [session, ...index().sessions],
      };

      // Cap eviction: silent FIFO; the panel surfaces this via `capWarning` after eviction.
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

      withQuotaRecovery(() => _persistIndex(next));
      setActiveMessages([]);
      emitSessionChanged();
    });

    for (const eid of evicted) {
      localStorage.removeItem(`${chatflowid}_EXTERNAL_msgs_${eid}`);
      messageCache.delete(eid);
      cancelPendingPersist(eid);
    }

    if (evicted.length > 0 && !readCapWarned(chatflowid)) {
      writeCapWarned(chatflowid);
      setCapWarning(true);
    }

    return id;
  };

  const switchSession = (chatId: string): void => {
    if (chatId === activeChatId()) return;
    const exists = index().sessions.some((s) => s.chatId === chatId);
    if (!exists) return;

    // If the departing session has no user messages, silently drop it so
    // accidental empty sessions don't accumulate in the list.
    const departingId = activeChatId();
    const departingMessages = messageCache.get(departingId) ?? readMessages(chatflowid, departingId);
    const departingIsEmpty = !departingMessages.some((m) => m.type === 'userMessage');
    if (departingIsEmpty) {
      localStorage.removeItem(`${chatflowid}_EXTERNAL_msgs_${departingId}`);
      messageCache.delete(departingId);
    }

    let messages = messageCache.get(chatId);
    if (!messages) {
      messages = readMessages(chatflowid, chatId);
      messageCache.set(chatId, messages);
    }
    batch(() => {
      const current = index();
      const nextSessions = departingIsEmpty ? current.sessions.filter((s) => s.chatId !== departingId) : current.sessions;
      withQuotaRecovery(() => _persistIndex({ ...current, activeChatId: chatId, sessions: nextSessions }));
      setActiveMessages(messages!);
      emitSessionChanged();
    });
  };

  // Per-chatId timer slot: streaming may target a non-active session, so a single shared timer would lose writes on session switch.
  const pendingPersists = new Map<string, ReturnType<typeof setTimeout>>();
  // Otherwise a fired timer would resurrect the just-deleted msgKey as an orphan.
  const cancelPendingPersist = (chatId: string) => {
    const t = pendingPersists.get(chatId);
    if (t === undefined) return;
    clearTimeout(t);
    pendingPersists.delete(chatId);
  };
  const schedulePersist = (chatId: string, messages: MessageType[]) => {
    const existing = pendingPersists.get(chatId);
    if (existing !== undefined) clearTimeout(existing);
    pendingPersists.set(
      chatId,
      setTimeout(() => {
        pendingPersists.delete(chatId);
        withQuotaRecovery(() => writeMessages(chatflowid, chatId, messages));
      }, 150),
    );
  };
  const flushPending = () => {
    for (const [chatId, timer] of pendingPersists) {
      clearTimeout(timer);
      const msgs = messageCache.get(chatId);
      if (msgs) withQuotaRecovery(() => writeMessages(chatflowid, chatId, msgs));
    }
    pendingPersists.clear();
  };

  /**
   * Read messages for a specific chatId. Returns the in-memory cached snapshot
   * if present (which reflects any in-flight streaming writes), otherwise lazily
   * loads from localStorage. Caller must not mutate the returned array.
   */
  const getSessionMessages = (chatId: string): MessageType[] => {
    let cached = messageCache.get(chatId);
    if (!cached) {
      cached = readMessages(chatflowid, chatId);
      messageCache.set(chatId, cached);
    }
    return cached;
  };

  // Visible signal only updates when chatId is active — prevents tokens from another session leaking after a switch.
  // `replaceId` set but not found is a no-op (callers rely on this for stale stream events arriving after session deletion).
  const upsertMessageInSession = (chatId: string, msg: MessageType, options?: { replaceId?: string }): void => {
    const cached = getSessionMessages(chatId);
    let next: MessageType[];
    const findId = options?.replaceId ?? msg.messageId;
    const existingIdx = findId !== undefined ? cached.findIndex((m) => m.messageId === findId) : -1;
    if (existingIdx >= 0) {
      next = [...cached];
      next[existingIdx] = msg;
    } else if (options?.replaceId !== undefined) {
      return; // explicit replace target missing: no-op
    } else {
      next = [...cached, msg];
    }
    messageCache.set(chatId, next);

    // Only update the visible signal if this chatId is the active one.
    if (chatId === activeChatId()) {
      setActiveMessages(next);
    }

    schedulePersist(chatId, next);

    // Bump session.updatedAt and (if first user msg) auto-title. Index writes are cheap.
    const isFirstUserMsg = msg.type === 'userMessage' && next.filter((m) => m.type === 'userMessage').length === 1;
    const current = index();
    const sIdx = current.sessions.findIndex((s) => s.chatId === chatId);
    if (sIdx < 0) return;
    const session = current.sessions[sIdx];
    let nextSession: SessionV2 = { ...session, updatedAt: Date.now() };
    if (isFirstUserMsg && session.title === 'New chat') {
      const t = titleFromMessage(next);
      if (t) nextSession = { ...nextSession, title: t };
    }
    const sessions = [...current.sessions];
    sessions[sIdx] = nextSession;
    withQuotaRecovery(() => _persistIndex({ ...current, sessions }));
  };

  const upsertMessage = (msg: MessageType, options?: { replaceId?: string }): void => {
    upsertMessageInSession(activeChatId(), msg, options);
  };

  /**
   * Remove a message from a specific session by its messageId. No-op if not found.
   * Updates the visible `activeMessages` signal only when the target chatId is active.
   */
  const removeMessageByIdInSession = (chatId: string, messageId: string): void => {
    const cached = getSessionMessages(chatId);
    const next = cached.filter((m) => m.messageId !== messageId);
    if (next.length === cached.length) return;
    messageCache.set(chatId, next);
    if (chatId === activeChatId()) setActiveMessages(next);
    schedulePersist(chatId, next);
  };

  /**
   * Remove a message from the active session by its messageId. No-op if not found.
   * Used to clean up empty placeholder messages after stream abort/error.
   */
  const removeMessageById = (messageId: string): void => {
    removeMessageByIdInSession(activeChatId(), messageId);
  };

  /**
   * Replace the entire active session message list atomically. Used for
   * regenerate-style operations that truncate the message history.
   */
  const replaceActiveMessages = (next: MessageType[]): void => {
    const id = activeChatId();
    messageCache.set(id, next);
    setActiveMessages(next);
    schedulePersist(id, next);
    const current = index();
    const sIdx = current.sessions.findIndex((s) => s.chatId === id);
    if (sIdx < 0) return;
    const sessions = [...current.sessions];
    sessions[sIdx] = { ...sessions[sIdx], updatedAt: Date.now() };
    withQuotaRecovery(() => _persistIndex({ ...current, sessions }));
  };

  const toggleStarred = (chatId: string): void => {
    const current = index();
    const sIdx = current.sessions.findIndex((s) => s.chatId === chatId);
    if (sIdx < 0) return;
    const sessions = [...current.sessions];
    const wasStarred = sessions[sIdx].starred === true;
    sessions[sIdx] = { ...sessions[sIdx], starred: !wasStarred };
    withQuotaRecovery(() => _persistIndex({ ...current, sessions }));
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
    withQuotaRecovery(() => _persistIndex({ ...current, sessions }));
    // Only emit session-changed when the renamed session is the active one,
    // since the event detail includes the title listeners care about.
    if (chatId === current.activeChatId) emitSessionChanged();
  };

  const deleteSession = (chatId: string): void => {
    const current = index();
    const sessions = current.sessions.filter((s) => s.chatId !== chatId);
    cancelPendingPersist(chatId);
    localStorage.removeItem(`${chatflowid}_EXTERNAL_msgs_${chatId}`);
    messageCache.delete(chatId);

    if (sessions.length === 0) {
      // Last session deleted → seed a fresh one.
      withQuotaRecovery(() => _persistIndex({ ...current, sessions: [] }));
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
    withQuotaRecovery(() => _persistIndex({ ...current, activeChatId: nextActive, sessions }));
    // Emit only when the active session actually changed (deleted the active one).
    // When sessions.length === 0, newChat() above already emits — don't double-emit.
    if (nextActive !== current.activeChatId) emitSessionChanged();
  };

  const setLead = (lead: LeadCaptureData | undefined): void => {
    withQuotaRecovery(() => _persistIndex({ ...index(), lead }));
  };

  return {
    chatflowid,
    maxSessions,
    sessions,
    starredSessions,
    recentSessions,
    activeChatId,
    activeSession,
    activeMessages,
    lead,
    capWarning,
    quotaPanic,
    dispose,
    actions: {
      newChat,
      switchSession,
      upsertMessage,
      upsertMessageInSession,
      removeMessageById,
      removeMessageByIdInSession,
      replaceActiveMessages,
      getSessionMessages,
      renameSession,
      toggleStarred,
      deleteSession,
      setLead,
      flushPending,
      setOnSessionChanged,
      setStreamingChatIdGetter,
      dismissCapWarning: () => setCapWarning(false),
      dismissQuotaPanic: () => setQuotaPanic(false),
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
