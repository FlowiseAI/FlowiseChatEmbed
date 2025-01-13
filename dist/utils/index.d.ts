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
}) => Promise<{
    data?: ResponseData | undefined;
    error?: Error | undefined;
}>;
export declare const setLocalStorageChatflow: (chatflowid: string, chatId: string, saveObj?: Record<string, any>) => void;
export declare const getLocalStorageChatflow: (chatflowid: string) => any;
export declare const removeLocalStorageChatHistory: (chatflowid: string) => void;
export declare const getBubbleButtonSize: (size: 'small' | 'medium' | 'large' | number | undefined) => number;
export declare const setCookie: (cname: string, cvalue: string, exdays: number) => void;
export declare const getCookie: (cname: string) => string;
//# sourceMappingURL=index.d.ts.map