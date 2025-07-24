import { JSX } from 'solid-js/jsx-runtime';
const defaultButtonColor = '#3B81F6';

export const PlayIcon = (props: JSX.SvgSVGAttributes<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={props.color ?? defaultButtonColor}>
    <path d="M6 4v16l14-8L6 4Z" />
  </svg>
);
