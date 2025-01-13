import { Setter } from 'solid-js';
import { FileEvent, UploadsConfig } from '@/components/Bot';
type TextInputProps = {
    placeholder?: string;
    backgroundColor?: string;
    textColor?: string;
    sendButtonColor?: string;
    inputValue: string;
    fontSize?: number;
    disabled?: boolean;
    onSubmit: (value: string) => void;
    onInputChange: (value: string) => void;
    uploadsConfig?: Partial<UploadsConfig>;
    isFullFileUpload?: boolean;
    setPreviews: Setter<unknown[]>;
    onMicrophoneClicked: () => void;
    handleFileChange: (event: FileEvent<HTMLInputElement>) => void;
    maxChars?: number;
    maxCharsWarningMessage?: string;
    autoFocus?: boolean;
    sendMessageSound?: boolean;
    sendSoundLocation?: string;
    enableInputHistory?: boolean;
    maxHistorySize?: number;
};
export declare const TextInput: (props: TextInputProps) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=TextInput.d.ts.map