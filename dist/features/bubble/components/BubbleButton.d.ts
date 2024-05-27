import { ButtonTheme } from '../types';
type Props = ButtonTheme & {
    isBotOpened: boolean;
    toggleBot: () => void;
    setButtonPosition: (position: {
        bottom: number;
        right: number;
    }) => void;
    dragAndDrop: boolean;
};
export declare const BubbleButton: (props: Props) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=BubbleButton.d.ts.map