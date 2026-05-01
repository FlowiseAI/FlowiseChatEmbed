type Props = {
    isFullPage: boolean;
    textColor?: string;
    bubbleBackground?: string;
};
/**
 * Transparent header shown at the top of <Bot> when multiSession is enabled.
 * Replaces the blue title bar + Clear button with a minimal "left-aligned chat
 * name" + click-menu (Star / Rename / Delete) — matching ChatGPT/Claude/Gemini.
 *
 * On non-full-page mounts (bubble/popup drawer mode), a hamburger button on the
 * left toggles the session drawer.
 */
export declare const SessionTitleHeader: (props: Props) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=SessionTitleHeader.d.ts.map