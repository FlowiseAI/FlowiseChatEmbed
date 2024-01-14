import { PeleAIConfig } from '@/features/bubble/types';
type Props = {
    placeholder?: string;
    backgroundColor?: string;
    textColor?: string;
    sendButtonColor?: string;
    defaultValue?: string;
    fontSize?: number;
    disabled?: boolean;
    peleAIConfig?: PeleAIConfig;
    chatId?: string;
    onSubmit: (value: string) => void;
    onUpload: (isSuccess: boolean, message: string) => void;
};
export declare const TextInput: (props: Props) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=TextInput.d.ts.map