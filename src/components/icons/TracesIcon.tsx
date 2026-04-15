import { JSX } from 'solid-js/jsx-runtime';

const defaultButtonColor = '#3B81F6';
export const TracesIcon = (props: JSX.SvgSVGAttributes<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="icon icon-tabler icon-tabler-checklist w-4 h-4"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color ?? defaultButtonColor}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M3.5 5.5l1.5 1.5l2.5 -2.5" />
    <path d="M3.5 11.5l1.5 1.5l2.5 -2.5" />
    <path d="M3.5 17.5l1.5 1.5l2.5 -2.5" />
    <path d="M11 6h9" />
    <path d="M11 12h9" />
    <path d="M11 18h9" />
  </svg>
);
