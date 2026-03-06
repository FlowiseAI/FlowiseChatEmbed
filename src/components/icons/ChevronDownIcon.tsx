import { JSX } from 'solid-js/jsx-runtime';

export const ChevronDownIcon = (props: JSX.SvgSVGAttributes<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    {...props}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);
