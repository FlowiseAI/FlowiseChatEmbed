export declare const isNotDefined: <T>(value: T | null | undefined) => value is null | undefined;
export declare const isDefined: <T>(value: T | null | undefined) => value is NonNullable<T>;
export declare const isEmpty: (value: string | undefined | null) => value is undefined;
export declare const isNotEmpty: (value: string | undefined | null) => value is string;
export declare const sendRequest: <ResponseData>(params: string | {
    url: string;
    method: string;
    body?: Record<string, unknown> | FormData | undefined;
    type?: string | undefined;
    headers?: Record<string, any> | undefined;
    formData?: FormData | undefined;
    onRequest?: ((request: RequestInit) => Promise<void>) | undefined;
    signal?: AbortSignal | undefined;
}) => Promise<{
    data?: ResponseData | undefined;
    error?: Error | undefined;
}>;
/**
 * v1-compatible wrapper. Writes are field-level merges over the v2 index
 * (and active-session messages where applicable), so callers writing
 * `{ lead }` or `{ chatHistory }` don't clobber other v2 fields.
 */
export declare const setLocalStorageChatflow: (chatflowid: string, chatId: string, saveObj?: Record<string, any>) => void;
/**
 * v1-compatible projection. Returns a v1-shaped object derived from the active
 * session of the v2 index, so existing callers (notably the lead-capture path)
 * keep working.
 */
export declare const getLocalStorageChatflow: (chatflowid: string) => any;
export declare const removeLocalStorageChatHistory: (chatflowid: string) => void;
export declare const getBubbleButtonSize: (size: 'small' | 'medium' | 'large' | number | undefined) => number;
export declare const setCookie: (cname: string, cvalue: string, exdays: number) => void;
export declare const getCookie: (cname: string) => string;
export declare const resolveDialogContainer: (raw: unknown) => HTMLElement | undefined;
export declare const getRecordingExtensionForMime: (mime: string) => string;
//# sourceMappingURL=index.d.ts.map