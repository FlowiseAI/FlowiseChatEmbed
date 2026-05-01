import { type ChatflowIndexV2 } from './sessionStorage';
/**
 * Read whatever is at localStorage[chatflowid_EXTERNAL] and return a v2 index.
 * - v2 already → returned as-is.
 * - v1 shape  → wrapped into a single session, written back to storage, returned.
 * - unknown shape → log warning, return a fresh v2 (does not clobber).
 * - missing → fresh v2 with one empty session.
 *
 * Pass `newChatId` so callers can plumb in their `customerId+uuid` prefix.
 */
export declare const loadOrMigrate: (chatflowid: string, newChatId: () => string) => ChatflowIndexV2;
//# sourceMappingURL=sessionMigration.d.ts.map