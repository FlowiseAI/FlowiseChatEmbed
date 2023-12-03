
type Props = {
    question: string
    onQuestionClick:(question:string) => void
    leftOffset: string
}

export const QuestionButton = (props:Props) =>{
    
    // compute the left offset
    const leftPosition:string = 'calc(20px + '+props.leftOffset+')'
    return (
            <div
                    class={'flex'}
                    data-testid='input'
                    style={{
                        padding: '5px',
                    }}
                    >
                        <button class={'justify-between question-button'}onClick={()=>{props.onQuestionClick(props.question)}} >
                            {props.question}
                        </button> 
            </div>
    )
};