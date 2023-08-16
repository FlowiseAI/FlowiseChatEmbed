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

export type PostChatMessageRequest = {
    chatflowid: string
    apiHost?: string
    body?: NewChatMessageInput
}

export type ChatMessageRequest = {
    chatflowid: string
    apiHost?: string
    chatId?: string
}

export type PutChatMessageInput = {
    chatflowId: string,
    chatId?: string,
    sessionId: string
}

export type PutChatMessageRequest = {
    apiHost?: string
    body?: PutChatMessageInput
}


export const createNewChatMessageQuery = ({ chatflowid, apiHost = 'http://localhost:3000', body }: PostChatMessageRequest) =>
    sendRequest<any>({
        method: 'POST',
        url: `${apiHost}/api/v1/chatmessage/${chatflowid}`,
        body
    })

export const getChatMessageQuery = ({ chatflowid, apiHost = 'http://localhost:3000', chatId }: ChatMessageRequest) =>
    sendRequest<any>({
        method: 'GET',
        url: `${apiHost}/api/v1/chatmessage/${chatflowid}/${chatId}`
    })

export const updateChatMessageQuery = ({ apiHost = 'http://localhost:3000', body }: PutChatMessageRequest) =>
    sendRequest<any>({
        method: 'PUT',
        url: `${apiHost}/api/v1/chatmessage/`,
        body
    })

export const deleteChatMessageQuery = ({ chatflowid, apiHost = 'http://localhost:3000', chatId }: ChatMessageRequest) =>
    sendRequest<any>({
        method: 'DELETE',
        url: `${apiHost}/api/v1/chatmessage/${chatflowid}/${chatId}`
    })