/* eslint-disable solid/reactivity */
import { sendRequest, getCookie, setCookie} from '@/utils/index'
import isMobileCheck from './utils/isMobileCheck'
type BotProps = {
    chatflowid: string
    includeQuestions: boolean
    loadID?: string,
    userID?: string,
    defaultOpenDesktop?:boolean,
    defaultOpenMobile?:boolean,
    delayOpenFlag?: boolean, 
    delayOpenSeconds?:number,
    stayClosedFlag?:boolean,
    apiHost?: string
    chatflowConfig?: Record<string, unknown>
    theme?:Record<string, unknown>
    questions?:Array<string>
    maxPopups?:number
    mobileQuestionFontSize?: string
    desktopQuestionFontSize?: string,
    badgeText?:string,
}

const version = "realty-ai-bot-version:1.4"
export const initFull = (props: BotProps & { id?: string }) => {
    console.log(version)
    const data = sendRequest<any>({
        method: 'GET',
        url: `https://vshdvtqafk.execute-api.us-east-2.amazonaws.com/default/user_config_api/?username=`+props.userID,
    }).then((response) => {response.data
        const config_data = JSON.parse(response.data?.body)
        props.theme = config_data?.theme;
        props.chatflowid = config_data?.chatflowid;
        props.apiHost = config_data?.apiHost;
        props.includeQuestions = config_data?.includeQuestions;
        props.defaultOpenDesktop = config_data?.defaultOpenDesktop
        props.defaultOpenMobile = config_data?.defaultOpenMobile
        props.delayOpenSeconds = config_data?.delayOpenSeconds
        props.delayOpenFlag = config_data?.delayOpenFlag
        props.loadID = config_data?.load_id ? config_data?.load_id :""
        props.stayClosedFlag = config_data?.stayClosedFlag
        props.questions = config_data?.questions
        props.badgeText = config_data?.badgeText
        const fullElement = props.id
        ? document.getElementById(props.id)
        : document.querySelector('flowise-fullchatbot-parent')

        
        if (!fullElement) throw new Error('<flowise-fullchatbot> element not found.')
        const element = document.createElement('flowise-fullchatbot')
        Object.assign(element, props)
        fullElement.appendChild(element)
        
    });
}


export const init = async (props: BotProps) => {
    console.log(version)
    const data = sendRequest<any>({
        method: 'GET',
        url: `https://vshdvtqafk.execute-api.us-east-2.amazonaws.com/default/user_config_api/?username=`+props.userID,
    }).then((response) => {
        const config_data = JSON.parse(response.data.body)
        props.theme = config_data?.theme;
        props.chatflowid = config_data?.chatflowid;
        props.apiHost = config_data?.apiHost;
        props.includeQuestions = config_data?.includeQuestions;
        // props.isOpen = window?.innerWidth ? (window?.innerWidth > 1000): false;

        props.defaultOpenDesktop = config_data?.defaultOpenDesktop
        props.defaultOpenMobile = config_data?.defaultOpenMobile
        props.delayOpenSeconds = config_data?.delayOpenSeconds
        props.delayOpenFlag = config_data?.delayOpenFlag
        props.loadID = config_data?.load_id ? config_data?.load_id :""
        props.stayClosedFlag = config_data?.stayClosedFlag
        props.questions = config_data?.questions
        props.maxPopups = config_data?.maxPopups ? config_data?.maxPopups : 0
        

        props.mobileQuestionFontSize = config_data?.mobileQuestionFontSize ? config_data?.mobileQuestionFontSize : "10px"
        props.desktopQuestionFontSize = config_data?.desktopQuestionFontSize ? config_data?.desktopQuestionFontSize : "20px"
        props.badgeText = config_data?.badgeText
        
        const isMobile = isMobileCheck()
        
        const noMobile = config_data?.noMobile
        
        console.log("no mobile:",noMobile,"is mobile:",isMobile)
        if(isMobile && noMobile){
            return 
        } 


        // props.isOpen = props.isOpen || default_open
        const element = document.createElement('flowise-chatbot')
        Object.assign(element, props)
        document.body.appendChild(element)
        
    });
    // TODO: need to add error checking and handling 
}

type Chatbot = {
    initFull: typeof initFull
    init: typeof init
}

declare const window:
    | {
          Chatbot: Chatbot | undefined
          innerWidth: number
      }
    | undefined

export const parseChatbot = () => ({
    initFull,
    init
})

export const injectChatbotInWindow = (bot: Chatbot) => {
    if (typeof window === 'undefined') return
    window.Chatbot = { ...bot }
}
