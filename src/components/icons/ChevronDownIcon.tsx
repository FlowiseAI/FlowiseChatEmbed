import { Component } from 'solid-js';

type Props = {
  class?: string;
  isCurrentColor?: boolean;
};

export const ChevronDownIcon: Component<Props> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" class={props.class || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
