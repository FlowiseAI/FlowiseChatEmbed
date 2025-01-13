type ChatHistoryStorage = {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
};
export declare class ChatInputHistory {
    private getMaxHistory;
    private storage;
    private history;
    private currentIndex;
    private tempInput;
    private maxHistory;
    constructor(getMaxHistory?: () => number, storage?: ChatHistoryStorage);
    getHistory(): string[];
    getCurrentIndex(): number;
    addToHistory(input: string): void;
    getPreviousInput(currentInput: string): string;
    getNextInput(): string;
    private saveHistory;
    private loadHistory;
}
export {};
//# sourceMappingURL=chatInputHistory.d.ts.map