import { ShortTextInput } from './ShortTextInput'
import { SendButton } from '@/components/SendButton'
import { isMobile } from '@/utils/isMobileSignal'
import { createSignal, onMount } from 'solid-js'

type Props = {
    placeholder?: string
    backgroundColor?: string
    textColor?: string
    sendButtonColor?: string
    defaultValue?: string
    onSubmit: (value: string) => void
}

const defaultBackgroundColor = '#ffffff'
const defaultTextColor = '#303235'

export const TextInput = (props: Props) => {
    const [inputValue, setInputValue] = createSignal(props.defaultValue ?? '')
    let inputRef: HTMLInputElement | HTMLTextAreaElement | undefined

    const handleInput = (inputValue: string) => setInputValue(inputValue)

    const checkIfInputIsValid = () => inputValue() !== '' && inputRef?.reportValidity()

    const submit = () => {
        if (checkIfInputIsValid()) props.onSubmit(inputValue())
        setInputValue('')
    }

    const submitWhenEnter = (e: KeyboardEvent) => {
        if (e.key === 'Enter') submit()
    }

    onMount(() => {
        if (!isMobile() && inputRef) inputRef.focus()
    })

    return (
        <div
            class={'flex items-end justify-between pr-2 chatbot-input w-full'}
            data-testid='input'
            style={{
                'border-top': '1px solid #eeeeee',
                width: '90%',
                position: 'absolute',
                bottom: '40px',
                margin: 'auto',
                "z-index": 1000,
                "background-color": props.backgroundColor ?? defaultBackgroundColor,
                color: props.textColor ?? defaultTextColor
            }}
            onKeyDown={submitWhenEnter}
        >
            <ShortTextInput
                ref={inputRef as HTMLInputElement}
                onInput={handleInput}
                value={inputValue()}
                placeholder={props.placeholder ?? 'Type your question'}
            />
            <SendButton sendButtonColor={props.sendButtonColor} type='button' isDisabled={inputValue() === ''} class='my-2 ml-2' on:click={submit}>
                <span style={{ 'font-family': 'Poppins, sans-serif' }}>Send</span>
            </SendButton>
        </div>
    )
}
