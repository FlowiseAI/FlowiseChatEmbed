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
                    backgroundColor: "#FFF2E0",
                    right: 20,
                    bottom: 20,
                    size: "medium",
                    iconColor: "white",
                    bubbleButtonColor: "#fdcdab",
                    topbarColor: "#fff1e0",
                },
                chatWindow: {
                    welcomeMessage: msg,
                    backgroundColor: "#FFF2E0",
                    fontSize: 16,
                    poweredByTextColor: "#ffffff",
                    title: 'GLOWI',
                    titleColor: "black",
                    botMessage: {
                        backgroundColor: "#ffffff",
                        textColor: "#283E4D",
                    },
                    userMessage: {
                        backgroundColor: "#fdcdab",
                        textColor: "#283E4D",
                        showAvatar: false,
                    },
                    textInput: {
                        backgroundColor: "#ffffff",
                        textColor: "#283E4D",
                        placeholder: "Scrivi qui...",
                        sendButtonColor: "#7f7970",
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