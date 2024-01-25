import { JSX } from 'solid-js/jsx-runtime';
const defaultButtonColor = '#3B81F6';
export const SendIcon = (props: JSX.SvgSVGAttributes<SVGSVGElement>) => (
  // import svg from assets folder
  <svg width="19px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ fill: props.color ?? defaultButtonColor }} {...props}>
    <path opacity="0.15" d="M20 4L3 11L10 14L13 21L20 4Z"/>
    <path d="M20 4L3 11L10 14M20 4L13 21L10 14M20 4L10 14" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
);
