import { Accessor, Setter } from 'solid-js';
import { FeedbackType } from '@/models/giveFeedback';
type Props = {
    message: string;
    giveFeedBack: Accessor<FeedbackType>;
    setGiveFeedBack: Setter<FeedbackType>;
    apiHost?: string;
    fileAnnotations?: any;
    showAvatar?: boolean;
    avatarSrc?: string;
    backgroundColor?: string;
    textColor?: string;
};
export declare const BotBubble: (props: Props) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=BotBubble.d.ts.map