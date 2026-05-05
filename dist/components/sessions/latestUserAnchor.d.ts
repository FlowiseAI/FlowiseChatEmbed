export type LatestUserAnchorDeps = {
    getChatContainer: () => HTMLDivElement | undefined;
    getMessageList: () => HTMLDivElement | undefined;
    programmaticScrollGuard: (fn: () => void) => void;
    onAnchored?: () => void;
};
export type LatestUserAnchor = ReturnType<typeof createLatestUserAnchor>;
export declare const createLatestUserAnchor: (deps: LatestUserAnchorDeps) => {
    activate: () => void;
    deactivate: () => void;
    dispose: () => void;
    isActive: () => boolean;
    keepAtTop: (behavior?: ScrollBehavior) => void;
    bottomSpacerHeight: import("solid-js").Accessor<number>;
};
//# sourceMappingURL=latestUserAnchor.d.ts.map