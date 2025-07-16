import { registerWebComponents } from './register';
import { parseChatbot, injectChatbotInWindow } from './window';

// Log version to console for debugging and support
console.log(`🤖 Flowise Chat Embed v${__VERSION__}`);

registerWebComponents();

const chatbot = parseChatbot();

injectChatbotInWindow(chatbot);

export default chatbot;
