import { registerWebComponents } from './register';
import { parseChatbot, injectChatbotInWindow } from './window';

registerWebComponents();

const chatbot = parseChatbot();

const createDefaultChatBot = () => {

    function getFromUrlParamOrLocal(key: string): string | null {
        // Assuming you're working with the current page's URL
        const urlParams = new URLSearchParams(window.location.search);
        const value = urlParams.get(key);
        if (value !== null) {
            localStorage.setItem(key, value);
            return value;
        }
        return localStorage.getItem(key);
    }

    function getChatflowDefaultProps(chatflowId: string, apiHost: string) {
        const customerEmail: string | null = getFromUrlParamOrLocal('customerEmail');
        const customerName: string | null = getFromUrlParamOrLocal('customerName');

        let cfg, msg;

        if (customerEmail && customerName) {
            cfg = { // overrideConfig
                "functionInputVariables": {
                    "customerEmail": customerEmail,
                }
            };
            msg = `Ciao ${customerName}! Sono Glowi, il tuo skin coach :). Ho qui il tuo quiz, da dove cominciamo?`;
        } else {
            cfg = {};
            msg = "Ciao! Sono Glowi, il tuo skin coach :) Puoi farmi tutte le domande che vuoi sulla cura della pelle. Da dove cominciamo?";
        }
        return {
            chatflowid: chatflowId,
            apiHost: apiHost,
            chatflowConfig: cfg,
            customerName: customerName,
            customerEmail: customerEmail,
            theme: {
                button: {
                    backgroundColor: "#fecdab",
                    right: 20,
                    bottom: 20,
                    size: "medium",
                    iconColor: "white",
                },
                chatWindow: {
                    welcomeMessage: msg,
                    backgroundColor: "#FFF2E0",
                    fontSize: 16,
                    poweredByTextColor: "#ffffff",
                    title: 'Glowi',
                    titleAvatarSrc: "https://glowi.ai/wp-content/uploads/2023/07/cropped-retouch.png",
                    botMessage: {
                        backgroundColor: "#ffffff",
                        textColor: "#2f4858",
                        showAvatar: false,
                        avatarSrc: "https://glowi.ai/wp-content/uploads/2023/07/cropped-retouch.png",
                    },
                    userMessage: {
                        backgroundColor: "#e5a9a4",
                        textColor: "#ffffff",
                        showAvatar: false,
                    },
                    textInput: {
                        placeholder: "Scrivi qui...",
                        backgroundColor: "#ffffff",
                        textColor: "#2f4858",
                        sendButtonColor: "black",
                    }
                }
            }
        }
    }
    return {
        'init': chatbot.init,
        'initFull': chatbot.initFull,
        'initWithDefaults': (chatflowId: string, apiHost: string) => chatbot.init(getChatflowDefaultProps(chatflowId, apiHost)),
        'initFullWithDefaults': (chatflowId: string, apiHost: string) => chatbot.initFull(getChatflowDefaultProps(chatflowId, apiHost))
    }
}

const bot = createDefaultChatBot();

injectChatbotInWindow(bot);

export default bot;