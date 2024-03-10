import type { BubbleProps } from './features/bubble'

export const defaultBotProps: BubbleProps = {
    chatflowid: '',
    loadID: '',
    userID: '',
    includeQuestions: false,
    apiHost: undefined,
    chatflowConfig: undefined,
    theme: undefined,
    defaultOpenDesktop:false,
    defaultOpenMobile:false,
    delayOpenFlag: true, 
    delayOpenSeconds:10,
    stayClosedFlag: false,
    fullScreen: false,
}
