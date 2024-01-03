import { registerWebComponents } from './register'
import { parseChatbot, injectChatbotInWindow } from './window'

registerWebComponents()

const chatbot = parseChatbot()

injectChatbotInWindow(chatbot)

// const script_id = document.getElementById("realty_ai")?.getAttribute("data-realityaiid");
const script_id = document.getElementById("realty_ai")?.dataset.realityaiid;
console.log("script_id:"+script_id)
chatbot.init({
    userID: script_id?script_id:"",
    chatflowid: '',
    includeQuestions: false
})

