import { registerWebComponents } from './register'
import { parseChatbot, injectChatbotInWindow } from './window'

registerWebComponents()

const chatbot = parseChatbot()

injectChatbotInWindow(chatbot)

const user_id = document?.currentScript?.getAttribute('userid')!;
console.log(user_id)
chatbot.init({
    userID: user_id,
    chatflowid: '',
    includeQuestions: false
})

