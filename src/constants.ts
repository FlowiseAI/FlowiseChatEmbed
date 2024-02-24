import type { BubbleProps } from './features/bubble'

export const defaultBotProps: BubbleProps = {
    chatflowid: '',
    includeQuestions: false,
    apiHost: undefined,
    chatflowConfig: undefined,
    theme: undefined,
    defaultOpenDesktop:false,
    defaultOpenMobile:false,
    delayOpenFlag: true, 
    delayOpenSeconds:10
}
