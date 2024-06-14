type TooltipProps = {
    showTooltip: boolean;
    position: {
        bottom: number;
        right: number;
    };
    buttonSize: number;
    tooltipMessage?: string;
    tooltipBackgroundColor?: string;
    tooltipTextColor?: string;
    tooltipFontSize?: number;
};
declare const Tooltip: (props: TooltipProps) => import("solid-js").JSX.Element;
export default Tooltip;
//# sourceMappingURL=Tooltip.d.ts.map