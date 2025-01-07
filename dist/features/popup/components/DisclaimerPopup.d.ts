export type DisclaimerPopupProps = {
    isOpen?: boolean;
    isFullPage?: boolean;
    onAccept?: () => void;
    onDeny?: () => void;
    title?: string;
    message?: string;
    buttonText?: string;
    denyButtonText?: string;
    blurredBackgroundColor?: string;
    backgroundColor?: string;
    buttonColor?: string;
    textColor?: string;
    buttonTextColor?: string;
    denyButtonBgColor?: string;
};
export declare const DisclaimerPopup: (props: DisclaimerPopupProps) => import("solid-js").JSX.Element;
//# sourceMappingURL=DisclaimerPopup.d.ts.map