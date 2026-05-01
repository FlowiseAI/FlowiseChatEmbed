import { createSignal, createMemo, batch } from 'solid-js';
import type { MessageType } from '@/components/Bot';
import {
  type ChatflowIndexV2,
  type SessionV2,
  type LeadCaptureData,
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

  // ---- cross-tab sync ----
  const indexLsKey = `${chatflowid}_EXTERNAL`;
  const onStorage = (e: StorageEvent) => {
    if (e.key !== indexLsKey || e.newValue === null) return;
    try {
      const parsed = JSON.parse(e.newValue);
      if (parsed && typeof parsed === 'object' && parsed.version === 2) {
        const next = parsed as ChatflowIndexV2;
        const prevActiveChatId = activeChatId();
        setIndex(next);
        // Also re-read active session's messages if active changed underneath.
        if (next.activeChatId !== prevActiveChatId) {
          const msgs = readMessages(chatflowid, next.activeChatId);
          messageCache.set(next.activeChatId, msgs);
          setActiveMessages(msgs);
        }
      }
    } catch {
      // ignore corrupt cross-tab write
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

  // ---- internal helpers (used by Task 6) ----
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

  /**
   * Run a write op; on QuotaExceededError, evict the oldest non-active session and retry.
   * Up to `attempts` retries; if it still fails, surfaces a callback to show a toast.
   */
  let onQuotaPanic: (() => void) | null = null;
  const setQuotaPanicHandler = (cb: () => void) => {
    onQuotaPanic = cb;
  };

  const withQuotaRecovery = (op: () => void) => {
    let attempt = 0;
    while (attempt < 5) {
      try {
        op();
        return;
      } catch (e) {
        if (!(e as Error)?.name?.includes('Quota') && !(e instanceof Error && e.message.includes('quota'))) throw e;
        // Evict oldest non-active session.
        const cur = index();
        const candidates = cur.sessions.filter((s) => s.chatId !== cur.activeChatId).sort((a, b) => a.updatedAt - b.updatedAt);
        if (candidates.length === 0) break;
        const victim = candidates[0];
        localStorage.removeItem(`${chatflowid}_EXTERNAL_msgs_${victim.chatId}`);
        messageCache.delete(victim.chatId);
        const sessions = cur.sessions.filter((s) => s.chatId !== victim.chatId);
        // Best-effort persist of pruned index (this might also throw — counts as an attempt).
        try {
          writeIndex(chatflowid, { ...cur, sessions });
          setIndex({ ...cur, sessions });
        } catch {
          // ignore; loop will retry op anyway
        }
        attempt++;
      }
    }
    if (onQuotaPanic) onQuotaPanic();
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

      withQuotaRecovery(() => _persistIndex(next));
      setActiveMessages([]);
      emitSessionChanged();
    });

    for (const eid of evicted) {
      localStorage.removeItem(`${chatflowid}_EXTERNAL_msgs_${eid}`);
      messageCache.delete(eid);
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
    let messages = messageCache.get(chatId);
    if (!messages) {
      messages = readMessages(chatflowid, chatId);
      messageCache.set(chatId, messages);
    }
    batch(() => {
      withQuotaRecovery(() => _persistIndex({ ...index(), activeChatId: chatId }));
      setActiveMessages(messages!);
      emitSessionChanged();
    });
  };

  /**
   * Append or replace a message in the active session.
   * If `messageId` is provided and matches an existing message, that message is
   * replaced (used for streaming token updates). Otherwise the message is appended.
   * Persists with a 150ms debounce on MsgKey writes.
   *
   * NOTE: per-chatId pending persists. The previous single-timer scheme assumed
   * all writes targeted the active session, but streaming-vs-session-switch
   * means we may upsert into a non-active session. Each session gets its own
   * debounce slot so writes are not lost when the user switches between
   * sessions while a stream is in flight.
   */
  const pendingPersists = new Map<string, ReturnType<typeof setTimeout>>();
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

  /**
   * Append or replace a message in a SPECIFIC session (by chatId).
   * Mirrors `upsertMessage` but never assumes the session is active. The visible
   * `activeMessages` signal is only updated when the target chatId is the
   * currently active one — that guarantees streaming events targeted at session
   * B do not appear in session A after the user switches.
   */
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
      setQuotaPanicHandler,
      setOnSessionChanged,
      dismissCapWarning: () => setCapWarning(false),
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
