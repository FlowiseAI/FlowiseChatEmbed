import { registerWebComponents } from './register';
import { parseChatbot, injectChatbotInWindow } from './window';
import { debugLogger } from './utils/debugLogger';

// Log version to console for debugging and support
console.log(`🤖 Flowise Chat Embed v${__VERSION__}`);

// Expose global debug controls
declare global {
  interface Window {
    FlowiseDebug: {
      enable: () => void;
      disable: () => void;
      isEnabled: () => boolean;
    };
  }
}

window.FlowiseDebug = {
  enable: () => debugLogger.enable(),
  disable: () => debugLogger.disable(),
  isEnabled: () => debugLogger.isEnabled()
};

registerWebComponents();

const chatbot = parseChatbot();

injectChatbotInWindow(chatbot);

export default chatbot;
