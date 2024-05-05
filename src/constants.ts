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
    questions: [],
    maxPopups: 0,
    mobileQuestionFontSize: '10px',
    desktopQuestionFontSize: '12px'
}
