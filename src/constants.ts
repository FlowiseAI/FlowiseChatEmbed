import type { BubbleProps } from './features/bubble';

export const defaultBotProps: BubbleProps = {
  chatflowid: '',
  apiHost: undefined,
  chatflowConfig: undefined,
  theme: undefined,
  toggleSize: () => {} // AIT: Add toggleSize 
};
