# Multi-Session Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a ChatGPT-style multi-session chat experience to FlowiseChatEmbed: one chatflow can host a list of independent conversations the user can create, switch between, rename, and delete. Storage is device-local (`localStorage`); v1 ships opt-in via `BotProps.multiSession.enabled`.

**Architecture:** A new Solid store (`sessionStore`) becomes the single source of truth for sessions. A `SessionPanel` component renders responsively (sidebar in full-page; drawer in bubble/popup). `Bot.tsx` is refactored to read its active thread from the store. Storage uses a *split shape*: a small index keyed by chatflowid plus one localStorage key per session for messages — so streamed appends only rewrite the active session's blob, not the whole list.

**Tech Stack:** Solid.js (1.7), TypeScript, Tailwind, Rollup. No new runtime deps. No new test framework in v1 (deferred per spec Decision #13).

**Spec:** `docs/superpowers/specs/2026-04-29-multi-session-chat-design.md`

---

## Verification Approach (No Test Runner in v1)

Per spec Decision #13, Vitest is **deferred** to a follow-up. Every task in this plan still has a verification step — they're **manual recipes** rather than automated tests:

- **Pure-logic tasks** (storage, migration, title derivation) → verified via a small harness file `public/debug-sessions.html` that we build up over the plan. The author opens it in a browser, runs the harness, and confirms `console.assert` results in the DevTools console.
- **UI tasks** → verified by running `npm run dev` (Rollup watch) + `npm start` (Express server), opening the existing demo at `public/index.html`, and exercising the feature with a written recipe ("click X, expect Y").
- **Integration tasks** → verified end-to-end on the demo page across all three modes (bubble, full-page, popup).

Reviewers must compensate for the missing automated coverage — see spec Section 8.

---

## File Structure

**New files:**
```
src/state/
  sessionStorage.ts        // Index + per-session MsgKey I/O, GC, quota recovery
  sessionMigration.ts      // v1 → v2 in-place migration
  sessionStore.ts          // Solid store: signals, actions, persistence wiring
src/utils/
  titleFromMessage.ts      // Truncate first user message; null fallback
src/components/sessions/
  ChatRoot.tsx             // Shell: conditionally renders panel + Bot
  SessionPanel.tsx         // Responsive panel (sidebar + drawer)
  SessionListItem.tsx      // Row: title, recency, hover actions, rename, delete
  NewChatButton.tsx        // "+ New chat" CTA
  SessionPanelToggle.tsx   // Mode-aware open/collapse trigger
  CapWarningToast.tsx      // One-time first-eviction notice
public/
  debug-sessions.html      // Manual verification harness (kept long-term)
```

**Modified files:**
```
src/components/Bot.tsx                       // Replace internal chatId/messages signals with store-derived
src/types.ts                                 // Add MultiSessionConfig
src/features/bubble/types.ts                 // Extend BubbleTheme.chatWindow with sessionPanel keys
src/features/full/types.ts                   // Same for full-page theme
src/features/popup/types.ts                  // Same for popup theme
src/utils/index.ts                           // Field-merge wrapper for setLocalStorageChatflow
src/features/bubble/components/Bubble.tsx    // Render <ChatRoot> instead of <Bot>
src/features/full/components/Full.tsx        // Same
src/features/popup/components/Popup.tsx      // Same
.gitignore                                   // (already done) ignore .superpowers/
```

---

## Phase 1: Storage Foundations

The store doesn't exist yet. Phase 1 builds the pure-logic layer underneath it: title derivation, raw localStorage I/O, migration. Each is independently verifiable in the browser console.

### Task 1: Title derivation utility

**Files:**
- Create: `src/utils/titleFromMessage.ts`
- Create (or modify if it exists later): `public/debug-sessions.html`

- [ ] **Step 1: Create the utility file**

```ts
// src/utils/titleFromMessage.ts
import type { MessageType } from '@/components/Bot';

const MAX_TITLE_LEN = 40;

export const titleFromMessage = (messages: MessageType[]): string | null => {
  const firstUser = messages.find((m) => m.type === 'userMessage');
  if (!firstUser) return null;

  const stripped = (firstUser.message ?? '')
    .replace(/[`*_~#>[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (stripped.length === 0) return null;

  if (stripped.length <= MAX_TITLE_LEN) return stripped;
  return stripped.slice(0, MAX_TITLE_LEN).trimEnd() + '…';
};
```

- [ ] **Step 2: Create the manual verification harness**

```html
<!-- public/debug-sessions.html -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Multi-session debug harness</title>
    <style>
      body {
        font-family: monospace;
        padding: 24px;
        line-height: 1.6;
      }
      h1 {
        font-size: 18px;
      }
      .pass {
        color: green;
      }
      .fail {
        color: crimson;
      }
      pre {
        background: #f5f5f5;
        padding: 8px;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
    <h1>Multi-session debug harness</h1>
    <p>Open DevTools console — failures are red. Each section is added as the plan progresses.</p>
    <pre id="log"></pre>

    <script type="module">
      const log = document.getElementById('log');
      const print = (msg, ok) => {
        const line = document.createElement('span');
        line.textContent = (ok ? '✓ ' : '✗ ') + msg + '\n';
        line.className = ok ? 'pass' : 'fail';
        log.appendChild(line);
        if (!ok) console.error(msg);
        else console.log('PASS:', msg);
      };
      window.__assert = (cond, msg) => print(msg, !!cond);

      // Section: titleFromMessage
      const { titleFromMessage } = await import('/src/utils/titleFromMessage.ts');

      __assert(titleFromMessage([]) === null, 'empty messages → null');
      __assert(
        titleFromMessage([{ type: 'apiMessage', message: 'hi' }]) === null,
        'no userMessage → null',
      );
      __assert(
        titleFromMessage([{ type: 'userMessage', message: 'Hello world' }]) === 'Hello world',
        'short user message preserved',
      );
      __assert(
        titleFromMessage([{ type: 'userMessage', message: '   spaced   out   ' }]) === 'spaced out',
        'whitespace collapsed and trimmed',
      );
      __assert(
        titleFromMessage([{ type: 'userMessage', message: '**bold** _italic_ `code`' }]) === 'bold italic code',
        'markdown stripped',
      );
      const long = 'a'.repeat(60);
      const t = titleFromMessage([{ type: 'userMessage', message: long }]);
      __assert(t.length === 41 && t.endsWith('…'), 'long message truncated to 40 chars + ellipsis');
      __assert(
        titleFromMessage([{ type: 'userMessage', message: '   ' }]) === null,
        'whitespace-only user message → null',
      );
    </script>
  </body>
</html>
```

> **Note:** `import('/src/utils/titleFromMessage.ts')` works because the harness is served by Rollup's dev server, which transpiles TS on the fly. If your local dev server doesn't, replace with `import('/dist/web.js')` after running `npm run build`.

- [ ] **Step 3: Run the harness**

Run: `npm run dev` in one terminal, `npm start` in another, open `http://localhost:3000/debug-sessions.html` (path matches `server.js` static-serve config — verify the actual port/path; if `server.js` doesn't expose `public/`, add the file directly under wherever it does).

Expected: 7 green ✓ lines for the title cases.

- [ ] **Step 4: Commit**

```bash
git add src/utils/titleFromMessage.ts public/debug-sessions.html
git commit -m "feat(sessions): add titleFromMessage utility and debug harness"
```

---

### Task 2: Session storage I/O — types and reads

Storage is a separate module so it can be unit-verified without Solid runtime. This task adds the types and the read path. Writes come in Task 3.

**Files:**
- Create: `src/state/sessionStorage.ts`
- Modify: `public/debug-sessions.html`

- [ ] **Step 1: Create the storage module with types and read functions**

```ts
// src/state/sessionStorage.ts
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

const safeParse = <T,>(raw: string | null): T | null => {
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
  return safeParse<MessageType[]>(localStorage.getItem(msgKey(chatflowid, chatId))) ?? [];
};

export const readPanelCollapsed = (chatflowid: string): boolean => {
  return localStorage.getItem(panelCollapsedKey(chatflowid)) === '1';
};

export const readCapWarned = (chatflowid: string): boolean => {
  return localStorage.getItem(capWarnedKey(chatflowid)) === '1';
};

export const _internalKeys = { indexKey, msgKey, capWarnedKey, panelCollapsedKey };
```

- [ ] **Step 2: Add storage-read assertions to the harness**

Append inside the existing `<script type="module">` of `public/debug-sessions.html`, right before the closing `</script>`:

```js
// Section: sessionStorage reads
const { readIndex, readMessages, readPanelCollapsed, _internalKeys } = await import(
  '/src/state/sessionStorage.ts'
);

const cf = '__test_cf_' + Date.now();

// Empty state
__assert(readIndex(cf) === null, 'no entry → readIndex returns null');
__assert(readMessages(cf, 'x').length === 0, 'no messages → readMessages returns []');
__assert(readPanelCollapsed(cf) === false, 'no collapse pref → false');

// v2 entry
const v2 = {
  version: 2,
  activeChatId: 'a',
  sessions: [{ chatId: 'a', title: 'Hello', createdAt: 1, updatedAt: 2 }],
};
localStorage.setItem(_internalKeys.indexKey(cf), JSON.stringify(v2));
const got = readIndex(cf);
__assert(got && got.activeChatId === 'a', 'v2 entry round-trips');

// Corrupt entry
localStorage.setItem(_internalKeys.indexKey(cf), 'not json');
__assert(readIndex(cf) === null, 'corrupt JSON → null');

// v1 entry (no version field) → null at this layer (migration handles upgrade later)
localStorage.setItem(_internalKeys.indexKey(cf), JSON.stringify({ chatId: 'x', chatHistory: [] }));
__assert(readIndex(cf) === null, 'v1-shaped entry → null at storage layer');

// Cleanup
localStorage.removeItem(_internalKeys.indexKey(cf));
```

- [ ] **Step 3: Run the harness**

Refresh the debug page. Expected: previous 7 green ✓ lines plus 5 more for storage reads.

- [ ] **Step 4: Commit**

```bash
git add src/state/sessionStorage.ts public/debug-sessions.html
git commit -m "feat(sessions): add sessionStorage read API and types"
```

---

### Task 3: Session storage I/O — writes, GC, quota recovery

**Files:**
- Modify: `src/state/sessionStorage.ts`
- Modify: `public/debug-sessions.html`

- [ ] **Step 1: Add write/delete and GC functions to the storage module**

Append to `src/state/sessionStorage.ts`:

```ts
export class StorageQuotaError extends Error {
  constructor() {
    super('localStorage quota exceeded');
    this.name = 'StorageQuotaError';
  }
}

const isQuotaError = (e: unknown): boolean => {
  if (!(e instanceof Error)) return false;
  return (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    (e as { code?: number }).code === 22
  );
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

export const writeMessages = (
  chatflowid: string,
  chatId: string,
  messages: MessageType[],
): void => {
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
export const reconcileOrphans = (
  chatflowid: string,
  index: ChatflowIndexV2,
): { deletedOrphans: string[]; missingMsgKeys: string[] } => {
  const indexIds = new Set(index.sessions.map((s) => s.chatId));
  const prefix = `${chatflowid}_EXTERNAL_msgs_`;

  const deletedOrphans: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith(prefix)) continue;
    const chatId = k.slice(prefix.length);
    if (!indexIds.has(chatId)) {
      localStorage.removeItem(k);
      deletedOrphans.push(chatId);
      i--; // length shrunk
    }
  }

  const missingMsgKeys: string[] = [];
  for (const s of index.sessions) {
    if (localStorage.getItem(msgKey(chatflowid, s.chatId)) === null) {
      missingMsgKeys.push(s.chatId);
    }
  }

  return { deletedOrphans, missingMsgKeys };
};
```

- [ ] **Step 2: Add write/GC assertions to the harness**

Append to the harness `<script>` block:

```js
// Section: sessionStorage writes + reconcile
const {
  writeIndex,
  writeMessages,
  removeMessages,
  reconcileOrphans,
  StorageQuotaError,
} = await import('/src/state/sessionStorage.ts');

const cf2 = '__test_cf2_' + Date.now();

// Round-trip
const idx = {
  version: 2,
  activeChatId: 'a',
  sessions: [
    { chatId: 'a', title: 'A', createdAt: 1, updatedAt: 1 },
    { chatId: 'b', title: 'B', createdAt: 2, updatedAt: 2 },
  ],
};
writeIndex(cf2, idx);
writeMessages(cf2, 'a', [{ type: 'userMessage', message: 'hi' }]);
writeMessages(cf2, 'b', [{ type: 'userMessage', message: 'yo' }]);

const got2 = readIndex(cf2);
__assert(got2 && got2.sessions.length === 2, 'index write+read round-trip');
__assert(readMessages(cf2, 'a').length === 1, 'messages a round-trip');
__assert(readMessages(cf2, 'b').length === 1, 'messages b round-trip');

// Orphan: write a MsgKey for a chatId not in the index
writeMessages(cf2, 'orphan-id', [{ type: 'userMessage', message: 'lost' }]);
const result1 = reconcileOrphans(cf2, idx);
__assert(result1.deletedOrphans.includes('orphan-id'), 'orphan MsgKey detected and deleted');
__assert(readMessages(cf2, 'orphan-id').length === 0, 'orphan MsgKey actually removed');

// Missing: index has 'c' but no MsgKey
const idxWithMissing = {
  ...idx,
  sessions: [...idx.sessions, { chatId: 'c', title: 'C', createdAt: 3, updatedAt: 3 }],
};
const result2 = reconcileOrphans(cf2, idxWithMissing);
__assert(result2.missingMsgKeys.includes('c'), 'missing MsgKey detected');

// Cleanup
removeMessages(cf2, 'a');
removeMessages(cf2, 'b');
localStorage.removeItem(`${cf2}_EXTERNAL`);
```

- [ ] **Step 3: Run harness, expect all green**

Refresh debug page. Total: 7 (Task 1) + 5 (Task 2) + 5 = 17 green ✓ lines.

- [ ] **Step 4: Commit**

```bash
git add src/state/sessionStorage.ts public/debug-sessions.html
git commit -m "feat(sessions): add storage writes, GC, and quota error type"
```

---

### Task 4: v1 → v2 migration

**Files:**
- Create: `src/state/sessionMigration.ts`
- Modify: `public/debug-sessions.html`

- [ ] **Step 1: Create the migration module**

```ts
// src/state/sessionMigration.ts
import type { MessageType } from '@/components/Bot';
import {
  type ChatflowIndexV2,
  type LeadCaptureData,
  readMessages,
  writeIndex,
  writeMessages,
} from './sessionStorage';
import { titleFromMessage } from '@/utils/titleFromMessage';
import { v4 as uuidv4 } from 'uuid';

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
export const loadOrMigrate = (
  chatflowid: string,
  newChatId: () => string,
): ChatflowIndexV2 => {
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
```

- [ ] **Step 2: Add migration assertions to the harness**

Append:

```js
// Section: migration
const { loadOrMigrate } = await import('/src/state/sessionMigration.ts');

const mkId = () => 'mig-' + Math.random().toString(16).slice(2, 8);
const cf3 = '__test_cf3_' + Date.now();

// Empty → fresh v2
const r1 = loadOrMigrate(cf3, mkId);
__assert(r1.version === 2 && r1.sessions.length === 1, 'empty → fresh v2 with one session');
__assert(r1.sessions[0].title === 'New chat', 'fresh session titled "New chat"');
localStorage.removeItem(`${cf3}_EXTERNAL`);

// v1 with chatHistory → migrate
localStorage.setItem(
  `${cf3}_EXTERNAL`,
  JSON.stringify({
    chatId: 'old-1',
    chatHistory: [
      { type: 'userMessage', message: 'How do I export to CSV?' },
      { type: 'apiMessage', message: 'You can use…' },
    ],
    lead: { email: 'a@b.com' },
  }),
);
const r2 = loadOrMigrate(cf3, mkId);
__assert(r2.activeChatId === 'old-1', 'v1 chatId carried over');
__assert(r2.sessions[0].title.startsWith('How do I export'), 'title derived from first user msg');
__assert(r2.lead && r2.lead.email === 'a@b.com', 'lead preserved');
__assert(readMessages(cf3, 'old-1').length === 2, 'chatHistory written to MsgKey');
__assert(readIndex(cf3)?.version === 2, 'storage now contains v2');
localStorage.removeItem(`${cf3}_EXTERNAL`);
localStorage.removeItem(`${cf3}_EXTERNAL_msgs_old-1`);

// v1 with empty chatHistory → "Previous chat"
localStorage.setItem(`${cf3}_EXTERNAL`, JSON.stringify({ chatId: 'p', chatHistory: [] }));
const r3 = loadOrMigrate(cf3, mkId);
__assert(r3.sessions[0].title === 'Previous chat', 'empty v1 history → "Previous chat"');
localStorage.removeItem(`${cf3}_EXTERNAL`);
localStorage.removeItem(`${cf3}_EXTERNAL_msgs_p`);

// v2 idempotent
const v2idx = {
  version: 2,
  activeChatId: 'a',
  sessions: [{ chatId: 'a', title: 'kept', createdAt: 9, updatedAt: 9 }],
};
localStorage.setItem(`${cf3}_EXTERNAL`, JSON.stringify(v2idx));
const r4 = loadOrMigrate(cf3, mkId);
__assert(r4.activeChatId === 'a' && r4.sessions[0].title === 'kept', 'v2 idempotent');
localStorage.removeItem(`${cf3}_EXTERNAL`);

// Unknown shape → does NOT clobber
localStorage.setItem(`${cf3}_EXTERNAL`, JSON.stringify({ totally: 'unknown' }));
const r5 = loadOrMigrate(cf3, mkId);
__assert(r5.version === 2, 'unknown shape → fresh in-memory v2');
__assert(
  JSON.parse(localStorage.getItem(`${cf3}_EXTERNAL`)).totally === 'unknown',
  'unknown shape NOT overwritten in storage',
);
localStorage.removeItem(`${cf3}_EXTERNAL`);
```

- [ ] **Step 3: Run harness, expect all green**

Total now: 17 + 8 = 25 green ✓ lines.

- [ ] **Step 4: Commit**

```bash
git add src/state/sessionMigration.ts public/debug-sessions.html
git commit -m "feat(sessions): add v1→v2 in-place migration"
```

---

## Phase 2: Store Layer

### Task 5: Session store skeleton — signals, init, query selectors

The store wraps the storage module in Solid signals. This task wires init + read selectors. Mutations come in Task 6.

**Files:**
- Create: `src/state/sessionStore.ts`
- Modify: `public/debug-sessions.html`

- [ ] **Step 1: Create the store skeleton**

```ts
// src/state/sessionStore.ts
import { createSignal, createMemo, batch } from 'solid-js';
import type { MessageType } from '@/components/Bot';
import {
  type ChatflowIndexV2,
  type LeadCaptureData,
  type SessionV2,
  readMessages,
  reconcileOrphans,
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
```

- [ ] **Step 2: Add a Solid render harness section**

The store uses Solid's reactive primitives, so plain `import` won't suffice — we need to render it inside a Solid root. Append:

```js
// Section: sessionStore init
const { createRoot } = await import('https://cdn.skypack.dev/solid-js@1.7.1');
const { createSessionStore } = await import('/src/state/sessionStore.ts');

const cf4 = '__test_cf4_' + Date.now();
let counter = 0;
const idGen = () => 'gen-' + ++counter;

let store;
createRoot((dispose) => {
  store = createSessionStore({ chatflowid: cf4, newChatId: idGen });
  __assert(store.sessions().length === 1, 'fresh store → one session');
  __assert(store.activeChatId() === store.sessions()[0].chatId, 'active id matches first session');
  __assert(store.activeSession()?.title === 'New chat', 'fresh active session titled "New chat"');
  __assert(Array.isArray(store.activeMessages()) && store.activeMessages().length === 0, 'no active messages');
  dispose();
});

// Cleanup
const idx = readIndex(cf4);
if (idx) {
  for (const s of idx.sessions) localStorage.removeItem(`${cf4}_EXTERNAL_msgs_${s.chatId}`);
}
localStorage.removeItem(`${cf4}_EXTERNAL`);
```

> **Note:** The `https://cdn.skypack.dev/...` import in the harness keeps the harness self-contained. If your network blocks Skypack, replace with `import('/node_modules/solid-js/dist/solid.js')` or build a tiny wrapper.

- [ ] **Step 3: Run harness, expect all green**

Total: 25 + 4 = 29.

- [ ] **Step 4: Commit**

```bash
git add src/state/sessionStore.ts public/debug-sessions.html
git commit -m "feat(sessions): scaffold sessionStore with init + selectors"
```

---

### Task 6: Session store actions — newChat, switchSession, append, rename, delete

**Files:**
- Modify: `src/state/sessionStore.ts`
- Modify: `public/debug-sessions.html`

- [ ] **Step 1: Add action methods to the store**

Replace the `return { ... }` block at the end of `createSessionStore` with:

```ts
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

    let evicted: string[] = [];
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
```

- [ ] **Step 2: Add action assertions to the harness**

Append:

```js
// Section: sessionStore actions
const cf5 = '__test_cf5_' + Date.now();
let nextId = 0;
const id5 = () => 'a-' + ++nextId;

await new Promise((resolve) => {
  createRoot((dispose) => {
    const s = createSessionStore({ chatflowid: cf5, newChatId: id5, maxSessions: 3 });

    // newChat
    const idA = s.activeChatId();
    const idB = s.actions.newChat();
    __assert(s.sessions().length === 2, 'newChat appended');
    __assert(s.activeChatId() === idB, 'newChat became active');

    // switchSession
    s.actions.switchSession(idA);
    __assert(s.activeChatId() === idA, 'switchSession changed active');

    // upsertMessage + auto-title
    s.actions.upsertMessage({ type: 'userMessage', message: 'How do I export?', messageId: 'm1' });
    s.actions.flushPending();
    __assert(
      s.activeSession()?.title === 'How do I export?',
      'first user message auto-titled active session',
    );

    // upsertMessage replace by messageId (streaming-style)
    s.actions.upsertMessage({ type: 'apiMessage', message: 'Stre', messageId: 'b1' });
    s.actions.upsertMessage({ type: 'apiMessage', message: 'Streaming...', messageId: 'b1' });
    s.actions.flushPending();
    const last = s.activeMessages()[s.activeMessages().length - 1];
    __assert(last.message === 'Streaming...', 'upsert by messageId replaces existing message');

    // rename — empty falls back
    s.actions.renameSession(idA, '   ');
    __assert(
      s.activeSession()?.title === 'How do I export?',
      'empty rename falls back to derived title',
    );
    s.actions.renameSession(idA, 'My custom title');
    __assert(s.activeSession()?.title === 'My custom title', 'rename takes effect');

    // cap eviction (max=3): create until we hit cap+1
    s.actions.newChat(); // → 3 sessions total
    __assert(s.sessions().length === 3, 'at cap with 3 sessions');
    s.actions.newChat(); // → would be 4; oldest evicted
    __assert(s.sessions().length === 3, 'eviction kept count at cap');
    __assert(
      !s.sessions().some((sess) => sess.chatId === idA),
      'oldest non-active session evicted',
    );

    // delete active → switches to most recent remaining
    const activeBeforeDelete = s.activeChatId();
    s.actions.deleteSession(activeBeforeDelete);
    __assert(s.activeChatId() !== activeBeforeDelete, 'deleting active picks new active');
    __assert(
      !s.sessions().some((sess) => sess.chatId === activeBeforeDelete),
      'deleted session removed from list',
    );

    dispose();
    resolve();
  });
});

// Cleanup
const idx5 = readIndex(cf5);
if (idx5) for (const sess of idx5.sessions) {
  localStorage.removeItem(`${cf5}_EXTERNAL_msgs_${sess.chatId}`);
}
localStorage.removeItem(`${cf5}_EXTERNAL`);
```

- [ ] **Step 3: Run harness, expect 11 new green lines**

Total: 29 + 11 = 40.

- [ ] **Step 4: Commit**

```bash
git add src/state/sessionStore.ts public/debug-sessions.html
git commit -m "feat(sessions): add store actions (new/switch/upsert/rename/delete)"
```

---

### Task 7: Quota error handling — emergency eviction wrapper

**Files:**
- Modify: `src/state/sessionStore.ts`

This wraps every persist that could fail with quota recovery. We don't have a clean way to simulate `QuotaExceededError` in the harness (browsers don't let you cap a domain easily), so verification is by code review + manual fill-the-quota test in Task 21.

- [ ] **Step 1: Add a quota-recovery helper above the actions**

Insert into `createSessionStore` after the `_persistIndex` declaration:

```ts
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
        const candidates = cur.sessions
          .filter((s) => s.chatId !== cur.activeChatId)
          .sort((a, b) => a.updatedAt - b.updatedAt);
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
```

- [ ] **Step 2: Wrap the existing persist sites**

Replace every direct `_persistIndex(next)` and `writeMessages(chatflowid, id, next)` inside `newChat`, `upsertMessage`, `renameSession`, `deleteSession`, `setLead`, and `flushPending` to go through `withQuotaRecovery`. Example (one site shown — apply pattern to all):

In `flushPending`:

```ts
  const flushPending = () => {
    if (pendingPersist === null) return;
    clearTimeout(pendingPersist);
    pendingPersist = null;
    const id = activeChatId();
    const msgs = messageCache.get(id);
    if (msgs) withQuotaRecovery(() => writeMessages(chatflowid, id, msgs));
  };
```

In `upsertMessage` (the debounced setTimeout body):

```ts
    pendingPersist = setTimeout(() => {
      pendingPersist = null;
      withQuotaRecovery(() => writeMessages(chatflowid, id, next));
    }, 150);
```

For `_persistIndex` calls inside actions, wrap the call: `withQuotaRecovery(() => _persistIndex(next))`.

- [ ] **Step 3: Expose `setQuotaPanicHandler` on the store return**

In the returned object:

```ts
    actions: {
      // ...existing
      flushPending,
      setQuotaPanicHandler,
    },
```

- [ ] **Step 4: Lint check**

Run: `npm run lint`
Expected: no new errors. Pre-existing warnings in `Bot.tsx` are acceptable.

- [ ] **Step 5: Commit**

```bash
git add src/state/sessionStore.ts
git commit -m "feat(sessions): add emergency eviction on QuotaExceededError"
```

---

## Phase 3: Config Surface & Shell

### Task 8: Add `MultiSessionConfig` to `BotProps` and theme keys

**Files:**
- Modify: `src/components/Bot.tsx` (BotProps only)
- Modify: `src/features/bubble/types.ts`
- Modify: `src/features/full/types.ts`
- Modify: `src/features/popup/types.ts`

- [ ] **Step 1: Add `MultiSessionConfig` and extend `BotProps`**

In `src/components/Bot.tsx`, just before `export type BotProps = {` insert:

```ts
export type MultiSessionConfig = {
  enabled: boolean;
  maxSessions?: number;
};
```

Then add to `BotProps`:

```ts
  multiSession?: MultiSessionConfig;
```

- [ ] **Step 2: Extend each theme's `chatWindow` with `sessionPanel`**

In `src/features/bubble/types.ts`, find the `chatWindow` shape inside `BubbleTheme` and add a new optional `sessionPanel` member:

```ts
sessionPanel?: {
  width?: string | number;
  collapsedWidth?: string | number;
  backgroundColor?: string;
  textColor?: string;
  activeBackgroundColor?: string;
  activeTextColor?: string;
  hoverBackgroundColor?: string;
  borderColor?: string;
  newChatButtonColor?: string;
  newChatButtonTextColor?: string;
  newChatLabel?: string;
  emptyStateText?: string;
  capWarningText?: string;
};
```

Repeat verbatim in `src/features/full/types.ts` and `src/features/popup/types.ts`.

- [ ] **Step 3: Verify TS compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/Bot.tsx src/features/bubble/types.ts src/features/full/types.ts src/features/popup/types.ts
git commit -m "feat(sessions): add MultiSessionConfig to BotProps and sessionPanel theme keys"
```

---

### Task 9: `setLocalStorageChatflow` field-merge wrapper

The existing helper is now backed by the new storage module. Without this wrapper, a `lead` write would clobber `sessions`.

**Files:**
- Modify: `src/utils/index.ts`

- [ ] **Step 1: Replace `setLocalStorageChatflow` and `getLocalStorageChatflow`**

Replace lines 77–104 of `src/utils/index.ts` with:

```ts
import { readIndex, readMessages, writeIndex } from '@/state/sessionStorage';

/**
 * v1-compatible wrapper. Writes are field-level merges over the v2 index
 * (and active-session messages where applicable), so callers writing
 * `{ lead }` or `{ chatHistory }` don't clobber other v2 fields.
 */
export const setLocalStorageChatflow = (
  chatflowid: string,
  chatId: string,
  saveObj: Record<string, any> = {},
) => {
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
```

- [ ] **Step 2: Verify lint + build**

Run: `npm run lint && npm run build`
Expected: passes (with the same pre-existing warnings in `Bot.tsx`).

- [ ] **Step 3: Commit**

```bash
git add src/utils/index.ts
git commit -m "refactor(sessions): make setLocalStorageChatflow a field-merge wrapper over v2 index"
```

---

### Task 10: `ChatRoot` shell

This is a Solid component that wraps `<Bot>` with conditional panel rendering. The panel itself is empty until Phase 4.

**Files:**
- Create: `src/components/sessions/ChatRoot.tsx`
- Modify: `src/components/index.ts` (re-export)

- [ ] **Step 1: Create `ChatRoot.tsx`**

```tsx
// src/components/sessions/ChatRoot.tsx
import { Show } from 'solid-js';
import { Bot, type BotProps } from '@/components/Bot';

type ChatRootProps = BotProps & { class?: string };

/**
 * Wraps <Bot> with the session panel slot. When multiSession is disabled,
 * renders <Bot> directly. The panel itself is added in a later task.
 */
export const ChatRoot = (props: ChatRootProps) => {
  const enabled = () => props.multiSession?.enabled === true;

  return (
    <Show when={enabled()} fallback={<Bot {...props} />}>
      <div class="flex h-full w-full" data-multisession>
        <div data-session-panel-slot />
        <Bot {...props} />
      </div>
    </Show>
  );
};
```

- [ ] **Step 2: Re-export from `src/components/index.ts`**

Add to the existing exports:

```ts
export { ChatRoot } from './sessions/ChatRoot';
```

(If the export style in this file is `export *`, just add a new line `export * from './sessions/ChatRoot';`.)

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/components/sessions/ChatRoot.tsx src/components/index.ts
git commit -m "feat(sessions): add ChatRoot shell component"
```

---

## Phase 4: Panel UI

The store and shell are now in place. This phase builds the visible panel: list, item, new-chat, rename, delete, empty state, cap-warning toast. Each task adds one piece, verified manually on the demo page.

### Task 11: `SessionPanel` skeleton with theme cascade

**Files:**
- Create: `src/components/sessions/SessionPanel.tsx`
- Modify: `src/components/sessions/ChatRoot.tsx`

- [ ] **Step 1: Create `SessionPanel.tsx` with the layout shell**

```tsx
// src/components/sessions/SessionPanel.tsx
import { For, Show } from 'solid-js';
import type { SessionStore } from '@/state/sessionStore';

type SessionPanelTheme = {
  width?: string | number;
  collapsedWidth?: string | number;
  backgroundColor?: string;
  textColor?: string;
  activeBackgroundColor?: string;
  activeTextColor?: string;
  hoverBackgroundColor?: string;
  borderColor?: string;
  newChatButtonColor?: string;
  newChatButtonTextColor?: string;
  newChatLabel?: string;
  emptyStateText?: string;
  capWarningText?: string;
};

type Props = {
  store: SessionStore;
  isFullPage: boolean;
  panelTheme?: SessionPanelTheme;
  // Cascade: fall through to chatWindow palette if panel keys unset.
  chatWindowBackground?: string;
  chatWindowText?: string;
};

const px = (v: string | number | undefined, fallback: string) =>
  v === undefined ? fallback : typeof v === 'number' ? `${v}px` : v;

export const SessionPanel = (props: Props) => {
  const sessions = () => props.store.sessions();
  const activeId = () => props.store.activeChatId();
  const newChatLabel = () => props.panelTheme?.newChatLabel ?? 'New chat';
  const emptyText = () => props.panelTheme?.emptyStateText ?? 'No conversations yet';

  const bg = () => props.panelTheme?.backgroundColor ?? props.chatWindowBackground ?? '#f8fafc';
  const fg = () => props.panelTheme?.textColor ?? props.chatWindowText ?? '#334155';
  const activeBg = () => props.panelTheme?.activeBackgroundColor ?? '#e0e7ff';
  const activeFg = () => props.panelTheme?.activeTextColor ?? '#1e1b4b';
  const hoverBg = () => props.panelTheme?.hoverBackgroundColor ?? 'rgba(0,0,0,0.04)';
  const border = () => props.panelTheme?.borderColor ?? '#e2e8f0';
  const newBtnBg = () => props.panelTheme?.newChatButtonColor ?? '#4f46e5';
  const newBtnFg = () => props.panelTheme?.newChatButtonTextColor ?? '#ffffff';

  const handleNewChat = () => {
    props.store.actions.newChat();
  };
  const handleSwitch = (id: string) => {
    props.store.actions.switchSession(id);
  };

  return (
    <nav
      role="navigation"
      aria-label="Conversations"
      style={{
        width: px(props.panelTheme?.width, '260px'),
        background: bg(),
        color: fg(),
        'border-right': `1px solid ${border()}`,
        display: 'flex',
        'flex-direction': 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '12px',
          'border-bottom': `1px solid ${border()}`,
          'font-weight': 600,
          'font-size': '13px',
        }}
      >
        Conversations
      </div>

      <div style={{ padding: '8px' }}>
        <button
          type="button"
          onClick={handleNewChat}
          style={{
            width: '100%',
            background: newBtnBg(),
            color: newBtnFg(),
            border: 'none',
            padding: '8px',
            'border-radius': '6px',
            'font-size': '12px',
            cursor: 'pointer',
          }}
        >
          + {newChatLabel()}
        </button>
      </div>

      <Show
        when={sessions().length > 0}
        fallback={
          <div style={{ padding: '24px', 'text-align': 'center', 'font-size': '12px', opacity: 0.7 }}>
            {emptyText()}
          </div>
        }
      >
        <div
          role="list"
          style={{ flex: 1, overflow: 'auto', padding: '0 4px' }}
        >
          <For each={sessions()}>
            {(s) => {
              const isActive = () => s.chatId === activeId();
              return (
                <div
                  role="listitem"
                  aria-current={isActive() ? 'true' : undefined}
                  onClick={() => handleSwitch(s.chatId)}
                  style={{
                    padding: '8px 10px',
                    'border-radius': '6px',
                    'margin-bottom': '2px',
                    cursor: 'pointer',
                    background: isActive() ? activeBg() : 'transparent',
                    color: isActive() ? activeFg() : fg(),
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive()) (e.currentTarget as HTMLDivElement).style.background = hoverBg();
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive()) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }}
                >
                  <div
                    style={{
                      'font-size': '12px',
                      'font-weight': 500,
                      overflow: 'hidden',
                      'text-overflow': 'ellipsis',
                      'white-space': 'nowrap',
                    }}
                  >
                    {s.title}
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </nav>
  );
};
```

- [ ] **Step 2: Wire `SessionPanel` into `ChatRoot`**

Update `src/components/sessions/ChatRoot.tsx`:

```tsx
import { Show, createMemo } from 'solid-js';
import { Bot, type BotProps } from '@/components/Bot';
import { SessionPanel } from './SessionPanel';
import { createSessionStore } from '@/state/sessionStore';
import { v4 as uuidv4 } from 'uuid';

type ChatRootProps = BotProps & { class?: string };

export const ChatRoot = (props: ChatRootProps) => {
  const enabled = () => props.multiSession?.enabled === true;

  const newChatId = () => {
    const customerId = (props.chatflowConfig as { vars?: { customerId?: string } } | undefined)
      ?.vars?.customerId;
    return customerId ? `${customerId.toString()}+${uuidv4()}` : uuidv4();
  };

  const store = createSessionStore({
    chatflowid: props.chatflowid,
    newChatId,
    maxSessions: props.multiSession?.maxSessions,
  });

  // Best-effort theme cascade — first usable theme wins (full > popup > bubble).
  const panelTheme = createMemo(() => {
    const anyProps = props as unknown as Record<string, any>;
    return (
      anyProps.theme?.chatWindow?.sessionPanel ??
      anyProps.chatWindow?.sessionPanel ??
      undefined
    );
  });

  return (
    <Show when={enabled()} fallback={<Bot {...props} />}>
      <div class="flex h-full w-full">
        <SessionPanel
          store={store}
          isFullPage={!!props.isFullPage}
          panelTheme={panelTheme()}
          chatWindowBackground={props.backgroundColor}
        />
        <div style={{ flex: 1, height: '100%' }}>
          <Bot {...props} />
        </div>
      </div>
    </Show>
  );
};
```

> **Note on `panelTheme` cascade:** The embed has historically read theme keys via several paths depending on mount mode. The accessor in this task is intentionally permissive — Task 28 (mode wiring) tightens this with the actual theme types from `BubbleTheme`/`FullTheme`/`PopupTheme`.

- [ ] **Step 3: Verify in the demo page**

Update `public/index.html` to enable multi-session on the demo embed. Find the existing `<flowise-fullchatbot>` or `chatflowid="..."` config and add `multiSession='{ "enabled": true }'` (consult the demo's existing prop-passing pattern).

Run: `npm run dev` (one terminal), `npm start` (another), open `http://localhost:3000`.

Expected:
- Sidebar appears on the left in full-page mode.
- One session in the list (titled "New chat").
- Clicking "+ New chat" prepends a new session and the active highlight moves to it.
- Hovering a non-active row tints it.

- [ ] **Step 4: Commit**

```bash
git add src/components/sessions/SessionPanel.tsx src/components/sessions/ChatRoot.tsx public/index.html
git commit -m "feat(sessions): render SessionPanel from ChatRoot with theme cascade"
```

---

### Task 12: Inline rename interaction on `SessionListItem`

The current `SessionPanel` inlines item rendering. Extract it into `SessionListItem` and add the rename interaction.

**Files:**
- Create: `src/components/sessions/SessionListItem.tsx`
- Modify: `src/components/sessions/SessionPanel.tsx`

- [ ] **Step 1: Create `SessionListItem.tsx`**

```tsx
// src/components/sessions/SessionListItem.tsx
import { Show, createSignal } from 'solid-js';
import type { SessionV2 } from '@/state/sessionStorage';

type Theme = {
  textColor: string;
  activeBackgroundColor: string;
  activeTextColor: string;
  hoverBackgroundColor: string;
};

type Props = {
  session: SessionV2;
  active: boolean;
  theme: Theme;
  onSwitch: () => void;
  onRename: (next: string) => void;
  onDelete: () => void;
};

export const SessionListItem = (props: Props) => {
  const [editing, setEditing] = createSignal(false);
  const [draft, setDraft] = createSignal(props.session.title);
  const [confirmingDelete, setConfirmingDelete] = createSignal(false);
  const [hovered, setHovered] = createSignal(false);

  const startEdit = (e: MouseEvent) => {
    e.stopPropagation();
    setDraft(props.session.title);
    setEditing(true);
  };
  const commit = () => {
    if (editing()) {
      props.onRename(draft());
      setEditing(false);
    }
  };
  const cancel = () => {
    setDraft(props.session.title);
    setEditing(false);
  };

  const onClick = () => {
    if (editing() || confirmingDelete()) return;
    props.onSwitch();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !editing() && !confirmingDelete()) {
      e.preventDefault();
      props.onSwitch();
    }
    if (e.key === 'Delete' && !editing()) {
      e.preventDefault();
      setConfirmingDelete(true);
    }
  };

  return (
    <div
      role="listitem"
      tabindex={0}
      aria-current={props.active ? 'true' : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px 10px',
        'border-radius': '6px',
        'margin-bottom': '2px',
        cursor: 'pointer',
        background: props.active
          ? props.theme.activeBackgroundColor
          : hovered()
          ? props.theme.hoverBackgroundColor
          : 'transparent',
        color: props.active ? props.theme.activeTextColor : props.theme.textColor,
        display: 'flex',
        'align-items': 'center',
        gap: '6px',
      }}
    >
      <Show
        when={!editing() && !confirmingDelete()}
        fallback={
          <Show
            when={editing()}
            fallback={
              // delete confirmation
              <div style={{ flex: 1, 'font-size': '12px', display: 'flex', 'align-items': 'center', gap: '6px' }}>
                <span>Delete?</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onDelete();
                    setConfirmingDelete(false);
                  }}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    padding: '2px 8px',
                    'border-radius': '3px',
                    'font-size': '11px',
                    cursor: 'pointer',
                  }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmingDelete(false);
                  }}
                  style={{
                    background: 'white',
                    border: '1px solid #cbd5e1',
                    padding: '2px 8px',
                    'border-radius': '3px',
                    'font-size': '11px',
                    cursor: 'pointer',
                  }}
                >
                  No
                </button>
              </div>
            }
          >
            <input
              type="text"
              value={draft()}
              onInput={(e) => setDraft(e.currentTarget.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') cancel();
              }}
              onBlur={cancel}
              ref={(el) => {
                if (el) {
                  setTimeout(() => {
                    el.focus();
                    el.select();
                  }, 0);
                }
              }}
              aria-label="Rename conversation"
              style={{
                flex: 1,
                border: '1px solid #f59e0b',
                background: 'white',
                color: '#111',
                padding: '3px 6px',
                'border-radius': '3px',
                'font-size': '12px',
              }}
            />
          </Show>
        }
      >
        <div
          style={{
            flex: 1,
            'min-width': 0,
            'font-size': '12px',
            'font-weight': 500,
            overflow: 'hidden',
            'text-overflow': 'ellipsis',
            'white-space': 'nowrap',
          }}
        >
          {props.session.title}
        </div>
        <Show when={hovered() || props.active}>
          <span
            role="button"
            tabindex={0}
            aria-label="Rename"
            onClick={startEdit}
            style={{
              'font-size': '13px',
              color: 'inherit',
              cursor: 'pointer',
              padding: '0 4px',
              opacity: 0.7,
            }}
          >
            ✎
          </span>
          <span
            role="button"
            tabindex={0}
            aria-label="Delete"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmingDelete(true);
            }}
            style={{
              'font-size': '13px',
              color: '#dc2626',
              cursor: 'pointer',
              padding: '0 4px',
              opacity: 0.7,
            }}
          >
            ×
          </span>
        </Show>
      </Show>
    </div>
  );
};
```

- [ ] **Step 2: Replace the inline item in `SessionPanel`**

In `src/components/sessions/SessionPanel.tsx`, swap the `<For>` body with the new component:

```tsx
import { SessionListItem } from './SessionListItem';
// ...
<For each={sessions()}>
  {(s) => (
    <SessionListItem
      session={s}
      active={s.chatId === activeId()}
      theme={{
        textColor: fg(),
        activeBackgroundColor: activeBg(),
        activeTextColor: activeFg(),
        hoverBackgroundColor: hoverBg(),
      }}
      onSwitch={() => handleSwitch(s.chatId)}
      onRename={(next) => props.store.actions.renameSession(s.chatId, next)}
      onDelete={() => props.store.actions.deleteSession(s.chatId)}
    />
  )}
</For>
```

- [ ] **Step 3: Manual verification**

Reload demo (`npm run dev` watch should auto-rebuild).

Recipe:
1. Hover over any session row → ✎ and × icons appear.
2. Click ✎ → row swaps to inline input pre-selected.
3. Type a new title, press **Enter** → row reverts with new title; check `localStorage[chatflowid_EXTERNAL]` in DevTools → that session's `title` matches.
4. Click ✎ again, press **Esc** → no change.
5. Click ✎ again, clear all text, press **Enter** → falls back (either to derived title from first user msg, or "New chat").
6. Click × → inline `Delete? [Yes] [No]` appears. Click **No** → reverts. Click **Yes** → row removed; if it was active, another session became active (or a fresh "New chat" was seeded).

- [ ] **Step 4: Commit**

```bash
git add src/components/sessions/SessionListItem.tsx src/components/sessions/SessionPanel.tsx
git commit -m "feat(sessions): inline rename and delete-confirm on session items"
```

---

### Task 13: Cap-warning toast

**Files:**
- Create: `src/components/sessions/CapWarningToast.tsx`
- Modify: `src/state/sessionStore.ts`
- Modify: `src/components/sessions/SessionPanel.tsx`

- [ ] **Step 1: Wire the cap-warning trigger in the store**

Add to the imports at the top of `src/state/sessionStore.ts`:

```ts
import { readCapWarned, writeCapWarned } from './sessionStorage';
```

Add a signal near the top of `createSessionStore`, after the existing `setActiveMessages` signal:

```ts
  const [capWarning, setCapWarning] = createSignal(false);
```

In `newChat`, **after** the eviction loop (after `evicted` array is fully populated, after the trailing `for` loop that removes evicted MsgKeys), insert:

```ts
    if (evicted.length > 0 && !readCapWarned(chatflowid)) {
      writeCapWarned(chatflowid);
      setCapWarning(true);
    }
```

Expose `capWarning` and a dismiss action on the store's return value. Modify the existing return object:

```ts
  return {
    chatflowid,
    maxSessions,
    sessions,
    activeChatId,
    activeSession,
    activeMessages,
    lead,
    capWarning,
    actions: {
      newChat,
      switchSession,
      upsertMessage,
      renameSession,
      deleteSession,
      setLead,
      flushPending,
      setQuotaPanicHandler,
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
```

- [ ] **Step 2: Create the toast component**

```tsx
// src/components/sessions/CapWarningToast.tsx
import { Show } from 'solid-js';

type Props = {
  visible: boolean;
  text: string;
  onDismiss: () => void;
};

export const CapWarningToast = (props: Props) => {
  return (
    <Show when={props.visible}>
      <div
        role="alert"
        style={{
          margin: '8px',
          padding: '10px',
          background: '#fef3c7',
          'border-left': '4px solid #f59e0b',
          'border-radius': '4px',
          'font-size': '12px',
          color: '#92400e',
        }}
      >
        <div>{props.text}</div>
        <div style={{ 'text-align': 'right', 'margin-top': '6px' }}>
          <button
            type="button"
            onClick={props.onDismiss}
            style={{
              background: 'none',
              border: '1px solid #92400e',
              color: '#92400e',
              padding: '3px 8px',
              'border-radius': '3px',
              'font-size': '11px',
              cursor: 'pointer',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </Show>
  );
};
```

- [ ] **Step 3: Render the toast inside `SessionPanel`**

Insert just below the "+ New chat" button area:

```tsx
import { CapWarningToast } from './CapWarningToast';
// ...
<CapWarningToast
  visible={props.store.capWarning()}
  text={
    props.panelTheme?.capWarningText ??
    'Conversation limit reached. Starting new ones will remove the oldest.'
  }
  onDismiss={() => props.store.actions.dismissCapWarning()}
/>
```

- [ ] **Step 4: Manual verification — fill to cap**

In DevTools console on the demo page, with multi-session enabled:

```js
// Read current chatflowid from any of the index keys; for the demo it's hardcoded.
const cf = '<chatflowid-from-demo>'; // copy from public/index.html

// Wipe and seed 49 fake sessions, plus active = 50
const sessions = [];
for (let i = 1; i <= 50; i++) {
  const id = 'fake-' + i;
  sessions.push({ chatId: id, title: 'Test ' + i, createdAt: i, updatedAt: i });
  localStorage.setItem(`${cf}_EXTERNAL_msgs_${id}`, '[]');
}
localStorage.setItem(
  `${cf}_EXTERNAL`,
  JSON.stringify({ version: 2, activeChatId: 'fake-50', sessions }),
);
localStorage.removeItem(`${cf}_EXTERNAL_capWarned`);
location.reload();
```

After reload, click "+ New chat". Expected: toast appears once with the cap text. Click "Got it" → dismisses. Click "+ New chat" again → no toast (one-time).

Cleanup:

```js
const idx = JSON.parse(localStorage.getItem(`${cf}_EXTERNAL`));
for (const s of idx.sessions) localStorage.removeItem(`${cf}_EXTERNAL_msgs_${s.chatId}`);
localStorage.removeItem(`${cf}_EXTERNAL`);
localStorage.removeItem(`${cf}_EXTERNAL_capWarned`);
```

- [ ] **Step 5: Commit**

```bash
git add src/state/sessionStore.ts src/components/sessions/CapWarningToast.tsx src/components/sessions/SessionPanel.tsx
git commit -m "feat(sessions): one-time cap-warning toast on first eviction"
```

---

## Phase 5: Mode-Specific Layouts

### Task 14: Sidebar collapse (full-page only)

**Files:**
- Modify: `src/components/sessions/SessionPanel.tsx`
- Use existing: `src/state/sessionStorage.ts` `readPanelCollapsed` / `writePanelCollapsed`

- [ ] **Step 1: Add collapse state and toggle to `SessionPanel`**

At the top of the component:

```tsx
import { readPanelCollapsed, writePanelCollapsed } from '@/state/sessionStorage';
// ...
const [collapsed, setCollapsed] = createSignal(
  props.isFullPage ? readPanelCollapsed(props.store.chatflowid) : false,
);
const toggleCollapsed = () => {
  if (!props.isFullPage) return;
  const next = !collapsed();
  setCollapsed(next);
  writePanelCollapsed(props.store.chatflowid, next);
};
```

Add the caret to the header:

```tsx
<div
  style={{
    padding: '12px',
    'border-bottom': `1px solid ${border()}`,
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'space-between',
    'font-weight': 600,
    'font-size': '13px',
  }}
>
  <Show when={!collapsed()}>
    <span>Conversations</span>
  </Show>
  <Show when={props.isFullPage}>
    <button
      type="button"
      onClick={toggleCollapsed}
      aria-label={collapsed() ? 'Expand conversations panel' : 'Collapse conversations panel'}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        'font-size': '14px',
        color: 'inherit',
      }}
    >
      {collapsed() ? '☰' : '⟨'}
    </button>
  </Show>
</div>
```

Update the outer `<nav>` width:

```tsx
style={{
  width: collapsed()
    ? px(props.panelTheme?.collapsedWidth, '44px')
    : px(props.panelTheme?.width, '260px'),
  // ...rest unchanged
  transition: 'width 150ms ease',
}}
```

Hide list, new-chat button, and toast contents when collapsed:

```tsx
<Show when={!collapsed()}>
  {/* existing new-chat button + toast + list block */}
</Show>
```

- [ ] **Step 2: Manual verification**

On the full-page demo:
1. Click `⟨` in the panel header → panel narrows to 44px showing only `☰`.
2. Click `☰` → panel expands.
3. Reload page → panel state persists.

Bubble/popup mode: caret is not rendered (only `isFullPage` triggers it).

- [ ] **Step 3: Commit**

```bash
git add src/components/sessions/SessionPanel.tsx
git commit -m "feat(sessions): collapsible sidebar with persisted state in full-page mode"
```

---

### Task 15: Drawer mode (bubble/popup)

**Files:**
- Modify: `src/components/sessions/SessionPanel.tsx`
- Modify: `src/components/sessions/ChatRoot.tsx`

- [ ] **Step 1: Add drawer behavior to `SessionPanel`**

Add a new prop `isDrawer: boolean` and a `drawerOpen()/setDrawerOpen()` signal owned by `ChatRoot` (so the bubble header toggle can flip it). Update `Props`:

```ts
type Props = {
  store: SessionStore;
  isFullPage: boolean;
  isDrawer: boolean;
  drawerOpen?: () => boolean;
  onDrawerClose?: () => void;
  panelTheme?: SessionPanelTheme;
  chatWindowBackground?: string;
  chatWindowText?: string;
};
```

Wrap the `<nav>` in a drawer container when `isDrawer`:

```tsx
<Show
  when={!props.isDrawer}
  fallback={
    <Show when={props.drawerOpen?.() ?? false}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.25)',
          'z-index': 5,
        }}
        onClick={() => props.onDrawerClose?.()}
        aria-hidden="true"
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '75%',
          'z-index': 6,
          background: bg(),
          'box-shadow': '2px 0 8px rgba(0,0,0,0.2)',
        }}
      >
        {/* existing nav contents */}
      </div>
    </Show>
  }
>
  <nav>{/* existing nav contents */}</nav>
</Show>
```

In drawer mode, switching a session should auto-close the drawer. Update `handleSwitch`:

```tsx
const handleSwitch = (id: string) => {
  props.store.actions.switchSession(id);
  if (props.isDrawer) props.onDrawerClose?.();
};
```

- [ ] **Step 2: Add drawer state in `ChatRoot`**

```tsx
import { Show, createMemo, createSignal } from 'solid-js';
// ...
const [drawerOpen, setDrawerOpen] = createSignal(false);
const isDrawer = !props.isFullPage;
// ...
<SessionPanel
  store={store}
  isFullPage={!!props.isFullPage}
  isDrawer={isDrawer}
  drawerOpen={drawerOpen}
  onDrawerClose={() => setDrawerOpen(false)}
  panelTheme={panelTheme()}
  chatWindowBackground={props.backgroundColor}
/>
```

For the toggle, expose a custom event listener that the existing `Bot.tsx` header `☰` button (added in next task) will dispatch:

```tsx
import { onMount, onCleanup } from 'solid-js';
// ...
onMount(() => {
  const open = () => setDrawerOpen(true);
  const close = () => setDrawerOpen(false);
  window.addEventListener('flowise-toggle-session-drawer', () => setDrawerOpen((v) => !v));
  onCleanup(() => {
    window.removeEventListener('flowise-toggle-session-drawer', () => {});
  });
});
```

> **Note:** Removing event listeners with anonymous functions doesn't actually unbind. Replace with a hoisted handler:
>
> ```ts
> const onToggle = () => setDrawerOpen((v) => !v);
> onMount(() => window.addEventListener('flowise-toggle-session-drawer', onToggle));
> onCleanup(() => window.removeEventListener('flowise-toggle-session-drawer', onToggle));
> ```

- [ ] **Step 3: Add `☰` button to bubble/popup chat header**

In `Bot.tsx`, find the chat header render block (search for `props.title` near header rendering). Add a leading button when `props.multiSession?.enabled === true && !props.isFullPage`:

```tsx
<Show when={props.multiSession?.enabled && !props.isFullPage}>
  <button
    type="button"
    aria-label="Open conversations"
    onClick={() => window.dispatchEvent(new CustomEvent('flowise-toggle-session-drawer'))}
    style={{
      background: 'transparent',
      border: 'none',
      color: 'inherit',
      'font-size': '16px',
      cursor: 'pointer',
      padding: '0 4px',
    }}
  >
    ☰
  </button>
</Show>
```

> **Note:** Exact placement and styling depend on the existing header layout in `Bot.tsx`. Match the existing header's spacing and color tokens.

- [ ] **Step 4: Manual verification (bubble mode)**

In the demo page, switch the embed to bubble mode (or open the demo's bubble harness if available). Open the bubble. Expected:
1. `☰` shown in the header.
2. Click `☰` → drawer slides in from the left over a dimmed backdrop, taking ~75% of the bubble width.
3. Click a session row → drawer closes, that session loads.
4. Open drawer, click backdrop → drawer closes, active session unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/components/sessions/SessionPanel.tsx src/components/sessions/ChatRoot.tsx src/components/Bot.tsx
git commit -m "feat(sessions): drawer mode for bubble/popup with header toggle"
```

---

## Phase 6: Bot.tsx Integration

The store now drives the panel. Bot.tsx still reads/writes its own internal `chatId` and `messages` signals. This phase rewires Bot.tsx to be a consumer of the store.

### Task 16: Bot.tsx — read active session from store via context

**Files:**
- Modify: `src/components/Bot.tsx`
- Modify: `src/components/sessions/ChatRoot.tsx`

- [ ] **Step 1: Create a context to pass the store down without prop drilling**

Add to `src/components/sessions/ChatRoot.tsx`:

```tsx
import { createContext, useContext } from 'solid-js';
import type { SessionStore } from '@/state/sessionStore';

const SessionContext = createContext<SessionStore | undefined>();

export const useSessionStore = (): SessionStore | undefined => useContext(SessionContext);
```

Wrap children in the provider when enabled:

```tsx
<Show when={enabled()} fallback={<Bot {...props} />}>
  <SessionContext.Provider value={store}>
    <div class="flex h-full w-full">
      <SessionPanel {...} />
      <div style={{ flex: 1, height: '100%' }}>
        <Bot {...props} />
      </div>
    </div>
  </SessionContext.Provider>
</Show>
```

- [ ] **Step 2: Replace `chatId` and `messages` signals in Bot.tsx with store-derived ones**

Near the top of the `Bot` function in `src/components/Bot.tsx`:

```tsx
import { useSessionStore } from './sessions/ChatRoot';
// ...
const sessionStore = useSessionStore();
```

Replace:

```ts
const [chatId, setChatId] = createSignal(...);
const [messages, setMessages] = createSignal<MessageType[]>([...]);
```

with:

```ts
const [fallbackChatId, setFallbackChatId] = createSignal('');
const [fallbackMessages, setFallbackMessages] = createSignal<MessageType[]>([]);

const chatId = () => sessionStore?.activeChatId() ?? fallbackChatId();
const setChatId = (next: string) => {
  // When the store is in charge, switching chatId from inside Bot is a no-op
  // (the store owns the active id). Without a store, fall back to the legacy signal.
  if (sessionStore) return;
  setFallbackChatId(next);
};
const messages = () => sessionStore?.activeMessages() ?? fallbackMessages();
const setMessages = (next: MessageType[] | ((prev: MessageType[]) => MessageType[])) => {
  if (sessionStore) return; // see Task 17 for the new write path
  setFallbackMessages((prev) => (typeof next === 'function' ? next(prev) : next));
};
```

> **Note on scope:** This Bot.tsx refactor is the largest single change in the plan. Read the existing `chatId()`, `setChatId(...)`, `messages()`, and `setMessages(...)` call sites carefully — there are dozens. After this step, every existing call still type-checks and runs, but writes routed through `setMessages` go nowhere when a store is present. Task 17 wires the new write path so behavior is preserved.

- [ ] **Step 3: Init chatId for the no-store path**

In the existing `onMount` block, where the legacy code calls `setChatId(...)`, guard it:

```ts
if (!sessionStore) {
  const customerId = (props.chatflowConfig as any)?.vars?.customerId;
  setFallbackChatId(customerId ? `${customerId}+${uuidv4()}` : uuidv4());
}
```

When `sessionStore` is present, `chatId()` already returns the active session's id, so no init is needed.

- [ ] **Step 4: Verify build and demo**

Run: `npm run build`
Expected: passes.

Manual: open demo with `multiSession.enabled = true`. Expected:
- Sidebar shows current session.
- Existing chat features still render (input, send button, history rendering for the active session).
- **New messages don't persist yet** — that's fixed in Task 17. Sending a message will display it during the session, but on reload it disappears.

- [ ] **Step 5: Commit**

```bash
git add src/components/Bot.tsx src/components/sessions/ChatRoot.tsx
git commit -m "refactor(bot): read active session from sessionStore via context"
```

---

### Task 17: Bot.tsx — route message writes through the store

**Files:**
- Modify: `src/components/Bot.tsx`

- [ ] **Step 1: Replace direct `setMessages(append)` patterns with store calls**

In `Bot.tsx`, find every place where `setMessages(...)` is called to *append* or *update* a message. Common patterns to look for:

- `setMessages([...messages(), { type: 'userMessage', message: ... }])`
- `setMessages((prev) => [...prev, newMsg])`
- Streaming updates that mutate the last `apiMessage`.

Wrap each with a store-aware variant. Helper to add at the top of the `Bot` function body:

```ts
const upsertMessage = (msg: MessageType) => {
  if (sessionStore) {
    sessionStore.actions.upsertMessage(msg);
  } else {
    setFallbackMessages((prev) => {
      if (msg.messageId !== undefined) {
        const idx = prev.findIndex((m) => m.messageId === msg.messageId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = msg;
          return next;
        }
      }
      return [...prev, msg];
    });
  }
};
```

Replace append/streaming sites accordingly. For example, where the streaming update currently does:

```ts
setMessages((prev) => {
  const next = [...prev];
  next[next.length - 1] = { ...next[next.length - 1], message: streamed };
  return next;
});
```

Refactor to ensure the streaming `apiMessage` has a stable `messageId`, then route through `upsertMessage` so the store's id-based replace path takes effect. If the existing streaming code doesn't generate a `messageId` until completion, generate one client-side at stream start (`const streamingId = uuidv4()` and re-use it).

- [ ] **Step 2: Remove direct `setLocalStorageChatflow` calls for chatHistory**

Search for `setLocalStorageChatflow(.*chatHistory` usages in `Bot.tsx`. With the store wired, those writes are redundant (the store persists). Replace with a no-op when `sessionStore` is present:

```ts
if (!sessionStore) {
  setLocalStorageChatflow(props.chatflowid, chatId(), { chatHistory: messages() });
}
```

Leave `lead` and other field-merge writes alone — the wrapper from Task 9 handles them correctly.

- [ ] **Step 3: Flush pending writes on `pagehide` and `beforeunload`**

Inside `onMount`:

```ts
if (sessionStore) {
  const flush = () => sessionStore.actions.flushPending();
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  onCleanup(() => {
    window.removeEventListener('pagehide', flush);
    window.removeEventListener('beforeunload', flush);
  });
}
```

- [ ] **Step 4: Manual verification**

On the demo with multi-session enabled:
1. Send a message → reply streams in normally.
2. Reload the page → message and reply persist; correct session is still active.
3. Open a new session, send a message → switching back to the first session shows the original history.

If reload loses messages, confirm that `localStorage[chatflowid_EXTERNAL_msgs_<chatId>]` contains the messages array. If empty, the persist path isn't firing — re-check `upsertMessage` call sites.

- [ ] **Step 5: Commit**

```bash
git add src/components/Bot.tsx
git commit -m "refactor(bot): route message writes through sessionStore"
```

---

### Task 18: Stream abort on session switch

**Files:**
- Modify: `src/components/Bot.tsx`

The store can't directly abort streams (it doesn't know about the fetch). Bot.tsx exposes the abort capability; the store invokes it when active changes.

- [ ] **Step 1: Watch for `activeChatId` changes in Bot.tsx and abort if streaming**

In `Bot.tsx`, find the existing streaming controller (likely a `let abortController: AbortController` or similar). Add a Solid `createEffect`:

```tsx
import { createEffect, on } from 'solid-js';
// ...
if (sessionStore) {
  let lastSeenChatId = sessionStore.activeChatId();
  createEffect(
    on(
      () => sessionStore.activeChatId(),
      (current) => {
        if (current === lastSeenChatId) return;
        // Try to abort an in-flight stream for the previous chatId.
        try {
          // Adapt to the existing abort path. Common patterns:
          if (typeof (Bot as any).abortInFlight === 'function') {
            (Bot as any).abortInFlight(); // placeholder if there's a method
          }
          // Or: hit the abort endpoint directly with the old id.
          fetch(
            `${props.apiHost ?? ''}/api/v1/chatmessage/abort/${props.chatflowid}/${lastSeenChatId}`,
            { method: 'PUT' },
          ).catch(() => {});
        } catch {
          // best-effort
        }
        lastSeenChatId = current;
      },
    ),
  );
}
```

> **Note:** The exact abort wiring depends on how the existing streaming code is structured. The intent: on session switch, fire-and-forget abort for the *previous* `chatId`. If there's already a per-request `AbortController` accessible at this scope, prefer calling `.abort()` on it instead of an HTTP call.

- [ ] **Step 2: Manual verification**

1. Send a long message that will produce a long streaming reply.
2. Mid-stream, click "+ New chat" or switch to another session.
3. Expected: stream stops appearing in the new session; backend abort is called (verify in Network tab).
4. Switch back to the original session → its last message ends mid-token (or just-completed if the abort raced with completion). Both outcomes acceptable per spec.

- [ ] **Step 3: Commit**

```bash
git add src/components/Bot.tsx
git commit -m "feat(sessions): best-effort stream abort on session switch"
```

---

## Phase 7: Events & Cross-Tab

### Task 19: Custom events — new-session, switch-session, session-changed, repurposed clear-chat

**Files:**
- Modify: `src/components/Bot.tsx`
- Modify: `src/components/sessions/ChatRoot.tsx`
- Modify: `src/state/sessionStore.ts`

- [ ] **Step 1: Emit `flowise-session-changed` on store switch and rename**

In `src/state/sessionStore.ts`, expose a callback hook:

```ts
let onSessionChanged: ((detail: { chatId: string; title: string }) => void) | null = null;
const setOnSessionChanged = (cb: typeof onSessionChanged) => {
  onSessionChanged = cb;
};
```

Inside `switchSession` and `renameSession`, after `_persistIndex`:

```ts
if (onSessionChanged) {
  const s = activeSession();
  if (s) onSessionChanged({ chatId: s.chatId, title: s.title });
}
```

Inside `newChat` after the new session is set active, also call.

Expose `setOnSessionChanged` in the store's `actions`.

- [ ] **Step 2: Wire events at the `ChatRoot` level**

In `src/components/sessions/ChatRoot.tsx` `onMount`:

```ts
import { onMount, onCleanup } from 'solid-js';
// ...
const onNew = () => store.actions.newChat();
const onSwitch = (e: Event) => {
  const detail = (e as CustomEvent<{ chatId: string }>).detail;
  if (detail?.chatId) store.actions.switchSession(detail.chatId);
};
const onClear = () => {
  // Repurpose clear-chat under multi-session: delete active, seed new.
  store.actions.deleteSession(store.activeChatId());
};
const onToggle = () => setDrawerOpen((v) => !v);

store.actions.setOnSessionChanged((detail) => {
  window.dispatchEvent(new CustomEvent('flowise-session-changed', { detail }));
});

onMount(() => {
  window.addEventListener('flowise-new-session', onNew);
  window.addEventListener('flowise-switch-session', onSwitch);
  window.addEventListener('flowise-clear-chat', onClear);
  window.addEventListener('flowise-toggle-session-drawer', onToggle);
});
onCleanup(() => {
  window.removeEventListener('flowise-new-session', onNew);
  window.removeEventListener('flowise-switch-session', onSwitch);
  window.removeEventListener('flowise-clear-chat', onClear);
  window.removeEventListener('flowise-toggle-session-drawer', onToggle);
});
```

- [ ] **Step 3: Suppress legacy `flowise-clear-chat` handling in Bot.tsx when store is active**

In `Bot.tsx`, the existing `flowise-clear-chat` listener wipes the single thread. Guard it:

```ts
if (!sessionStore) {
  // existing flowise-clear-chat listener stays
}
```

- [ ] **Step 4: Manual verification**

In DevTools console on the demo:

```js
// Listen
window.addEventListener('flowise-session-changed', (e) => console.log('changed', e.detail));

// Programmatic new
window.dispatchEvent(new Event('flowise-new-session'));
// → expect: panel adds new session, console logs new chatId

// Programmatic switch (use any chatId from the panel)
window.dispatchEvent(new CustomEvent('flowise-switch-session', { detail: { chatId: 'fake-1' } }));
// → expect: switch (or no-op if id doesn't exist)

// Programmatic clear
window.dispatchEvent(new Event('flowise-clear-chat'));
// → expect: active session deleted, fresh session seeded
```

- [ ] **Step 5: Commit**

```bash
git add src/state/sessionStore.ts src/components/sessions/ChatRoot.tsx src/components/Bot.tsx
git commit -m "feat(sessions): custom events for new/switch/changed and repurpose clear-chat"
```

---

### Task 20: Cross-tab `storage` event listener

**Files:**
- Modify: `src/state/sessionStore.ts`

- [ ] **Step 1: Listen for cross-tab Index changes**

In `createSessionStore`, after the initial setIndex, set up a listener:

```ts
const indexLsKey = `${chatflowid}_EXTERNAL`;
const onStorage = (e: StorageEvent) => {
  if (e.key !== indexLsKey || e.newValue === null) return;
  try {
    const parsed = JSON.parse(e.newValue);
    if (parsed && parsed.version === 2) {
      const next = parsed as ChatflowIndexV2;
      setIndex(next);
      // Also re-read active session's messages if active changed underneath.
      if (next.activeChatId !== activeChatId()) {
        const msgs = readMessages(chatflowid, next.activeChatId);
        messageCache.set(next.activeChatId, msgs);
        setActiveMessages(msgs);
      }
    }
  } catch {
    // ignore — corrupt cross-tab write
  }
};
if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);

const dispose = () => {
  if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
};
```

Expose `dispose` on the store return so callers can clean up if needed.

- [ ] **Step 2: Manual verification**

1. Open demo in tab A. Open the same URL in tab B.
2. In tab A: click "+ New chat". The new session appears in tab A's sidebar.
3. Switch to tab B without reloading. Expected: tab B's sidebar updates to reflect the new session list within ~1 second of focus.
4. Rename a session in tab A. Expected: tab B's row title updates.

- [ ] **Step 3: Commit**

```bash
git add src/state/sessionStore.ts
git commit -m "feat(sessions): cross-tab sync via storage event"
```

---

## Phase 8: Wire Modes, Polish, Documentation

### Task 21: Wire `<ChatRoot>` into Bubble, Full, and Popup

**Files:**
- Modify: `src/features/bubble/components/Bubble.tsx`
- Modify: `src/features/full/components/Full.tsx`
- Modify: `src/features/popup/components/Popup.tsx`

- [ ] **Step 1: Replace each `<Bot ... />` render with `<ChatRoot ... />`**

In each of the three feature components, swap `<Bot {...props} />` for `<ChatRoot {...props} />`. Ensure `multiSession` and the relevant theme keys are part of the props shape that the embed accepts (in most cases this is implicit because they spread `BotProps`).

- [ ] **Step 2: Pass theme.chatWindow.sessionPanel through**

For each mode, where it constructs the `BotProps` from theme config, ensure `sessionPanel` is forwarded. Typically this looks like:

```tsx
<ChatRoot
  {...botProps}
  theme={theme} /* if not already spread; needed by ChatRoot's panelTheme cascade */
/>
```

If the existing code maps `theme.chatWindow.*` flat onto `BotProps`, do the same for `sessionPanel`:

```tsx
sessionPanel: theme.chatWindow.sessionPanel,
```

(Adjust to match the existing pattern in each feature module.)

- [ ] **Step 3: Manual verification — three modes**

1. Demo in **full-page** mode with `multiSession.enabled = true` → sidebar visible, collapsible.
2. Demo in **bubble** mode → bubble button → click open → `☰` in header → drawer mode works.
3. Demo in **popup** mode → drawer mode works (same code path as bubble).

- [ ] **Step 4: Commit**

```bash
git add src/features/bubble/components/Bubble.tsx src/features/full/components/Full.tsx src/features/popup/components/Popup.tsx
git commit -m "feat(sessions): wire ChatRoot into bubble, full, and popup modes"
```

---

### Task 22: Accessibility polish — focus traps, keyboard nav

**Files:**
- Modify: `src/components/sessions/SessionPanel.tsx`
- Modify: `src/components/sessions/SessionListItem.tsx`

- [ ] **Step 1: Trap focus inside drawer when open (bubble/popup only)**

In `SessionPanel.tsx`, when `isDrawer && drawerOpen()`, add an `onMount` that focuses the first focusable element (the "+ New chat" button) and an Escape listener that closes:

```tsx
import { onMount, onCleanup } from 'solid-js';
// ...
let drawerRoot: HTMLDivElement | undefined;
const onKey = (e: KeyboardEvent) => {
  if (!props.isDrawer || !(props.drawerOpen?.() ?? false)) return;
  if (e.key === 'Escape') props.onDrawerClose?.();
};
onMount(() => {
  document.addEventListener('keydown', onKey);
  if (props.isDrawer && props.drawerOpen?.() && drawerRoot) {
    const first = drawerRoot.querySelector<HTMLElement>('button, [tabindex="0"]');
    first?.focus();
  }
});
onCleanup(() => document.removeEventListener('keydown', onKey));
```

Bind `ref={drawerRoot}` on the drawer container.

- [ ] **Step 2: Up/Down arrow navigation in the list**

In `SessionPanel.tsx`, add a keydown handler on the `<div role="list">`:

```tsx
const onListKey = (e: KeyboardEvent) => {
  const items = (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="listitem"]');
  if (items.length === 0) return;
  const focused = document.activeElement as HTMLElement | null;
  let idx = -1;
  items.forEach((el, i) => {
    if (el === focused) idx = i;
  });
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    items[Math.min(items.length - 1, Math.max(idx + 1, 0))].focus();
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    items[Math.max(0, idx - 1)].focus();
  }
};
// on the <div role="list">: onKeyDown={onListKey}
```

- [ ] **Step 3: Manual verification**

1. Tab into the panel → "+ New chat" focused.
2. Tab to the list → first item focused (visible focus ring).
3. Arrow Down → next item; Arrow Up → previous.
4. Enter on a focused item → switches to that session.
5. Delete on a focused item → inline delete confirm appears.
6. In bubble drawer, Escape → drawer closes.

- [ ] **Step 4: Commit**

```bash
git add src/components/sessions/SessionPanel.tsx src/components/sessions/SessionListItem.tsx
git commit -m "feat(sessions): keyboard nav, focus trap, and Escape-to-close"
```

---

### Task 23: Manual test pass + Flowise companion checklist documentation

**Files:**
- Create: `docs/superpowers/manual-test-plans/2026-04-29-multi-session-chat.md`
- Modify: `docs/superpowers/specs/2026-04-29-multi-session-chat-design.md` (mark items checked)

- [ ] **Step 1: Run the full manual test matrix**

Execute every recipe from spec Section 8 against `npm run dev` + `npm start`:

- [ ] First load with no localStorage → fresh empty session, panel shows it.
- [ ] First load with v1 localStorage → migration runs, session #1 has the historical messages and a derived title (or "Previous chat" if v1 history was empty).
- [ ] New chat → switch → rename → delete (in all three UI modes).
- [ ] Streaming-mid-switch → original session ends with truncated reply, abort fires (verified in Network tab).
- [ ] Cap eviction at 51 sessions → toast appears once, oldest evicted; subsequent evictions silent.
- [ ] Cross-tab: rename in tab A, watch tab B update on focus.
- [ ] Quota exhaustion: stuff localStorage with a large message; verify emergency eviction triggers and toast shows.
- [ ] Theme custom keys (set `sessionPanel.backgroundColor` etc.) are respected; unset keys cascade from `chatWindow`.
- [ ] Keyboard navigation: Tab → arrow keys → Enter → Delete → Escape (drawer).
- [ ] `multiSession.enabled = false` → embed renders identically to pre-feature; existing single-thread behavior preserved.

- [ ] **Step 2: Document the manual test plan**

```markdown
# Multi-Session Chat — Manual Test Plan (2026-04-29)

This is the verification log for the multi-session feature. Run before merging the implementation PR.

## Environment
- `npm run dev` (Rollup watch)
- `npm start` (Express server on :3000 by default)
- Demo at `public/index.html` with `multiSession='{ "enabled": true }'`

## Matrix
[Copy the Step 1 checklist here, each item with a "Pass / Fail / Notes" column.]

## Sign-off
- Author: ______
- Reviewer: ______
- Date: ______
```

- [ ] **Step 3: Update spec to reflect implementation done**

In the design spec, change `**Status:** Design (pre-implementation)` to `**Status:** Implemented (manual test plan: docs/superpowers/manual-test-plans/2026-04-29-multi-session-chat.md)`.

- [ ] **Step 4: Open follow-up issues for the Flowise companion**

Per spec Section 9, the parent Flowise repo needs:
1. Set `multiSession.enabled = true` in the admin UI's preview embed.
2. Verify chatflowid stability across preview reloads.
3. (Future spec) Expose "Enable session history" toggle in chatflow settings.

Open one issue per item against the Flowise repo, linking back to this spec. Document the issue numbers in `docs/superpowers/specs/2026-04-29-multi-session-chat-design.md` Section 9 as a follow-up paragraph.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/manual-test-plans docs/superpowers/specs/2026-04-29-multi-session-chat-design.md
git commit -m "docs(sessions): manual test plan + Flowise companion follow-up issues"
```

---

## Self-Review Checklist (run by the implementer at end)

After all tasks land, verify:

1. **Spec coverage:** every numbered Decision in spec Section 2 has a corresponding implementation task. Specifically:
   - Decision 7 (Solid store) → Tasks 5, 6
   - Decision 8 (split storage) → Tasks 2, 3
   - Decision 9 (cap + warning) → Tasks 6, 13
   - Decision 10 (stream abort) → Task 18
   - Decision 11 (cross-tab) → Task 20
   - Decision 12 (clear-chat repurpose) → Task 19
2. **No `setLocalStorageChatflow({ chatHistory })` in production code paths** — search the diff. Any remaining are bugs.
3. **All custom events are documented in the spec.** Check Section 5 of the spec lists exactly the four events Task 19 wires.
4. **`multiSession.enabled = false` path is functional** — manually verify the embed works as it did before this feature when the flag is off. Specifically: `flowise-clear-chat` still wipes the single thread; localStorage shape stays v1 for legacy; no panel renders.
