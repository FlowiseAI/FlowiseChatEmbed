// Import onCleanup is added by AIT. See code below...
import { onCleanup } from 'solid-js'
import { splitProps } from 'solid-js'
import { JSX } from 'solid-js/jsx-runtime'

type ShortTextInputProps = {
    ref: HTMLTextAreaElement | undefined
    onInput: (value: string) => void
    fontSize?: number
    disabled?: boolean
} & Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onInput'>

export const ShortTextInput = (props: ShortTextInputProps) => {
    const [local, others] = splitProps(props, ['ref', 'onInput'])

// AIT replaced "HTMLInputElement" with "HTMLTextAreaElement" and adjust some stuff to add multiline and dynamic height capabilities
// This const is added by AIT to handle dynamic height of text input area

    const adjustHeight = (element: HTMLTextAreaElement) => {
        const singleLineHeight = parseFloat(getComputedStyle(element).lineHeight)
        const maxHeight = singleLineHeight * 7 // AIT: max 7 lines before stopping height increase

        element.style.height = 'auto'  // Reset the height
        element.style.height = Math.min(element.scrollHeight, maxHeight) + 'px'  // Set it to the smaller of scrollHeight and maxHeight
    }

// This const is added by AIT to handle dynamic height of text input area
    const handleInput = (e: Event) => {
        const textarea = e.currentTarget as HTMLTextAreaElement
        adjustHeight(textarea)
        local.onInput(textarea.value)
    }

// This const is added by AIT to handle Shift Inputs for Line Break
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

// This is added by AIT to remove event listener when ShortTextInput is removed from page. Just to make sure...
    onCleanup(() => {
        if (props.ref) {
            props.ref.removeEventListener('input', handleInput as any)
        }
    })

    return (
        <textarea // AIT: Replace "input" with "textarea"
            ref={props.ref}
            class='focus:outline-none bg-transparent px-4 py-4 flex-1 w-full text-input disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100'
            //type='text' // AIT: Not needed
            //disabled={props.disabled} // AIT: Not needed
            style={{ 'font-size': props.fontSize ? `${props.fontSize}px` : '16px' }}
            rows={1}  // Set the textarea height to 1 line
            // onInput={(e) => local.onInput(e.currentTarget.value)} // AIT: Not needed
            onInput={handleInput}
            onKeyDown={handleKeyDown} // AIT: To check for Shift Key
            {...others}
        />
    )
}
