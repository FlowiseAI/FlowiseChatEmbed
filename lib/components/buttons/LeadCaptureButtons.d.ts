import { JSX } from 'solid-js';
type LeadCaptureButtonProps = {
    buttonColor?: string;
    isDisabled?: boolean;
    isLoading?: boolean;
    disableIcon?: boolean;
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;
export declare const CancelLeadCaptureButton: (props: LeadCaptureButtonProps) => JSX.Element;
export declare const SaveLeadButton: (props: LeadCaptureButtonProps) => JSX.Element;
export {};
//# sourceMappingURL=LeadCaptureButtons.d.ts.map