import { messageType } from '@/components/Bot'
import { sendRequest } from '@/utils/index'

export type NewChatMessageInput = {
    chatType: 'external'
    role: messageType
    content: string
    chatflowid: string
    sourceDocuments?: string
}

export type ChatMessageRequest = {
    chatflowid: string
    apiHost?: string
    body?: NewChatMessageInput
}

export const createNewChatmessageQuery = ({ chatflowid, apiHost = 'http://localhost:3000', body }: ChatMessageRequest) => 
    sendRequest<any>({
        method: 'POST',
        url: `${apiHost}/api/v1/chatmessage/${chatflowid}`,
        body
    })