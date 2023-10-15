import { splitProps } from 'solid-js'
import { JSX } from 'solid-js/jsx-runtime'

type ShortTextInputProps = {
    ref: HTMLTextAreaElement | undefined
    onInput: (value: string) => void
    fontSize?: number
} & Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onInput'>

export const ShortTextInput = (props: ShortTextInputProps) => {
    const [local, others] = splitProps(props, ['ref', 'onInput'])

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key == 'Enter' && !e.shiftKey) {
            e.preventDefault()
            const textarea = e.currentTarget as HTMLTextAreaElement
            const cursorPosition = textarea.selectionStart
            textarea.value = textarea.value.substring(0, cursorPosition) + '\n' + textarea.value.substring(cursorPosition)
            textarea.selectionStart = cursorPosition + 1
            textarea.selectionEnd = cursorPosition + 1
        }
    }

    return (
        <textarea
            ref={props.ref}
            class='focus:outline-none bg-transparent px-4 py-4 flex-1 w-full text-input'
            style={{ 'font-size': props.fontSize ? `${props.fontSize}px` : '16px' }}
            rows={3}  // Set the textarea to always display 3 lines
            onInput={(e) => local.onInput(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            {...others}
        />
    )
}