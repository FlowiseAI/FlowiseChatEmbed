import { JSX } from 'solid-js/jsx-runtime';
type SuggestionOverlayInput = {
    ref: HTMLInputElement | undefined;
    onInput: (value: string) => void;
    fontSize?: number;
} & Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'onInput'>;
export declare const SuggestionOverlayInput: (props: SuggestionOverlayInput) => JSX.Element;
export {};
//# sourceMappingURL=SuggestionOverlyInput.d.ts.map