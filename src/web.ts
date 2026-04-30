import { registerWebComponents } from './register';
import { parseChatbot, injectChatbotInWindow } from './window';
import { titleFromMessage } from './utils/titleFromMessage';

registerWebComponents();

const chatbot = parseChatbot();

injectChatbotInWindow(chatbot);

export default chatbot;
export { titleFromMessage };
