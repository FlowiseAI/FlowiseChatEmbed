import { JSX } from 'solid-js/jsx-runtime';
const defaultButtonColor = '#3B81F6';

export const PlayIcon = (props: JSX.SvgSVGAttributes<SVGSVGElement>) => (
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
    <path d="M6 4v16l14-8L6 4Z" />
  </svg>
);
