import { Show } from 'solid-js';

const defaultTooltipMessage = 'Hi There 👋!';
const defaultTooltipBackgroundColor = 'black';
const defaultTooltipTextColor = 'white';
const defaultTooltipFontSize = 16; // Default font size for tooltip

type TooltipProps = {
  showTooltip: boolean;
  position: { bottom: number; right: number };
  buttonSize: number;
  tooltipMessage?: string;
  tooltipBackgroundColor?: string;
  tooltipTextColor?: string;
  tooltipFontSize?: number; // Add tooltipFontSize to props
};

const Tooltip = (props: TooltipProps) => {
  const tooltipMessage = props.tooltipMessage ?? defaultTooltipMessage;
  const backgroundColor = props.tooltipBackgroundColor ?? defaultTooltipBackgroundColor;
  const textColor = props.tooltipTextColor ?? defaultTooltipTextColor;
  const fontSize = `${props.tooltipFontSize ?? defaultTooltipFontSize}px`; // Use tooltipFontSize if provided, otherwise default to 16px

  // Generate tooltip text with line breaks if needed
  const formattedTooltipMessage =
    tooltipMessage.length > 20
      ? tooltipMessage
          .split(' ')
          .reduce<string[][]>(
            (acc, curr) => {
              const last = acc[acc.length - 1];
              if (last && last.join(' ').length + curr.length <= 20) {
                last.push(curr);
              } else {
                acc.push([curr]);
              }
              return acc;
            },
            [[]],
          )
          .map((arr) => arr.join(' '))
          .join('\n')
      : tooltipMessage;

  return (
    <Show when={props.showTooltip}>
      <div
        class="tooltip"
        style={{
          right: `calc(${props.position.right}px + 20px)`,
          bottom: `${props.position.bottom + props.buttonSize + 10}px`,
          '--tooltip-background-color': backgroundColor,
          '--tooltip-text-color': textColor,
          '--tooltip-font-size': fontSize,
        }}
      >
        {formattedTooltipMessage}
      </div>
    </Show>
  );
};

export default Tooltip;
