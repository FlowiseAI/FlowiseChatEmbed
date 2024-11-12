// src/utils/chatInputHistory.ts
type ChatHistoryStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export class ChatInputHistory {
  private history: string[] = [];
  private currentIndex = -1;
  private tempInput = '';
  private maxHistory: number;

  constructor(
    private getMaxHistory: () => number = () => 10,
    private storage: ChatHistoryStorage = localStorage,
  ) {
    this.maxHistory = this.getMaxHistory() ?? 10;
    this.loadHistory();
  }

  getHistory(): string[] {
    return this.history;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  addToHistory(input: string): void {
    if (!input.trim()) return;

    // Don't add duplicate consecutive entries
    if (this.history[0] !== input) {
      this.history.unshift(input);
      if (this.history.length > this.maxHistory) {
        this.history.pop();
      }
    }

    this.currentIndex = -1;
    this.saveHistory();
  }

  getPreviousInput(currentInput: string): string {
    if (this.currentIndex === -1) {
      this.tempInput = currentInput;
    }

    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return this.history[this.currentIndex] || this.tempInput;
  }

  getNextInput(): string {
    if (this.currentIndex > -1) {
      this.currentIndex--;
      if (this.currentIndex === -1) {
        return this.tempInput;
      }
      return this.history[this.currentIndex];
    }
    return this.tempInput;
  }

  private saveHistory(): void {
    try {
      this.storage.setItem('chatInputHistory', JSON.stringify(this.history));
    } catch (error: unknown) {
      console.warn('Failed to save chat history to localStorage:', error instanceof Error ? error.message : error);
    }
  }

  private loadHistory(): void {
    try {
      const saved = this.storage.getItem('chatInputHistory');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.history = Array.isArray(parsed) ? parsed : [];
      }
    } catch (error: unknown) {
      console.warn('Failed to load chat history from localStorage:', error instanceof Error ? error.message : error);
    }
  }
}
