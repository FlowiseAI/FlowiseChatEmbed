import { JSX } from 'solid-js/jsx-runtime';
type ShortTextInputProps = {
    ref: HTMLInputElement | undefined;
    onInput: (value: string) => void;
    fontSize?: number;
} & Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'onInput'>;
export declare const ShortTextInput: (props: ShortTextInputProps) => JSX.Element;
export {};
//# sourceMappingURL=ShortTextInput.d.ts.map