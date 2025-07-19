/**
 * Fetch chat history from the Flowise API by chatId.
 * @param {string} apiHost - The base URL of the Flowise API.
 * @param {string} chatId - The unique identifier of the chat session.
 * @returns {Promise<any[] | null>} - Returns the chat history array if successful, or null if an error occurs.
 */
export declare const fetchChatHistory: (apiHost: string, chatId: string) => Promise<any[] | null>;
//# sourceMappingURL=fetchChatHistory.d.ts.map