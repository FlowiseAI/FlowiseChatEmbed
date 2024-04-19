import { JSX } from 'solid-js';
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

        let cfg, msg: JSX.Element;

        if (customerEmail && customerName) {
            cfg = { // overrideConfig
                "functionInputVariables": {
                    "customerEmail": customerEmail,
                }
            };
            msg = `Ciao ${customerName} :) sono l'assistente virtuale di @holidoit! Come posso aiutarti oggi?`;
        } else {
            cfg = {};
            msg = "🎉 Ciao, avventuriero digitale! 🌍 Sono Twini, il gemello digitale di <a href='https://instgram.com/holidoit'>@holidoit</a>, pronto a svelarti i segreti delle esperienze online più coinvolgenti e dei contenuti social più freschi! 📸✨ <br>Che tu sia qui per un corso di cucina tailandese o un tour virtuale delle piramidi, sono pronto a rendere il tuo viaggio incredibilmente divertente! 🚀💻<br>Pronto a iniziare l'avventura? Scrivimi cosa ti interessa e... partiamo! 🎈<br><br>Per scoprire di più, visita il nostro sito <a href='https://holidoit.com'>holidoit.com</a> e lasciati ispirare!";
        }
        return {
            chatflowid: chatflowId,
            apiHost: apiHost,
            chatflowConfig: cfg,
            customerName: customerName,
            customerEmail: customerEmail,
            theme: {
                button: {
                    backgroundColor: "#efedff",
                    right: 20,
                    bottom: 20,
                    size: "medium",
                    iconColor: "white",
                    bubbleButtonColor: "#050a30",
                    topbarColor: "#33365e",
                },
                chatWindow: {
                    welcomeMessage: msg,
                    starterPrompts: [
                        "Ciao! Mi consigli un'esperienza in Liguria?",
                        "Hey, Cosa posso fare di bello a Milano?",
                        "Dove posso andare in vacanza in Italia?",
                    ],
                    backgroundColor: "#efedff",
                    fontSize: 16,
                    poweredByTextColor: "#ffffff",
                    title: '@holidoit',
                    titleAvatarSrc: "/public/avatars/holidoit.jpg",
                    titleColor: "#ffffff",
                    botMessage: {
                        backgroundColor: "#ffefca",
                        textColor: "#283E4D",
                        avatarSrc: "/public/avatars/holidoit.jpg",
                        showAvatar: true,
                    },
                    userMessage: {
                        backgroundColor: "#ffffff",
                        textColor: "#283E4D",
                        showAvatar: false,
                    },
                    textInput: {
                        backgroundColor: "#ffffff",
                        textColor: "#283E4D",
                        placeholder: "Scrivi qui...",
                        sendButtonColor: "#7f7970",
                    },
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