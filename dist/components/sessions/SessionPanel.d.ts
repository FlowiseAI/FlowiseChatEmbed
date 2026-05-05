import { type JSX } from 'solid-js';
import type { SessionStore } from '@/state/sessionStore';
type SessionPanelTheme = {
    width?: string | number;
    collapsedWidth?: string | number;
    backgroundColor?: string;
    textColor?: string;
    activeBackgroundColor?: string;
    activeTextColor?: string;
    hoverBackgroundColor?: string;
    borderColor?: string;
    newChatButtonColor?: string;
    newChatButtonTextColor?: string;
    newChatLabel?: string;
    emptyStateText?: string;
    capWarningText?: string;
    quotaPanicText?: string;
};
type Props = {
    store: SessionStore;
    isFullPage: boolean;
    isDrawer: boolean;
    drawerOpen?: () => boolean;
    onDrawerClose?: () => void;
    panelTheme?: SessionPanelTheme;
    chatWindowBackground?: string;
    chatWindowText?: string;
    chatBrandColor: string;
};
export declare const SessionPanel: (props: Props) => JSX.Element;
export {};
//# sourceMappingURL=SessionPanel.d.ts.map