import { JSX } from 'solid-js/jsx-runtime';
type ShortTextInputProps = {
    ref: HTMLInputElement | HTMLTextAreaElement | undefined;
    onInput: (value: string) => void;
    fontSize?: number;
    disabled?: boolean;
} & Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onInput'>;
export declare const ShortTextInput: (props: ShortTextInputProps) => JSX.Element;
export {};
//# sourceMappingURL=ShortTextInput.d.ts.map