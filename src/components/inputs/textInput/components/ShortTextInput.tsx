/*import { splitProps } from 'solid-js'
import { JSX } from 'solid-js/jsx-runtime'

type ShortTextInputProps = {
    ref: HTMLTextAreaElement | undefined
    onInput: (value: string) => void
    fontSize?: number
} & Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onInput'>

export const ShortTextInput = (props: ShortTextInputProps) => {
    const [local, others] = splitProps(props, ['ref', 'onInput'])

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault()
            e.stopPropagation() // Add this line to stop the event from bubbling up
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
            rows={1}  // Set the textarea height to 1 line
            onInput={(e) => local.onInput(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            {...others}
        />
    )
}
*/

import { onCleanup } from 'solid-js'
import { splitProps } from 'solid-js'
import { JSX } from 'solid-js/jsx-runtime'

type ShortTextInputProps = {
    ref: HTMLTextAreaElement | undefined
    onInput: (value: string) => void
    fontSize?: number
} & Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onInput'>

export const ShortTextInput = (props: ShortTextInputProps) => {
    const [local, others] = splitProps(props, ['ref', 'onInput'])

    const adjustHeight = (element: HTMLTextAreaElement) => {
        element.style.height = 'auto'  // Reset the height 
        element.style.height = element.scrollHeight + 'px'  // Set it to scrollHeight
    }

    const handleInput = (e: Event) => {
        const textarea = e.currentTarget as HTMLTextAreaElement
        adjustHeight(textarea)
        local.onInput(textarea.value)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault()
            e.stopPropagation() // Add this line to stop the event from bubbling up
            const textarea = e.currentTarget as HTMLTextAreaElement
            const cursorPosition = textarea.selectionStart
            textarea.value = textarea.value.substring(0, cursorPosition) + '\n' + textarea.value.substring(cursorPosition)
            textarea.selectionStart = cursorPosition + 1
            textarea.selectionEnd = cursorPosition + 1
            adjustHeight(e.currentTarget as HTMLTextAreaElement)
        }
    }

    onCleanup(() => {
        if (props.ref) {
            props.ref.removeEventListener('input', handleInput as any)
        }
    })

    return (
        <textarea
            ref={props.ref}
            class='focus:outline-none bg-transparent px-4 py-4 flex-1 w-full text-input'
            style={{ 'font-size': props.fontSize ? `${props.fontSize}px` : '16px' }}
            rows={1}  // Set the textarea height to 1 line
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            {...others}
        />
    )
}
