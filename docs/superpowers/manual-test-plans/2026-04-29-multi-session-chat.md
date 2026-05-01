# Multi-Session Chat — Manual Test Plan (2026-04-29)

Verification log for the multi-session chat feature on `feat/multi-session-chat`. Run this before merging the implementation PR.

## Environment

- Branch: `feat/multi-session-chat`
- Build: `npm run build` (or `npm run dev` for live rebuild)
- Server: `npm start` (Express on `:5678` by default)
- Demo page: `public/index.html`
- Enabled via host attribute: `<flowise-fullchatbot multiSession='{"enabled": true}'>` (or pass `multiSession: { enabled: true }` to `Chatbot.initFull(...)`)

## Plan / Spec / Decisions References

- Plan: [docs/superpowers/plans/2026-04-29-multi-session-chat.md](../plans/2026-04-29-multi-session-chat.md)
- Design spec: [docs/superpowers/specs/2026-04-29-multi-session-chat-design.md](../specs/2026-04-29-multi-session-chat-design.md)
- Decision log: [docs/superpowers/decisions/2026-04-29-multi-session-chat-decisions.md](../decisions/2026-04-29-multi-session-chat-decisions.md)

## Matrix

Each row maps to one acceptance criterion in spec Section 8. Mark `Pass`, `Fail`, or `N/A` and add notes.

| #   | Scenario                                                                                                                                                                                                                                    | UI mode(s)      | Result | Notes |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------ | ----- |
| 1   | First load, no localStorage → fresh empty session, panel shows it                                                                                                                                                                           | Full            |        |       |
| 2   | First load, no localStorage → fresh empty session, panel shows it                                                                                                                                                                           | Bubble          |        |       |
| 3   | First load with v1 localStorage (`<chatflowid>_EXTERNAL` legacy keys) → migration runs, session #1 contains historical messages with derived title (or `Previous chat` if v1 was empty)                                                     | Full            |        |       |
| 4   | New chat → switch → rename (inline) → delete-confirm → delete                                                                                                                                                                               | Full            |        |       |
| 5   | Same: New → switch → rename → delete                                                                                                                                                                                                        | Bubble (drawer) |        |       |
| 6   | Streaming-mid-switch: send long-streaming message in convo B, switch to convo A mid-stream → A renders cleanly (no stray tokens), B continues filling in background, switch back shows full response                                        | Full            |        |       |
| 7   | `flowise-toggle-session-drawer` event in bubble/popup mode opens/closes drawer                                                                                                                                                              | Bubble          |        |       |
| 8   | Cap eviction: create the (maxSessions + 1)th session → toast appears once, oldest non-active session evicted; subsequent evictions silent                                                                                                   | Full            |        |       |
| 9   | Cross-tab: rename session in tab A, focus tab B → row title updates without reload                                                                                                                                                          | Full            |        |       |
| 10  | Cross-tab: switch active in tab A, focus tab B → tab B's main panel updates to show the new active's messages                                                                                                                               | Full            |        |       |
| 11  | Quota exhaustion: pre-fill localStorage near the cap (~5MB on most browsers), send a message → emergency eviction triggers, toast surfaces if write still fails after retries                                                               | Full            |        |       |
| 12  | Theme `chatWindow.sessionPanel.*` keys (backgroundColor, textColor, activeBackgroundColor, hoverBackgroundColor, borderColor, newChatButtonColor, etc.) are respected; unset keys fall through to `chatWindow` palette                      | Full            |        |       |
| 13  | Drawer mode in bubble: `☰` toggle in header opens drawer; click outside or press Escape to close; drawer focus traps to first focusable on open                                                                                             | Bubble          |        |       |
| 14  | Keyboard nav inside list: Tab → "+ New chat" focused → Tab → first list item focused with visible focus ring; ArrowDown / ArrowUp moves focus; Enter switches; Delete on focused row opens delete-confirm                                   | All             |        |       |
| 15  | Custom events: dispatching `flowise-new-session`, `flowise-switch-session` (with `detail.chatId`), `flowise-clear-chat` from console produces expected store mutations; `flowise-session-changed` fires with `{ chatId, title }` after each | All             |        |       |
| 16  | `multiSession.enabled = false` (or unset) → embed renders identically to pre-feature, no panel, legacy `flowise-clear-chat` listener still wipes the single thread, localStorage shape stays v1                                             | All             |        |       |
| 17  | Reload preserves session state in store mode: messages, active session, titles, panel collapsed/expanded state (full-page only)                                                                                                             | Full            |        |       |
| 18  | Welcome message + starter prompts visible immediately on a fresh session in store mode (regression check from in-test fix)                                                                                                                  | All             |        |       |
| 19  | Input field renders without crashing on empty `activeMessages` (regression check: `getInputDisabled` empty-array guard)                                                                                                                     | All             |        |       |
| 20  | Page unload: `pagehide` / `beforeunload` flushes pending message writes (verify the most-recent token reaches localStorage even if the page is closed mid-debounce)                                                                         | All             |        |       |

## Sign-off

- Author: **\*\*\*\***\_\_**\*\*\*\***
- Reviewer: **\*\***\_\_\_\_**\*\***
- Date: **\*\*\*\***\_\_\_\_**\*\*\*\***

## Known Limitations / Deferred Items (v1)

- **Drawer content fade.** The sidebar `<Show>` unmounts children instantly while the rail width animates for 150ms, leaving a briefly empty shell. UX nice-to-have, not in plan.
- **Popup mode (`Popup.tsx`)** is the JSON-value display popup, not a chat-popup variant. Task 21 verified no `<Bot>` reference exists; nothing to wire.
- **Production embedders need host CSS** for full-page mode: `flowise-fullchatbot { display: block; width: 100%; height: 100vh; }`. The custom element has no built-in `:host { display: block }` rule, so without this the IntersectionObserver in `Full.tsx` never fires. Demo page documents this in `public/index.html`.
- **Pre-existing TypeScript diagnostics** in `Bot.tsx` predate the multi-session feature: Uint8Array/BufferSource type mismatches in TTS code, deprecated `atob` signature, two unused-variable warnings. They are not introduced by this work.
- **Benign Rollup circular-dependency warning** between `Bot.tsx ↔ ChatRoot.tsx`. Reviewer judged it benign — `Bot` is only referenced inside `ChatRoot`'s JSX (lazy at module-eval time), not as a top-level value.
