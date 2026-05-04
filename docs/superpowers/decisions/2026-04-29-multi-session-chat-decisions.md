# Multi-Session Chat — Design Decision Log

A team-readable record of how we arrived at the design for a ChatGPT-style multi-session feature in FlowiseChatEmbed (extending into Flowise core's chatflow / agentflow previews).

**Date:** 2026-04-29
**Spec:** `docs/superpowers/specs/2026-04-29-multi-session-chat-design.md`
**Plan:** `docs/superpowers/plans/2026-04-29-multi-session-chat.md`

---

## Goal

> "One chat interface can have multiple sessions. Mimicking ChatGPT / Claude / Gemini's web chat experience."

The embed should host a list of independent conversations a user can create, switch between, rename, and delete — all within a single chatflow / agentflow.

---

## Today's Behavior (Before This Feature)

- Single ephemeral conversation per `chatflowid`.
- `chatId` is a UUIDv4 generated on mount, stored in `localStorage[${chatflowid}_EXTERNAL]` along with the entire message history.
- No history-fetch API; everything is client-side.
- Three UI modes: bubble (corner popup), full-page, popup-overlay.
- A `flowise-clear-chat` custom event exists; no "new chat" button.
- A `chatflowConfig.vars.customerId` hook is the soft tenancy mechanism.

---

## Process Overview

We worked through six structured questions to converge on scope, then three architectural approaches, then six design sections (with several embedded sub-decisions). The full path:

1. **Six scoping questions** → defined what the feature _is_.
2. **Three architectural approaches** → decided _how_ to build it.
3. **Six design sections** with inline decisions → nailed down details (storage shape, cap policy, edge cases, accessibility).
4. **Spec written + self-reviewed + committed.**
5. **Implementation plan written + self-reviewed + committed.**

---

## Decision 1: Identity & cross-device persistence

**Question:** When a user reloads or comes back tomorrow, what should happen with their session list?

| Option                       | Description                                                                                                                                      | Pros                                                                       | Cons                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **A. Device-only** ✅ chosen | Sessions live in `localStorage`. Same browser only. No backend changes.                                                                          | Smallest scope · No identity primitive needed · No Flowise backend changes | No cross-device · No multi-device handoff                    |
| B. Cross-device, always      | Sessions persist server-side, follow the user across devices. Requires the host site to identify the user (cookie / JWT / `customerId` / token). | True ChatGPT parity                                                        | Requires identity primitive · Backend work · Auth complexity |
| C. Hybrid                    | Anonymous → device-local. Identified → server-synced.                                                                                            | Most flexible                                                              | Most surface area · Two storage paths to maintain            |

**Why A:** Smallest blast radius for v1. No identity primitive can be assumed; cross-device is a future spec.

---

## Decision 2: Which UI modes support multi-session?

**Question:** The embed has three modes (bubble, full-page, popup) with very different real estate. Where should the session list live?

| Option                                           | Description                                                                                                           | Pros                                           | Cons                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| A. Full-page only                                | Multi-session opt-in for the full-page mode; bubble/popup keep current single-thread behavior.                        | Smallest design · No layout adaptation needed  | Inconsistent UX across modes · Bubble misses the feature |
| **B. One responsive panel everywhere** ✅ chosen | Same `SessionPanel` component renders as a sidebar in full-page and as a slide-in drawer in bubble/popup. CSS adapts. | One UI pattern · One mental model · Code reuse | Drawer overlay needs care                                |
| C. Different affordance per mode                 | Full-page = sidebar; bubble = a header dropdown menu (no drawer). Two distinct UI patterns.                           | Each mode optimized                            | Two patterns to maintain · Two mental models for users   |

**Why B:** A single component with CSS adaptation gives one mental model and one code path. Pattern is familiar (Gmail / Slack mobile).

---

## Decision 3: V1 feature set

**Question:** ChatGPT-class chat has many polish layers. What's in v1?

| Option                       | Description                                                                                                                           | Pros                                                                  | Cons                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| A. Minimum viable            | New chat · switch · delete · sort by recency · auto-title from truncated first user message. **No** rename, no search, no LLM titles. | Fastest to ship · Pure client-side                                    | Users hit "why can't I rename?" wall fast                                                             |
| **B. Polished v1** ✅ chosen | Everything in A + **manual rename**.                                                                                                  | Cheap to add rename · Closes the obvious gap · Still pure client-side | None significant                                                                                      |
| C. ChatGPT-parity            | Everything in B + LLM-generated smart titles + search across session titles.                                                          | Best UX                                                               | Requires new Flowise backend endpoint for title generation · Conflicts with Decision 1 (device-local) |

**Why B:** Rename is a small extension that prevents an immediate UX complaint. LLM titles and search require backend work that contradicts the "device-local, no backend changes" stance.

---

## Decision 4: Opt-in or default-on?

**Question:** The embed is on lots of customer sites. Adding a session sidebar changes the chrome of every embedded chatbot.

| Option                                           | Description                                                                                          | Pros                                                                 | Cons                                                                        |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **A. Opt-in via config** ✅ chosen               | New `multiSession.enabled` flag. Existing embeds stay single-thread until they upgrade their config. | Safest rollout · No surprises · No hidden assumptions                | Requires explicit opt-in                                                    |
| B. Default-on                                    | Ship it on for everyone. Existing single-thread becomes "you have 1 session."                        | Most consistent                                                      | Every customer site suddenly grows session UI; high blast radius            |
| C. Opt-in for embed; default-on for Flowise core | Embed widget is opt-in. Flowise's own chat preview / admin surfaces enable it by default.            | Customer sites stable · Flowise dogfoods without per-chatflow wiring | Assumes a Flowise admin preview exists and is actively used — not confirmed |

**Why A:** Fully opt-in via `multiSession: { enabled: true }`. The "Flowise core default-on" rationale assumed an admin chat preview panel that may not exist or may not be actively used by the team. Opt-in everywhere is the safest rollout with no hidden assumptions.

---

## Decision 5: Migration of existing single-thread chats

**Question:** When the flag is flipped on, existing users have a single thread sitting in `localStorage`. What happens to it?

| Option                            | Description                                                                                                                                   | Pros                                                         | Cons                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **A. In-place upgrade** ✅ chosen | Existing thread becomes session #1 in the new list. Title auto-derived from first user message (or "Previous chat" if empty). Zero data loss. | Invisible to end-users · One-time, idempotent · No data loss | Slightly more migration code                                               |
| B. Coexistence                    | New sessions are separate; old thread shows as a pinned "Legacy chat" until user starts something new.                                        | Briefly transitional                                         | Two storage shapes side-by-side · Confusing                                |
| C. Reset on flip                  | Clear `${chatflowid}_EXTERNAL` and start fresh.                                                                                               | Simplest implementation                                      | End-users lose their thread mid-conversation if a developer flips the flag |

**Why A:** End-users shouldn't pay for a developer's config change. Migration is one-time, idempotent, and small.

---

## Decision 6: Scope of the spec

**Question:** The feature should also extend to chatflows and agentflows in the Flowise repo. How much do we cover here?

| Option                                                  | Description                                                                                                                                         | Pros                                                 | Cons                                                   |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| A. Embed-only spec                                      | This spec covers FlowiseChatEmbed end-to-end. Flowise integration is "set the flag." Any Flowise-side polish is its own follow-up spec.             | Smallest scope · Cleanest boundaries                 | Flowise-side touchpoints could fall through the cracks |
| **B. Embed + thin Flowise companion section** ✅ chosen | Primarily the embed; includes a checklist of "what Flowise core needs to do" without a full design. Implementation likely two PRs across two repos. | Nothing falls through · Flowise team has a checklist | Slightly larger spec                                   |
| C. One mega-spec across both repos                      | Embed + Flowise admin UI + agentflow nuances all in one document.                                                                                   | Most coherent                                        | Largest · Risks blocking on either repo                |

**Why B:** Engineering complexity is in the embed; Flowise-side work is configuration. We can keep the Flowise section to a checklist (3 bullets) without designing it in detail.

---

## Decision 7: Architecture (where does session state live?)

After the six scoping questions, we evaluated three implementation shapes:

| Approach                                    | Description                                                                                                                                                               | Pros                                                                                                                                                 | Cons                                                                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Wrap & remount                           | New `<ChatSessionManager>` wraps `<Bot>`. `<Bot>` is rendered keyed by `activeChatId` so it remounts on switch.                                                           | Smallest diff to `Bot.tsx` · Easy to review                                                                                                          | Re-fetches `/public-chatbotConfig` and `/chatflows-streaming` on every switch · Visual flash · Loses transient state (composing input, etc.) |
| **2. Solid store + reactive Bot** ✅ chosen | A new `sessionStore` (Solid signals) is the source of truth. Sidebar and Bot both subscribe. `Bot.tsx` reads active session via context; writes go through store actions. | Smooth switching · No re-fetch · Bot stays mounted · Store is testable in isolation · Migration / rename / delete logic lives naturally in the store | Most surgery on `Bot.tsx` (~1500 lines) · Largest review effort                                                                              |
| 3. Hybrid                                   | Wrapper owns sessions; Bot accepts `activeChatId` + `initialMessages` as props and reseeds via `createEffect`.                                                            | No remount · Less Bot surgery than #2 · Clear interface                                                                                              | Reseed-via-prop logic is fiddly · Edge cases (streaming-mid-switch) get hard                                                                 |

**Why 2:** Approach 1's remount cost — re-fetching config and flashing UI on every switch — kills the "ChatGPT feel" the feature is named after. Approach 3 ends up reproducing a worse version of what a store already gives you. The store is the abstraction this feature actually wants.

---

## Sub-decisions (made during design sections)

These came up while detailing the design and weren't part of the original six questions, but each is load-bearing.

### 7a. Storage shape — inline vs split

**Question:** Store all sessions and their messages in one localStorage key, or split the index from per-session message bodies?

| Option                                    | Description                                                                             | Pros                                                                                                                                   | Cons                                                                                                                                                                   |
| ----------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inline (one key)                          | Whole structure under `${chatflowid}_EXTERNAL`.                                         | Atomic single-write; simple                                                                                                            | Every save (including streamed token updates) re-serializes ALL sessions. With 50 sessions, that's ~2.5 MB per write. localStorage is synchronous → main-thread block. |
| **Split (index + per-session)** ✅ chosen | Index in `${chatflowid}_EXTERNAL`; messages in `${chatflowid}_EXTERNAL_msgs_${chatId}`. | Append touches only the active session's blob (~50 KB) · Total bytes unchanged · Write cost scales with active session, not total list | Slightly more code · Two-write ordering needs care (recoverable via GC pass)                                                                                           |

**Why split:** localStorage is synchronous and writes during streaming happen many times per response. Inline shape would stutter on slow devices once a user has more than a few sessions.

### 7b. Session cap

**Question:** What happens when a user accumulates too many sessions?

- **Cap chosen:** 50 sessions per chatflowid (configurable via `BotProps.multiSession.maxSessions`).
- **Eviction policy chosen:** Soft-warn-once + FIFO eviction by `updatedAt` (oldest non-active session removed).

Options considered:

- A. Silent FIFO at 50 (no notice — like browser tab history)
- **B. Soft warn at 50, then FIFO** ✅ chosen (one-time toast)
- C. Hard stop at 50 (force user to delete before "+ New chat" works)

**Why B:** Transparency without friction. Users learn what happened the first time; subsequent evictions are silent.

### 7c. Sidebar collapse

**Question:** In full-page mode, can the sidebar collapse?

- **Decision:** Yes — collapses to a 44px rail showing just `☰` and `+` icons. State persisted per `chatflowid`.

### 7d. Delete confirmation UX

**Question:** Modal or inline?

- **Decision:** Inline `Delete? [Yes] [No]` in the row itself. No separate modal.

**Why:** Less disruptive; matches the row-as-the-unit mental model.

### 7e. Repurposing `flowise-clear-chat`

**Question:** The existing `flowise-clear-chat` custom event wipes the single thread. What does it do under multi-session?

- **Decision:** Deletes the active session and seeds a fresh one. Preserves end-user expectation of "clear what I see now."
- When `multiSession.enabled === false`, behavior is unchanged.

### 7f. Streaming response, then user switches sessions

**Question:** What happens to a response that's mid-stream when the user switches to another session?

| Option                           | Description                                                                         | Pros                                                      | Cons                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **a. Cancel + switch** ✅ chosen | Best-effort abort on the in-flight stream; switch immediately.                      | Predictable · Small change · Uses existing abort endpoint | Original session ends with a truncated reply                                                      |
| b. Continue in background        | Stream stays alive; switch UI immediately; persist result back to original session. | Most "ChatGPT-like"                                       | Detached fetch lifecycle · Tricky to commit to the original chatId · Real risk of ghost responses |
| c. Block the switch              | Disabled state with "still generating, please wait."                                | Most explicit                                             | Friction · Bad UX                                                                                 |

**Why a:** Polished v1 doesn't need polish-of-polish. Background-continue is in Out of Scope for a future iteration.

### 7g. Multiple browser tabs of the same chatflow

**Question:** Two tabs share localStorage. What happens?

- **Decision:** Last-write-wins. A `storage` event listener re-reads the index on cross-tab change so each tab notices renames/deletes/new-chats from the other. No real-time merge of concurrent edits.

**Why:** Realistic for v1. Real-time CRDT-style merge is out of scope.

### 7h. Test framework

**Question:** Add Vitest + Solid Testing Library, or defer?

- **Decision:** Defer. v1 ships with manual testing + heavy code review. A follow-up "add Vitest" spec should be opened the same week the feature lands.
- **Risk acknowledged:** Migration and store actions are precisely the code that benefits most from unit tests. Mitigated by a manual verification harness (`public/debug-sessions.html`) and a written manual test matrix.

---

## Out of Scope (Decided, Not Hidden)

These came up during brainstorming and were _intentionally_ deferred:

- Server-backed persistence and cross-device sync (Decision 1)
- LLM-generated session titles (Decision 3)
- Search across sessions
- Pinning / archiving / folders / tags
- Sharing or exporting a session
- Per-session model selection
- Background-continue streaming on session switch (7f)
- Real-time merge of concurrent edits across tabs (7g)
- Touch swipe gestures for drawer (tap-only in v1)
- Per-chatflow cap configuration UI in Flowise admin
- Flowise admin "Enable session history" toggle (own follow-up spec)
- Vitest + Solid Testing Library setup (own follow-up spec, 7h)

---

## Risks Accepted for v1

1. **No automated tests.** Mitigated by manual verification harness + matrix + heavy review.
2. **Bot.tsx surgery.** Bot.tsx is ~1500 lines; replacing internal signals with store-derived ones is a wide diff. Mitigated by keeping the store interface narrow (read active + small action set) so the diff is mechanical.
3. **localStorage size headroom.** 50 sessions × ~50 KB ≈ 2.5 MB headroom against typical 5 MB browser quota. Heavy attachments / very long bot responses can erode this; emergency eviction is the safety net.
4. **`storage` event coverage.** Modern browsers fire it consistently; Safari has historically had quirks under private browsing. Fallback: re-read on window focus if issues surface.

---

## Flowise Core Companion (What the Other Repo Needs)

This is _not_ implementation work in this spec — just touchpoints for the Flowise team:

1. Set `multiSession: { enabled: true }` wherever Flowise's admin UI mounts the embed for chatflow / agentflow previews.
2. Verify `chatflowid` is stable across preview reloads (so the session list survives between admin sessions).
3. **Optional follow-up (own spec):** expose an "Enable session history" toggle in chatflow / agentflow settings UI; the value flows into the embed snippet customers paste.

Agentflows vs chatflows: no special handling. The embed doesn't know which backend it's talking to — both go through `/api/v1/prediction/{chatflowid}` and have stable chatflowids.

---

## Summary Snapshot

| Decision            | Chose                           | One-liner why                                       |
| ------------------- | ------------------------------- | --------------------------------------------------- |
| 1. Storage scope    | Device-local                    | Smallest blast radius; no identity needed           |
| 2. UI strategy      | One responsive panel            | One mental model, one code path                     |
| 3. V1 feature set   | Polished v1 (incl. rename)      | Closes the obvious gap; still client-side           |
| 4. Rollout          | Opt-in everywhere               | No hidden assumptions about Flowise admin preview   |
| 5. Migration        | In-place upgrade                | Invisible to end-users; idempotent                  |
| 6. Spec scope       | Embed + thin Flowise checklist  | Complexity is in embed; Flowise is config           |
| 7. Architecture     | Solid store + reactive Bot      | Avoids remount-and-refetch cost                     |
| 7a. Storage shape   | Split (index + per-session)     | Streaming writes don't compound across all sessions |
| 7b. Cap policy      | 50 + soft-warn FIFO             | Bounded; transparent on first eviction              |
| 7c. Collapse        | Yes (full-page)                 | Standard UX; saves space when wanted                |
| 7d. Delete UX       | Inline confirm                  | Less disruptive than modal                          |
| 7e. Clear-chat      | Repurposed → delete active      | Matches end-user mental model                       |
| 7f. Stream + switch | Cancel + switch                 | Predictable; small change                           |
| 7g. Multi-tab       | Last-write-wins + storage event | Realistic for v1                                    |
| 7h. Tests           | Deferred                        | Avoid scope creep; risk acknowledged                |
