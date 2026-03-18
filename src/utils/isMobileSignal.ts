import { createSignal } from 'solid-js';

const MOBILE_BREAKPOINT = 640;
const hasWindow = typeof window !== 'undefined';
const MOBILE_RESIZE_HANDLER_KEY = '__flowise_mobile_resize_handler__';

export const [isMobile, setIsMobile] = createSignal<boolean>(hasWindow ? window.innerWidth <= MOBILE_BREAKPOINT : false);

if (hasWindow) {
  const browserWindow = window as Window & { [MOBILE_RESIZE_HANDLER_KEY]?: () => void };

  if (browserWindow[MOBILE_RESIZE_HANDLER_KEY]) {
    window.removeEventListener('resize', browserWindow[MOBILE_RESIZE_HANDLER_KEY] as EventListener);
  }

  const handleResize = () => {
    setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
  };

  browserWindow[MOBILE_RESIZE_HANDLER_KEY] = handleResize;
  window.addEventListener('resize', handleResize);
}
