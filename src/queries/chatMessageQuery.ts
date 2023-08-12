import { messageType } from '@/components/Bot'
import { sendRequest } from '@/utils/index'

export type NewChatMessageInput = {
    chatType: 'external'
    role: messageType
    content: string
    chatflowid: string
    sourceDocuments?: string
    chatId?: string
}

export type ChatMessageRequest = {
    chatflowid: string
    apiHost?: string
    body?: NewChatMessageInput
}

export type ChatMessageRequest1 = {
    chatflowid: string
    apiHost?: string
    chatId?: string
}


export const createNewChatMessageQuery = ({ chatflowid, apiHost = 'http://localhost:3000', body }: ChatMessageRequest) =>
    sendRequest<any>({
        method: 'POST',
        url: `${apiHost}/api/v1/chatmessage/${chatflowid}`,
        body
    })

export const getChatMessageQuery = ({ chatflowid, apiHost = 'http://localhost:3000', chatId }: ChatMessageRequest1) =>
    sendRequest<any>({
        method: 'GET',
        url: `${apiHost}/api/v1/chatmessage/${chatflowid}/${chatId}`
    })