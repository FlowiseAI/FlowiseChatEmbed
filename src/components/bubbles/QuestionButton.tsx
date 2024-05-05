import isMobileCheck from "@/utils/isMobileCheck";
import { Show } from "solid-js";

type Props = {
    question: string
    onQuestionClick:(question:string) => void
    leftOffset: string
    desktopQuestionFontSize: string
    mobileQuestionFontSize: string
}

export const QuestionButton = (props:Props) =>{
    
    // compute the left offset

    const isMobile = isMobileCheck()
    const leftPosition:string = 'calc(20px + '+props.leftOffset+')'


    return (
            <div
                    class={'flex'}
                    data-testid='input'
                    style={{
                        padding: '5px',
                    }}
                    >
                    
                <Show when={isMobile}>
                            <button class={'justify-between question-button-mobile'} style = {{'font-size':props.mobileQuestionFontSize}} onClick={()=>{props.onQuestionClick(props.question)}} >
                                {props.question}
                            </button> 
                </Show>
                <Show when={!isMobile}>
                            <button class={'justify-between question-button-desktop'} style = {{'font-size':props.desktopQuestionFontSize}} onClick={()=>{props.onQuestionClick(props.question)}} >
                                {props.question}
                            </button> 
                </Show>
            </div>
    )
};