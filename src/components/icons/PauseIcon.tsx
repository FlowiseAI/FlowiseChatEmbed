import { JSX } from 'solid-js/jsx-runtime';
const defaultButtonColor = '#3B81F6';

export const PauseIcon = (props: JSX.SvgSVGAttributes<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill={props.color ?? defaultButtonColor}
    stroke={props.color ?? defaultButtonColor}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);
