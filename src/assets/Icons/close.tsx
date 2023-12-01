import { DefaultIconProps } from '@/models/icons';

export default function CloseIcon({ color, height = '10px', width = '10px', className = '', onclick }: DefaultIconProps) {
  return (
    <svg
      onClick={() => {
        onclick?.();
      }}
      fill={color ? color : 'currentColor'}
      stroke-width="0"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      height={height}
      width={width}
      class={className}
      style="overflow: visible; color: currentcolor;"
    >
      <path
        fill="none"
        stroke={color ? color : 'currentColor'}
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="32"
        d="M368 368 144 144"
      ></path>
      <path
        fill="none"
        stroke={color ? color : 'currentColor'}
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="32"
        d="M368 144 144 368"
      ></path>
    </svg>
  );
}
