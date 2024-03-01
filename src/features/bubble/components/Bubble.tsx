import { createSignal, Show, splitProps, onMount, createEffect } from 'solid-js'
import styles from '../../../assets/index.css'
import { BubbleButton } from './BubbleButton'
import { BubbleParams } from '../types'
import { Bot, BotProps } from '../../../components/Bot'
import { getCookie } from '@/utils/index'
import isMobileCheck from '@/utils/isMobileCheck'
export type BubbleProps = BotProps & BubbleParams

export const Bubble = (props: BubbleProps) => {
    const [bubbleProps] = splitProps(props, ['theme'])
    //check cookie for how many times the site as been loaded
    // const numLoadedCookie: string =  getCookie("numLoadedChat");
    // let numLoaded: number  = parseInt(numLoadedCookie);
    // numLoaded = numLoaded ? numLoaded : 0; 
    
    

    //const isMobile =  window?.innerWidth ? (window?.innerWidth < 1000): false;
    const isMobile = isMobileCheck()
    console.log("is mobile",isMobile)
    const height_calc = isMobile? "calc(min(300px, max(100% - 100px,250px)))" : "calc(min(500px, max(100% - 100px,300px)))"
    
    const defaultOpen = isMobile? props.defaultOpenMobile : props.defaultOpenDesktop
    


    //isOpen = false
    const [isBotOpened, setIsBotOpened] = createSignal(defaultOpen)
    const [isBotStarted, setIsBotStarted] = createSignal(defaultOpen)
    const [isVisible,setIsVisible] = createSignal(true)
    const [visibleCount,setVisibleCount] = createSignal(0)
    const [hasClosed,setHasClosed] = createSignal(false)

    const openBot = () => {
        if (!isBotStarted()) setIsBotStarted(true)
        setIsBotOpened(true)
    }

    const timedOpenBot = () => {
        console.log("Timed Open")
        if ((!isBotOpened()) && (!hasClosed())){
            openBot()
        }
    }


    if (props.delayOpenFlag){
        setTimeout(timedOpenBot,props.delayOpenSeconds*1000) //convert to mills
    }



    const closeBot = () => {
        setIsBotOpened(false)
        setHasClosed(true)
    }

    const toggleBot = () => {
        isBotOpened() ? closeBot() : openBot();
        setVisibleCount(0);
    }


    // check if visibility is changing and update count
    const updateVisible = () =>{
        setIsVisible(document.visibilityState === 'visible')
        if (isVisible() ===(document.visibilityState === 'visible')){
            setVisibleCount((x)=>  Math.min(x + 1, 3))
        }
    }
    // event listener for changes in visibility
    document.addEventListener("visibilitychange",updateVisible)

    // if count is creater than two ie switched tabs twice then close bot window
    createEffect(() =>{ 
        if(visibleCount() > 2 ){
            // console.log("closed window because of toggling tab");
            closeBot();
        }
    })

    
    return (
        <>
            <style>{styles}</style>
            <>
                <link rel="icon" href="data:,"/>
            </>
            <BubbleButton {...bubbleProps.theme?.button} toggleBot={toggleBot} isBotOpened={isBotOpened()} />
            <div
                part='bot' //ADD CHANGE TO HIGH LINE BASED ON IS MOBILE 
                style={{
                    height: bubbleProps.theme?.chatWindow?.height ? `${bubbleProps.theme?.chatWindow?.height.toString()}px` : height_calc,
                    transition: 'transform 200ms cubic-bezier(0, 1.2, 1, 1), opacity 150ms ease-out',
                    'transform-origin': 'bottom right',
                    transform: isBotOpened() ? 'scale3d(1, 1, 1)' : 'scale3d(0, 0, 1)',
                    'box-shadow': 'rgb(0 0 0 / 16%) 0px 5px 40px',
                    'background-color': bubbleProps.theme?.chatWindow?.backgroundColor || '#ffffff',
                    'z-index': 42424242
                }}
                class={
                    `fixed sm:right-5 rounded-lg w-full sm:w-[400px] max-h-[704px]` +
                    (isBotOpened()? ' opacity-1' : ' opacity-0 pointer-events-none') +
                    (props.theme?.button?.size === 'large' ? ' bottom-24' : ' bottom-20')
                }
            >
                <Show when={isBotStarted()}>
                    <Bot
                        badgeBackgroundColor={bubbleProps.theme?.chatWindow?.backgroundColor}
                        welcomeMessage={bubbleProps.theme?.chatWindow?.welcomeMessage}
                        poweredByTextColor={bubbleProps.theme?.chatWindow?.poweredByTextColor}
                        textInput={bubbleProps.theme?.chatWindow?.textInput}
                        botMessage={bubbleProps.theme?.chatWindow?.botMessage}
                        userMessage={bubbleProps.theme?.chatWindow?.userMessage}
                        fontSize={bubbleProps.theme?.chatWindow?.fontSize}
                        chatflowid={props.chatflowid}
                        chatflowConfig={props.chatflowConfig}
                        apiHost={props.apiHost} 
                        closeBoxFunction={closeBot}
                        includeQuestions={props.includeQuestions}
                        fullScreen = {false}
                        userID = {props.userID}
                        loadID = {props.loadID}
                        />

                </Show>
            </div>
        </>
    )
}
