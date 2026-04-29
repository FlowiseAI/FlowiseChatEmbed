# Multi-Session Chat — Goal, Assumptions & Thinking

A higher-level companion to the structured decision log. Read this first to understand _why_ the feature looks the way it does; read the decision log for the option-by-option breakdown.

**Date:** 2026-04-29
**Status:** Designed and planned (not yet implemented)
**Companion docs:**

- Decision log: `docs/superpowers/decisions/2026-04-29-multi-session-chat-decisions.md`
- Technical spec: `docs/superpowers/specs/2026-04-29-multi-session-chat-design.md`
- Implementation plan: `docs/superpowers/plans/2026-04-29-multi-session-chat.md`

---

## Goal

Bring a ChatGPT / Claude / Gemini-style **multi-conversation experience** to the FlowiseChatEmbed widget. One chatbot can host a list of independent conversations the user can create, switch between, rename, and delete — without the bot losing track of context as they jump around.

Because Flowise core uses this same embed for its in-app chat preview, this feature also automatically lights up for chatflow and agentflow builders inside Flowise.

### User value, in one sentence

Users no longer have to choose between "keep this conversation going" and "start a fresh one" — they can do both, and come back to either.

### What "multi-session" specifically means here

- Each session is a self-contained thread: its own `chatId`, its own message history, its own backend memory (Flowise already keys server-side context off `chatId`).
- Sessions are listed in a panel (sidebar in full-page mode, drawer in bubble/popup).
- Each session has a human-readable title (auto-derived from the first message or manually renamed).
- Switching sessions is instant — the bot's state, position, and visible history all reflect the active session.

---

## Why Now

- **User expectation has shifted.** The dominant chat UX pattern (ChatGPT / Claude / Gemini) is now multi-session. Customer-deployed chat widgets that don't have it feel dated.
- **Agentflows make conversations more valuable.** As agents do more multi-step work, losing the thread mid-task is a bigger cost. Users want to revisit and continue.
- **No backend lift required for v1.** The split storage shape lets us ship this entirely client-side. We can validate the UX before committing to server-side persistence in v2.

---

## Assumptions

These are the things we treated as **true without verifying**, because verifying them would have meant slowing down the brainstorm. If any of them turn out to be false, parts of the design need to be revisited.

### About users

- **Most end-users are anonymous from the embed's perspective.** The host site might know who the user is, but the embed doesn't get that identity by default. We don't try to bridge that gap in v1.
- **End-users access the embed from one device per session of activity.** Cross-device handoff is a real but secondary need — not worth building before we know users actually want sessions at all.
- **A handful of conversations is the common case; dozens is the long-tail.** 50 sessions per chatflow is a generous cap; few real users will hit it.

### About deployment

- **The embed is dropped into customer-controlled HTML.** That means we don't control when / how / if the host page reloads, refreshes config, or is destroyed. The persistence layer has to assume ungraceful tab closes.
- **Customer sites do not want surprise UI changes.** Shipping a feature default-on would be hostile to existing deployments. Hence opt-in at the embed level.
- **Flowise core can be an internal-only proving ground.** The team building chatflows is willing to dogfood; that lets us default-on inside Flowise and keep external embeds opt-in.

### About the codebase

- `Bot.tsx` is the source of chat truth today and is large (~1500 lines). Surgery is unavoidable, but should be mechanical (signal swaps), not architectural.
- The existing `localStorage[${chatflowid}_EXTERNAL]` key is widely depended on (notably by `lead` capture). Backwards-compat for non-session callers is non-negotiable.
- Solid is the framework; signals + memos are the right reactive primitive for the store. We don't need a heavyweight state library.

### About the future

- Server-backed persistence will likely become a v2 requirement, but won't share much code with v1's localStorage layer. So we don't pre-pay for it now.
- LLM-generated session titles will be a v2 polish item (it requires a Flowise endpoint). Auto-truncated titles + manual rename cover ~95% of the UX gap.

---

## Constraints

### Hard constraints (non-negotiable)

1. **No backend changes for v1.** Flowise's prediction / streaming / abort / lead / TTS endpoints stay exactly as they are. The embed manages all multi-session state client-side.
2. **Existing localStorage data is preserved.** Anyone with an in-progress thread when this ships keeps their thread (it becomes session #1).
3. **Existing callers of `setLocalStorageChatflow` keep working.** The `lead` write path, in particular, must not be broken by the new shape.
4. **`multiSession.enabled = false` is functionally identical to today's embed.** Customers who don't opt in see no UI or behavior change.

### Soft constraints (strong preferences)

1. **Streaming should not feel different.** Multi-session must not introduce stutter or lag during a streamed response, even with many sessions stored. (This is the reason for the split storage shape.)
2. **One responsive UI pattern across modes.** Maintaining two different UIs (e.g., a sidebar in full-page and a totally different dropdown in bubble) is not worth the cost. Same component, CSS adapts.
3. **No new test framework for v1.** We accept the risk of manual-only verification because adding Vitest is its own scope. A follow-up spec covers this.

### Constraints we _chose_ to accept (could be revisited)

- 50 session cap per chatflowid — chosen for localStorage headroom; configurable.
- Cancel-on-switch streaming — chosen over background-continue because background-continue has tricky lifecycle edges. Background-continue can come later.
- Last-write-wins across browser tabs — chosen over real-time merge because CRDT-style merge is overkill for v1.

---

## Key Thinking

The five throughlines that drove most of the design.

### 1. "Smallest blast radius first"

Every fork in the road, when in doubt, we picked the option that minimizes risk to existing users and existing code:

- Device-local storage over server sync.
- Opt-in flag over default-on (in the embed).
- In-place migration over reset.
- Cancel-on-switch over background streaming.
- Last-write-wins over real-time merge.

This isn't lack of ambition — it's a deliberate v1 strategy. We get the feature in front of users, validate it, then decide which rough edges to invest in.

### 2. "Streaming is the load-bearing UX"

Most chat features feel slow in two places: initial response start and per-token append. We can't make either faster, but we can make sure multi-session doesn't make them slower.

The single most important architectural decision (split storage shape) is in service of this: every streamed token would otherwise re-serialize all sessions, blocking the main thread. Splitting the storage isolates the cost to the active session.

### 3. "Bot.tsx changes should be mechanical"

`Bot.tsx` is a large, complex component. Refactoring it architecturally would balloon the PR and introduce bugs unrelated to multi-session. Instead, we picked a store shape that lets the Bot.tsx diff be:

- Replace internal `chatId()` signal with `store.activeChatId()`
- Replace internal `messages()` signal with `store.activeMessages()`
- Replace `setMessages(append)` calls with `store.actions.upsertMessage(msg)`
- Add a `<Show>` for the new `☰` button in bubble/popup mode

That's surgical. Most of `Bot.tsx`'s logic (streaming, file uploads, feedback, observers, agent reasoning) is untouched.

### 4. "Match user mental models — don't invent new ones"

A session list is a familiar concept. Users know what "+ New chat", rename, delete, and an active highlight mean from ChatGPT/Claude/Gemini. We're deliberately _not_ introducing novelties:

- No tags, folders, pinning, or archive in v1 (they'd add new mental load without a clear reason).
- Inline rename and inline delete confirmation (not modals — modals are heavyweight for a per-row action).
- `flowise-clear-chat` repurposed to "delete active session" (matches the "clear what I see" mental model of the existing event).

### 5. "Forward-compatible without forward-paying"

We don't pay for v2 features now, but we don't paint ourselves into corners:

- The store interface is identity-agnostic: replacing the localStorage backend with a server-sync backend is a localized change.
- The custom-event API (`flowise-new-session`, `flowise-switch-session`, `flowise-session-changed`) gives host pages a way to integrate with auth or external session lists later.
- The session shape (`{ chatId, title, createdAt, updatedAt }`) is simple enough to serialize to a backend later without rework.

---

## Success Criteria

What it looks like when this ships and is working:

### Functional

- [ ] User can start a new chat from the panel.
- [ ] User can switch between chats and the bot reflects the active thread instantly (no flash, no re-fetch of config).
- [ ] User can rename a chat inline.
- [ ] User can delete a chat with inline confirmation.
- [ ] On reload, the user lands on their last-active session with full history.
- [ ] When the host site flips the flag on for an existing user, that user's thread becomes session #1 — no data loss, no surprise.
- [ ] Streaming a long response and switching sessions mid-stream cleanly aborts the original and starts the new session.

### Non-functional

- [ ] Streaming token append doesn't slow down with many sessions stored (no main-thread stalls).
- [ ] Embeds without `multiSession.enabled = true` behave identically to before.
- [ ] localStorage layout is forward-compatible (a v2-versioned shape lets future migrations stay clean).
- [ ] Keyboard navigation works (Tab, arrow keys, Enter, Delete, Escape).

### Operational

- [ ] No backend changes shipped.
- [ ] No new runtime dependencies.
- [ ] Manual test plan executed on all three modes before merge.
- [ ] Follow-up specs filed for: (a) Vitest setup; (b) Flowise admin "Enable session history" toggle; (c) v2 server-backed persistence.

---

## Non-Goals (Explicit)

To prevent scope creep during implementation, these are explicitly _not_ what this feature delivers:

- **Cross-device sync.** Each device has its own session list. Coming in v2 with server-backed persistence.
- **LLM-generated session titles.** Titles are truncated first messages or user-renamed. Smart titles need a backend endpoint.
- **Search.** Even at 50 sessions, a sorted-by-recency list is browsable. Search is future polish.
- **Pinning, archiving, folders, tags, sharing.** These are familiar from desktop chat apps but each is its own design effort. Out of scope.
- **Per-session model selection.** Each session uses the same chatflow / agentflow as the embed it's in.
- **Background-continue streaming on session switch.** v1 cancels mid-stream. Background-continue is a polish follow-up.
- **Real-time tab synchronization.** Multiple tabs converge on the next storage event, but concurrent edits are last-write-wins.
- **Touch swipe gestures.** Drawer opens/closes via tap on `☰` and tap-on-backdrop. No swipe.
- **Per-chatflow cap UI in Flowise admin.** The cap is configurable via `BotProps.multiSession.maxSessions`; admin UI is a future spec.

---

## What We Decided Not to Worry About (for v1)

These are real concerns that the team might raise — explanations for why they're handled lightly or deferred:

- **localStorage quota exhaustion at the high end.** Yes, it can happen. Emergency eviction is the safety net (drop oldest non-active session on `QuotaExceededError`, retry). This is a backstop, not a primary path.
- **Old browsers / Safari private browsing.** localStorage works in private mode but with a smaller quota and some `storage` event quirks. Acceptable degradation.
- **Stale data when host site changes `customerId` mid-life.** Old sessions keep their original prefix; new sessions get the new prefix. We don't auto-clean.
- **The embedded Flowise admin preview's session list persisting between admin sessions.** Depends on `chatflowid` stability across preview reloads in Flowise. Called out for the Flowise team to verify.

---

## What Could Make Us Reconsider

Things that, if true, would justify revisiting the v1 design:

1. **Customers ask for cross-device early.** That'd promote the v2 server-sync spec to v1 priority and likely change the storage interface.
2. **Streaming-mid-switch UX feels broken in practice.** If users hate losing the truncated tail of a response, "background-continue" goes from polish to a v1 requirement.
3. **The 50-session cap is hit by real users on shared kiosks or long-running sessions.** That'd suggest different eviction policies, or earlier server-side handoff.
4. **Bot.tsx surgery surfaces unforeseen bugs.** Worst case, we fall back to the wrap-and-remount architecture (Approach 1 in the decision log) and accept the re-fetch cost.

---

## TL;DR for a Stakeholder

> We're shipping a familiar multi-conversation UI to the embed widget, fully client-side, opt-in for production embeds and on-by-default in Flowise's own preview. It's invisible to anyone who doesn't enable it; for anyone who does, their existing chat smoothly becomes their first session. It's a polished v1 (new / switch / rename / delete) with deliberately deferred polish (search, pinning, smart titles, cross-device) to keep the blast radius small while we validate the UX. Engineering complexity is in the embed; Flowise core's job is to flip a flag and verify chatflowid stability.
