import { JSX } from 'solid-js/jsx-runtime';
type ShortTextInputProps = {
    ref?: (el: HTMLTextAreaElement) => void;
    onInput: (value: string) => void;
    fontSize?: number;
    disabled?: boolean;
    value: string;
    placeholder?: string;
} & Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onInput'>;
export declare const ShortTextInput: (props: ShortTextInputProps) => JSX.Element;
export {};
//# sourceMappingURL=ShortTextInput.d.ts.map