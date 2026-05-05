import { JSX } from 'solid-js/jsx-runtime';
const defaultButtonColor = '#ffffff';
export const UpArrowIcon = (props: JSX.SvgSVGAttributes<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color ?? defaultButtonColor}
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    {...props}
  >
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);
