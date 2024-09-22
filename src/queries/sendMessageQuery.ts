import { MessageType } from '@/components/Bot'
import { sendRequest } from '@/utils/index'

export type IncomingInput = {
    question: string
    history: MessageType[]
    overrideConfig?: Record<string, unknown>
    socketIOClientId?: string
    page_url?: string
}

export type MessageRequest = {
    chatflowid: string
    apiHost?: string
    body?: IncomingInput
}

export type ConvoMesssage = {
    text: string,
    type: string,
    timestamp: string
}

export type ConvoType = {
    messages: Array<ConvoMesssage>,
    realtor_id: string,
    load_id:string
}

export const sendMessageQuery = ({ chatflowid, apiHost = 'http://localhost:3000', body }: MessageRequest) =>
    sendRequest<any>({
        method: 'POST',
        url: `${apiHost}/api/v1/prediction/${chatflowid}`,
        body
    })


export const sendLogConvoQuery = (convo: ConvoType) =>
    sendRequest<any>({
        method: 'POST',
        url: "https://kqg01i5ba6.execute-api.us-east-2.amazonaws.com/default/message_collector",
        body:convo
    })

export const isStreamAvailableQuery = ({ chatflowid, apiHost = 'http://localhost:3000' }: MessageRequest) =>
    sendRequest<any>({
        method: 'GET',
        url: `${apiHost}/api/v1/chatflows-streaming/${chatflowid}`,
    })
