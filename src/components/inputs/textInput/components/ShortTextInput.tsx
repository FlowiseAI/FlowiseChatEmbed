// Import onCleanup is added by Andy. See code below...
import { onCleanup } from 'solid-js'
import { splitProps } from 'solid-js'
import { JSX } from 'solid-js/jsx-runtime'

// Andy replaced "HTMLInputElement" with "HTMLTextAreaElement" and adjust some stuff
// to add multiline and dynamic height capabilities
type ShortTextInputProps = {
    ref: HTMLTextAreaElement | undefined
    onInput: (value: string) => void
    fontSize?: number
} & Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onInput'>

export const ShortTextInput = (props: ShortTextInputProps) => {
    const [local, others] = splitProps(props, ['ref', 'onInput'])

// This const is added by Andy to handle dynamic height of text input area
    
    //This is old. Andy added a new const adjustHeight below to set the max height of the text input area
    /*const adjustHeight = (element: HTMLTextAreaElement) => {
        element.style.height = 'auto'  // Reset the height 
        element.style.height = element.scrollHeight + 'px'  // Set it to scrollHeight
    }
    */
    
    const adjustHeight = (element: HTMLTextAreaElement) => {
        const singleLineHeight = parseFloat(getComputedStyle(element).lineHeight)
        const maxHeight = singleLineHeight * 4 // for 4 lines

        element.style.height = 'auto'  // Reset the height
        element.style.height = Math.min(element.scrollHeight, maxHeight) + 'px'  // Set it to the smaller of scrollHeight and maxHeight
    }

// This const is added by Andy to handle dynamic height of text input area
    const handleInput = (e: Event) => {
        const textarea = e.currentTarget as HTMLTextAreaElement
        adjustHeight(textarea)
        local.onInput(textarea.value)
    }

// This const is added by Andy to handle Shift Inputs for Line Break
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

// This const is added by Andy to remove event listener when ShortTextInput is removed from page. Just to make sure...
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
