import { registerWebComponents } from './register';
import { parseChatbot, injectChatbotInWindow } from './window';
import 'popper.js/dist/umd/popper.js';
registerWebComponents();

const chatbot = parseChatbot();

injectChatbotInWindow(chatbot);

export default chatbot;
