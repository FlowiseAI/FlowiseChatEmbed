import { Setter } from 'solid-js';
import { UploadsConfig } from '@/components/Bot';
type Props = {
    placeholder?: string;
    backgroundColor?: string;
    textColor?: string;
    sendButtonColor?: string;
    defaultValue?: string;
    fontSize?: number;
    disabled?: boolean;
    onSubmit: (value: string) => void;
    uploadsConfig?: Partial<UploadsConfig>;
    setPreviews: Setter<unknown[]>;
    onMicrophoneClicked: () => void;
};
export declare const TextInput: (props: Props) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=TextInput.d.ts.map