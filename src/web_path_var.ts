import { registerWebComponents } from './register'
import { parseChatbot, injectChatbotInWindow } from './window'

registerWebComponents()

const chatbot = parseChatbot()

injectChatbotInWindow(chatbot)

const user_id = document.getElementById("realty_ai_script")?.innerText;
console.log(user_id)
console.log("found inner")
console.log(document.currentScript?.innerHTML)
chatbot.init({
    userID: user_id,
    chatflowid: '',
    includeQuestions: false
})

