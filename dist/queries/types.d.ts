import { FetchEventSourceInit } from '@microsoft/fetch-event-source';
export type OnRequest = ((request: RequestInit | FetchEventSourceInit) => Promise<void>) | undefined;
export type BaseRequest = {
    apiHost?: string;
    onRequest: OnRequest;
};
//# sourceMappingURL=types.d.ts.map