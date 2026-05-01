import type { SessionV2 } from '@/state/sessionStorage';
type Theme = {
    textColor: string;
    activeBackgroundColor: string;
    activeTextColor: string;
    hoverBackgroundColor: string;
    accentColor: string;
};
type Props = {
    session: SessionV2;
    active: boolean;
    editing: boolean;
    editingDraft: string;
    confirmingDelete: boolean;
    theme: Theme;
    onSwitch: () => void;
    onStartEdit: () => void;
    onChangeDraft: (next: string) => void;
    onCommitEdit: () => void;
    onCancelEdit: () => void;
    onStartDelete: () => void;
    onCancelDelete: () => void;
    onConfirmDelete: () => void;
    onToggleStar?: () => void;
};
export declare const SessionListItem: (props: Props) => import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=SessionListItem.d.ts.map