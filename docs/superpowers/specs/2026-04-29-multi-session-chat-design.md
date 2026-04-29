# Multi-Session Chat — Design

**Status:** Design (pre-implementation)
**Date:** 2026-04-29
**Repo:** FlowiseChatEmbed (with thin Flowise-core companion section)

---

## 1. Summary

Add a ChatGPT-style multi-session experience to the FlowiseChatEmbed widget: one embedded chatbot can host a list of independent conversations, each with its own message history. Users can create new chats, switch between them, rename, and delete. Storage is device-local (`localStorage`); no backend changes are required for v1.

The feature ships **opt-in** in the embed (a `BotProps.multiSession.enabled` flag) and **default-on** in Flowise core's chat preview surfaces, so chatflow and agentflow builders get it automatically.

---

## 2. Scope Decisions

These were decided during brainstorming and are the load-bearing assumptions for the rest of the design.

| #   | Decision                                                                                                                                                                                                       | Rationale                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Device-local storage only (Option A).** No server-side session list, no cross-device sync.                                                                                                                   | Smallest blast radius; no Flowise backend changes; no identity primitive required. Cross-device is future work.                                                                   |
| 2   | **One responsive panel (Option B).** Same `SessionPanel` component renders as a left sidebar in full-page mode and as a slide-in drawer in bubble/popup.                                                       | One UI pattern, one mental model, one code path. CSS adapts.                                                                                                                      |
| 3   | **Polished v1 feature set (Option B).** New chat · switch · delete · sort by recency · auto-title from truncated first user message · manual rename. **No** search, pinning, archive, or LLM-generated titles. | Auto-title alone leaves users wanting rename; LLM titles + search require backend work that conflicts with Decision 1.                                                            |
| 4   | **Opt-in for the embed; default-on for Flowise core (Option C).** Embedders flip a flag; Flowise's own admin previews enable it by default.                                                                    | Doesn't disrupt customer sites; lets Flowise dogfood the feature.                                                                                                                 |
| 5   | **In-place migration (Option A).** Existing `${chatflowid}_EXTERNAL` thread becomes session #1 on first read of the new code.                                                                                  | Idempotent, invisible to end-users, zero data loss.                                                                                                                               |
| 6   | **Spec scope = embed end-to-end + thin Flowise companion section (Option B).** Implementation lives in this repo; a checklist of Flowise-side touchpoints is included but not designed in detail.              | Engineering complexity is in the embed; Flowise-side work is mostly configuration.                                                                                                |
| 7   | **Architecture: Solid store + reactive Bot (Approach 2).** A new `sessionStore` is the source of truth; both `SessionPanel` and `Bot.tsx` subscribe.                                                           | Avoids the remount-and-refetch cost of a wrapper-keyed approach; rename/delete/migration logic lives naturally in the store.                                                      |
| 8   | **Storage shape: split index from per-session message bodies.** Index in `${chatflowid}_EXTERNAL`; messages in `${chatflowid}_EXTERNAL_msgs_${chatId}`.                                                        | Append-during-streaming touches only the active session's blob, not the whole list. Total bytes are unchanged; per-write cost scales with the active session, not the whole list. |
| 9   | **Cap: 50 sessions per chatflowid; soft warn once, then FIFO eviction by `updatedAt`.**                                                                                                                        | Bounded localStorage cost; rare-but-graceful eviction; one-time toast keeps users informed.                                                                                       |
| 10  | **Stream-during-switch: cancel + switch (Option a).** Best-effort abort on the in-flight assistant message, then switch.                                                                                       | Predictable, small change. Background-continue is a polish item for later.                                                                                                        |
| 11  | **Cross-tab: last-write-wins with `storage`-event re-read.**                                                                                                                                                   | Realistic for v1. Real-time merge is future work.                                                                                                                                 |
| 12  | **`flowise-clear-chat` (existing event) repurposed when multi-session is on**: deletes the active session and starts a fresh one. With multi-session off, behavior is unchanged.                               | Preserves end-user expectation of "clear what I see."                                                                                                                             |
| 13  | **Test framework: defer (Option B).** v1 ships with manual testing + heavy code review; Vitest + Solid Testing Library is a follow-up.                                                                         | Avoid scope creep on infra. **Risk:** migration and store actions are exactly the code that benefits most from unit tests; reviewers and authors must compensate.                 |

---

## 3. Architecture & File Layout

A new Solid store is the single source of truth. The sidebar/drawer is a sibling component to `<Bot>`. `Bot.tsx` reads the active session from the store and routes writes through store actions; it no longer touches `localStorage` directly for chat state.

### Component tree

```
<ChatRoot>                 ← new shell; renders panel only when multiSession.enabled
  <SessionPanel/>          ← reads sessions, activeId; dispatches actions
  <Bot/>                   ← reads activeSession; derives messages from store
</ChatRoot>
```

When `multiSession.enabled === false`, `<ChatRoot>` is a no-op shell that renders `<Bot/>` directly. The store still exists internally but only ever holds one session, and no panel UI renders. This keeps `Bot.tsx` on a single code path regardless of the flag.

### New files

```
src/
  state/
    sessionStore.ts          // Solid store: signals, actions, persistence wiring
    sessionStorage.ts        // localStorage read/write with shape versioning + GC
    sessionMigration.ts      // v1 → v2 in-place migration
  components/
    sessions/
      SessionPanel.tsx       // Responsive panel (sidebar in full-page; drawer in bubble/popup)
      SessionListItem.tsx    // One row: title, recency, hover actions, inline rename, inline delete confirm
      NewChatButton.tsx      // "+ New chat" CTA
      SessionPanelToggle.tsx // Hamburger / collapse caret (mode-aware)
      ChatRoot.tsx           // Shell that conditionally renders panel + Bot
  utils/
    titleFromMessage.ts      // First-user-message truncation; fallback "New chat"
```

### Modified files

- **`src/components/Bot.tsx`** — replace internal `chatId()` and `messages()` signals with store-derived ones; replace direct `getLocalStorageChatflow` / `setLocalStorageChatflow` calls in mount/append paths with store actions. Mount-time fetches (`/public-chatbotConfig`, `/chatflows-streaming`) run once for the chatflow, not per session switch.
- **`src/types.ts`** — add `MultiSessionConfig` to `BotProps`.
- **`src/features/bubble/types.ts`** (and full/popup equivalents) — extend `chatWindow` theme with `sessionPanel` keys.
- **`src/utils/index.ts`** — keep `getLocalStorageChatflow` / `setLocalStorageChatflow` as backwards-compat wrappers that delegate to the new storage module so non-session consumers (notably `lead`) keep working. The wrapper performs **field-level merge** on the Index — e.g., `setLocalStorageChatflow({ lead })` updates only the top-level `lead` and leaves `version` / `activeChatId` / `sessions` untouched. Reads return a v1-shaped projection (`{ chatId, chatHistory, lead }`) derived from the active session, so any third-party caller using the old API keeps seeing what it expects.
- **`src/features/bubble/components/Bubble.tsx`**, **`src/features/full/components/Full.tsx`**, **`src/features/popup/components/Popup.tsx`** — render `<ChatRoot>` instead of `<Bot>` directly.

---

## 4. Data Model & Migration

### v2 storage shape

```ts
type SessionV2 = {
  chatId: string;       // same uuid pattern; preserves "${customerId}+${uuid}" if customerId set
  title: string;        // auto-derived from first user message; user-editable; "New chat" sentinel
  createdAt: number;    // ms epoch
  updatedAt: number;    // ms epoch; bumped on each new message; drives sort order
};

type ChatflowIndexV2 = {
  version: 2;
  activeChatId: string;
  sessions: SessionV2[]; // NO messages here — kept thin
  lead?: LeadCaptureData; // preserved at top level (current behavior)
};

// Index — small, fast (~80 bytes per session)
localStorage[`${chatflowid}_EXTERNAL`] = ChatflowIndexV2;

// Messages — one key per session
localStorage[`${chatflowid}_EXTERNAL_msgs_${chatId}`] = MessageType[];
```

`MessageType` and `LeadCaptureData` keep their current shapes — message format is untouched.

### v1 → v2 migration

```
read localStorage[`${chatflowid}_EXTERNAL`]
  ↓
no entry?           → fresh v2: { version: 2, activeChatId: newUuid,
                                  sessions: [emptySession], lead: undefined }
                       write Index + empty MsgKey
has `version: 2`?   → return as-is (idempotent)
has `chatId` + `chatHistory` (v1)?
  → wrap into v2:
      session = { chatId, title: titleFrom(chatHistory) ?? "Previous chat",
                  createdAt: Date.now(), updatedAt: Date.now() }
      Index = { version: 2, activeChatId: chatId, sessions: [session], lead: existing.lead }
      write Index
      write MsgKey(chatId) = chatHistory
neither shape?      → log warning; treat as no entry; DO NOT clobber
```

Migration is idempotent. Re-reading a v2 entry returns it unchanged.

### Title derivation (`titleFromMessage`)

Signature: `(messages: MessageType[]) => string | null`.

- Take first message with `type === 'userMessage'`.
- Strip markdown control characters; collapse whitespace; trim.
- Truncate to 40 characters; append `…` if cut.
- **Returns `null`** if no `userMessage` is found (the caller decides the fallback string).

Callers and their fallbacks:

- **Migration** uses `titleFromMessage(chatHistory) ?? "Previous chat"`.
- **New chat** flow doesn't call this; it sets `title: "New chat"` directly (the sentinel).
- **Auto-title** flow only fires after a user message has just been appended, so it gets a non-null result.
- **Rename** with empty input uses `titleFromMessage(messages) ?? "New chat"`.

### `customerId` prefix preservation

If `chatflowConfig.vars.customerId` is set, every newly generated `chatId` (across all sessions) uses `${customerId}+${uuid}`. Existing prefixed chatIds in v1 storage are preserved through migration. Changing `customerId` mid-life does not re-prefix existing sessions; new sessions get the new prefix.

---

## 5. UI Surface & Config

### Panel layout

- **Full-page mode** — persistent left sidebar, default width 260 px, collapsible to a 44 px rail (collapse state persisted in `localStorage` under a separate `${chatflowid}_EXTERNAL_panelCollapsed` boolean key).
- **Bubble / popup modes** — sidebar is hidden by default; a `☰` toggle in the chat header opens it as a drawer (~75% of the chat-window width) over a dimmed backdrop. Tap a session row → drawer auto-closes and that session loads. Tap backdrop → drawer closes, active stays.

### Panel anatomy

- **Header** — "Conversations" label + collapse caret (full-page only).
- **+ New chat button** — primary CTA at top.
- **Session list** — sorted by `updatedAt` descending. Active row highlighted. Hovering a row reveals ✎ rename and × delete icons.
- **Footer** — small `N of 50 conversations` counter, only shown when `sessions.length >= 40`.

### Item interactions

- **Rename** — click ✎ → row swaps to inline input pre-filled with current title; **Enter** saves; **Esc** or click-outside cancels. Empty/whitespace-only saves fall back to `titleFromMessage` of the first user message, else `"New chat"`.
- **Delete** — click × → inline `Delete? [Yes] [No]` confirmation in the row. **Yes**: remove session and its `MsgKey`; if the deleted session was active, switch to the most recently updated remaining session (or run **New chat** if list is empty).
- **Switch** — click anywhere else on the row.

### Empty state

When the panel is rendered but no sessions exist (only happens on a fresh chatflow with the flag enabled), show a centered "No conversations yet" + "+ New chat" button.

### Cap-warning toast

Shown once per chatflowid the first time eviction occurs. Persisted via a one-time `${chatflowid}_EXTERNAL_capWarned` boolean in localStorage. Dismissible.

### Config surface — `BotProps` additions

```ts
type MultiSessionConfig = {
  enabled: boolean; // default false in embed; default true when wrapped by Flowise core
  maxSessions?: number; // default 50
};

type BotProps = {
  // ...existing fields
  multiSession?: MultiSessionConfig;
};
```

### Theme additions — `BubbleTheme.chatWindow.sessionPanel` (and equivalent for full/popup themes)

```ts
sessionPanel?: {
  // Layout
  width?: string | number;           // default 260px
  collapsedWidth?: string | number;  // default 44px

  // Colors — fall through to chatWindow palette if unset
  backgroundColor?: string;
  textColor?: string;
  activeBackgroundColor?: string;
  activeTextColor?: string;
  hoverBackgroundColor?: string;
  borderColor?: string;
  newChatButtonColor?: string;
  newChatButtonTextColor?: string;

  // Strings (i18n hooks)
  newChatLabel?: string;     // default "New chat"
  emptyStateText?: string;   // default "No conversations yet"
  capWarningText?: string;   // default "Conversation limit reached. Starting new ones will remove the oldest."
};
```

Themes that don't set `sessionPanel.*` colors get sensible defaults derived from existing `chatWindow` palette colors (background → `backgroundColor`, text → `textColor`, etc.).

### Imperative API — custom events

Matches the existing `flowise-clear-chat` pattern.

| Event                     | Direction    | Detail                              | Behavior                                                                                                       |
| ------------------------- | ------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `flowise-new-session`     | host → embed | `{}`                                | Creates a new session; sets it active.                                                                         |
| `flowise-switch-session`  | host → embed | `{ chatId: string }`                | Switches active session if `chatId` exists; no-op otherwise.                                                   |
| `flowise-session-changed` | embed → host | `{ chatId: string, title: string }` | Emitted on switch and on title change.                                                                         |
| `flowise-clear-chat`      | host → embed | (existing)                          | **Multi-session on:** deletes active session, creates a fresh one. **Off:** unchanged (clears the one thread). |

### Accessibility

- Panel: `role="navigation"`, `aria-label="Conversations"`.
- List: `role="list"`; items `role="listitem"` with `aria-current="true"` on the active session.
- Up/Down arrows move focus through items; **Enter** switches; **Delete** triggers inline delete confirm.
- Drawer (bubble/popup): focus traps inside drawer when open; **Esc** closes; backdrop is `aria-hidden`.
- Inline rename: input gets focus + selects all text; `aria-label="Rename conversation"`.
- Cap-warning toast: `role="alert"`.

---

## 6. Data Flows

Notation: **Index** = `localStorage[chatflowid_EXTERNAL]`; **MsgKey(id)** = `localStorage[chatflowid_EXTERNAL_msgs_${id}]`.

### Store init / mount

1. Read Index.
2. **Migration:** if v1 shape → wrap `chatHistory` into `sessions[0]`; write Index (v2) and MsgKey for that one session; preserve `lead`. If no entry → fresh v2 with one empty session. If unknown shape → log warning, treat as no entry, **do not clobber**.
3. **Reconcile / GC:** scan all `${chatflowid}_EXTERNAL_msgs_*` keys.
   - Key not in Index → orphan; `removeItem`.
   - Index entry without a matching key → seed empty MsgKey; log info.
4. Read `MsgKey(activeChatId)` only — other sessions stay cold until switched to. Cache in memory on read.
5. Attach a `window.addEventListener('storage', ...)` to detect cross-tab changes; on event, re-read Index and (if active session changed underneath) re-read its MsgKey.
6. If `multiSession.enabled === false` → store still runs; UI panel does not render.

### New chat

1. Generate `chatId` (with `customerId+` prefix if `chatflowConfig.vars.customerId` is set).
2. Write `MsgKey(chatId) = []`.
3. Update Index: prepend `{ chatId, title: "New chat", createdAt: now, updatedAt: now }`; set `activeChatId`; write Index.
4. **Cap check:** if `sessions.length > maxSessions`, find the session with lowest `updatedAt`; remove from Index; `removeItem(MsgKey(evicted.chatId))`. If this is the first eviction ever for this chatflowid (tracked via `${chatflowid}_EXTERNAL_capWarned`), emit the cap-warning toast and set the flag.
5. Emit `flowise-session-changed`.

### Switch session

1. User clicks list item with `chatId = X` (or host dispatches `flowise-switch-session`).
2. **If a response is currently streaming**, call `chatmessage/abort/{chatflowid}/{currentChatId}` (best-effort; ignore failure).
3. If `X` already cached in memory → set as active and re-render.
4. Else read `MsgKey(X)` → cache → set as active.
5. In bubble/popup, close the drawer.
6. Emit `flowise-session-changed`.

### Append message (during streaming or one-shot)

1. Bot calls `store.appendMessage(activeChatId, msg)`.
2. Store mutates in-memory active messages → Bot re-renders incrementally.
3. **Persist throttle:** writes to `MsgKey(activeChatId)` are debounced ~150ms so streaming doesn't fire one localStorage write per token.
4. **Flush triggers:** stream-end event from backend, `pagehide`, `beforeunload` — all flush pending writes immediately.
5. After persist, bump `session.updatedAt` and write Index (Index is small; per-message Index writes are cheap).
6. **Auto-title:** if the appended message is the first `userMessage` in this session **and** `session.title === "New chat"` (the sentinel set by the New chat flow), derive title via `titleFromMessage` and write Index. Once a session's title differs from the sentinel — whether via auto-title or manual rename — auto-titling never fires again for that session. Edge case: a user who manually renames _back to_ the literal string `"New chat"` will, on their next first-user-message in a freshly created session, see auto-title fire again. Acceptable trade-off; vanishingly rare.

### Rename

1. Click ✎ → row swaps to inline input.
2. **Enter** → `session.title = sanitize(input)` (trim, max 80 chars, fallback if empty); write Index.
3. **Esc** / click-outside → discard.

### Delete (inline confirm)

1. Click × → row shows `Delete? [Yes] [No]`.
2. **Yes:**
   - Remove session from Index; `removeItem(MsgKey(chatId))`; write Index.
   - If deleted was active and other sessions remain → switch to most recently updated remaining session (load its MsgKey).
   - If deleted was active and list is now empty → run **New chat** flow to seed a fresh session.

### `flowise-clear-chat` (existing event)

- **Multi-session on:** behaves like Delete on the active session (no inline confirm — the host page is the actor).
- **Multi-session off:** unchanged behavior (clear the one thread's messages).

---

## 7. Error Handling & Edge Cases

### `QuotaExceededError` on writes

The 50-session cap is a _count_ limit; bytes can still blow up on huge sessions. On any localStorage write failure:

1. Catch `QuotaExceededError` (DOMException name match).
2. **Emergency eviction:** drop the **non-active** session with the lowest `updatedAt` (Index + MsgKey); retry the write. The active session is never evicted by this path — that would be self-defeating.
3. Repeat up to 5 times or until only the active session remains.
4. If still failing → surface a toast ("Storage is full. Some history could not be saved.") and skip the persist. In-memory state continues; on next clean write, things re-converge.
5. **Never** clobber `lead` during emergency eviction.

### Corrupt or unknown storage shapes

If `JSON.parse` throws or the parsed value matches neither v1 nor v2, log a console warning and treat as no entry. **Do not overwrite** — the user might own that key (custom integration, name collision).

### Storage drift / orphans

Reconcile/GC on init handles ungraceful tab closes mid-write:

- MsgKey exists with no matching Index entry → orphan; delete.
- Index entry exists with no matching MsgKey → seed empty MsgKey; log info.

### Stream abort failures

`chatmessage/abort/{chatflowid}/{chatId}` is best-effort. If it fails (network down, race with completion), swallow and move on. The UI is already showing the new session; the original session's last message may end up complete or truncated mid-token depending on backend race — acceptable for v1.

### Active session deleted mid-stream

Same handling as switch-mid-stream: abort then delete. Streaming response is dropped.

### Multi-tab concurrency

Two tabs on the same chatflowid share localStorage. Last-write-wins. A `storage` event listener re-reads Index on cross-tab change so each tab notices renames/deletes/new-chats from the other. Real-time merge of concurrent edits is not supported in v1 — both tabs editing the same session simultaneously can race.

---

## 8. Testing

**Decision:** Defer test framework setup. v1 ships with manual testing + heavy code review. Vitest + Solid Testing Library is a follow-up spec.

**Risk:** Migration and store actions are precisely the code that benefits most from unit tests. Reviewers and authors must compensate by:

- **Manual matrix testing** — every flow in Section 6 against every UI mode (bubble, full-page, popup), with both `multiSession.enabled = true` and `false`.
- **Migration testing** — manually craft localStorage entries matching v1 shape (with/without `lead`, with/without messages, with/without `customerId` prefix); reload and verify v2 result.
- **Cap testing** — write a small script in `public/index.html` to seed 50 sessions then create a 51st; verify FIFO eviction + one-time toast.
- **Quota testing** — fill localStorage to ~5 MB manually; verify emergency eviction.
- **Streaming-mid-switch** — start a long response; switch sessions mid-stream; verify abort fires and original session's tail is dropped cleanly.
- **Cross-tab** — open two tabs of the same chatflow; create/rename/delete in one; verify the other re-syncs on focus.

A follow-up "add Vitest" spec should be opened the same week this lands.

---

## 9. Flowise Core Companion (thin section)

This is what the parent Flowise repo needs to do to enable default-on previews. Not implementation work in this spec — just touchpoints to call out.

1. **Set `multiSession: { enabled: true }`** wherever Flowise's admin UI mounts the embed for chatflow / agentflow previews. Likely a `BotProps` extension or pre-baked config object.
2. **Verify `chatflowid` is stable** across preview reloads. If admin uses transient ids, multi-session won't persist there — flag back to the embed team.
3. **Optional follow-up (own spec):** expose an "Enable session history" toggle in the chatflow / agentflow settings UI; the value is copied into the embed snippet customers paste. Out of scope here.

**Agentflows vs chatflows:** no special handling. The embed doesn't know whether the backend is a chatflow or agentflow — both go through `/api/v1/prediction/{chatflowid}` and both have stable chatflowids. Multi-session works the same for both.

---

## 10. Out of Scope (Future Work)

- Server-backed persistence and cross-device sync.
- LLM-generated session titles.
- Search across sessions.
- Pinning, archiving, folders/tags.
- Sharing or exporting a session.
- Per-session model selection.
- **Background streaming on session switch** (v1 cancels; "background continue" is a polish follow-up).
- Real-time merge of concurrent edits across tabs.
- Touch swipe gestures for drawer (tap-only in v1).
- Per-chatflow cap configuration in admin UI (cap is a code default + `BotProps` override in v1).
- Flowise admin "Enable session history" toggle (own spec).
- Vitest + Solid Testing Library setup (own follow-up spec).

---

## 11. Risks & Open Items

- **No automated tests in v1.** Mitigated by manual matrix + heavy review. Highest-risk areas: migration, store actions, cap eviction, streaming-mid-switch.
- **Bot.tsx surgery.** The file is large (~1500 lines) and replacing internal signals with store-derived ones is a wide diff. Mitigated by keeping the store interface narrow (read active session + a small set of action methods) so the diff is mechanical rather than architectural.
- **localStorage size headroom.** With 50 sessions of ~50 KB each, headroom against a 5 MB browser quota is comfortable. Heavy attachment use or very long bot responses can erode this; emergency eviction is the safety net.
- **`storage` event coverage.** Modern browsers fire it consistently for cross-tab changes, but Safari has historically had quirks under private browsing. If issues surface, fall back to re-reading Index on window focus.
