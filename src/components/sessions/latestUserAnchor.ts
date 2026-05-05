import { createSignal } from 'solid-js';

const OVERSCROLL_PX = 24;
const SCROLL_MIN_DURATION_MS = 1050;
const SCROLL_MAX_DURATION_MS = 1500;
const SCROLL_DISTANCE_MULTIPLIER = 0.7;

export type LatestUserAnchorDeps = {
  getChatContainer: () => HTMLDivElement | undefined;
  getMessageList: () => HTMLDivElement | undefined;
  programmaticScrollGuard: (fn: () => void) => void;
  // Fired right before the anchor commits its scroll — host syncs sticky-to-bottom + hides scroll button.
  onAnchored?: () => void;
};

export type LatestUserAnchor = ReturnType<typeof createLatestUserAnchor>;

// Pins the most recent user-message bubble near the top of the viewport when a new turn starts,
// matching ChatGPT/Claude/Gemini behavior. Multi-session only — non-multi falls back to plain sticky-to-bottom.
export const createLatestUserAnchor = (deps: LatestUserAnchorDeps) => {
  let active = false;
  let anchorFrame: number | undefined;
  let scrollAnimationFrame: number | undefined;
  let smoothScrollRunning = false;

  const [bottomSpacerHeight, setBottomSpacerHeight] = createSignal(0);

  const getLatestUserMessageElement = () => {
    const c = deps.getChatContainer();
    const userMessages = c?.querySelectorAll<HTMLElement>('.guest-container');
    return userMessages?.[userMessages.length - 1];
  };

  const getChatTopInset = () => {
    const c = deps.getChatContainer();
    const m = deps.getMessageList();
    if (!c || !m) return 0;
    const containerRect = c.getBoundingClientRect();
    const listRect = m.getBoundingClientRect();
    return Math.max(0, listRect.top - containerRect.top + c.scrollTop);
  };

  const updateSpacer = (): number | undefined => {
    const c = deps.getChatContainer();
    const m = deps.getMessageList();
    if (!active || !c || !m) {
      setBottomSpacerHeight(0);
      return undefined;
    }
    const latest = getLatestUserMessageElement();
    if (!latest) {
      setBottomSpacerHeight(0);
      return undefined;
    }
    const containerRect = c.getBoundingClientRect();
    const userRect = latest.getBoundingClientRect();
    const inset = getChatTopInset();
    const top = c.scrollTop + userRect.top - containerRect.top - inset + OVERSCROLL_PX;
    setBottomSpacerHeight(Math.max(0, top + c.clientHeight - inset - m.scrollHeight));
    return top;
  };

  // Cancel any pending RAFs and clear the smooth-scroll flag — without this,
  // an interrupted smooth scroll leaves smoothScrollRunning stuck true and
  // every subsequent 'auto' scroll silently no-ops.
  const cancelFrames = () => {
    if (anchorFrame !== undefined) cancelAnimationFrame(anchorFrame);
    if (scrollAnimationFrame !== undefined) cancelAnimationFrame(scrollAnimationFrame);
    anchorFrame = undefined;
    scrollAnimationFrame = undefined;
    smoothScrollRunning = false;
  };

  const scrollTo = (top: number, behavior: ScrollBehavior) => {
    const c = deps.getChatContainer();
    if (!c) return;
    if (behavior !== 'smooth') {
      if (smoothScrollRunning) return;
      if (scrollAnimationFrame !== undefined) cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = undefined;
      c.scrollTo({ top });
      return;
    }
    if (scrollAnimationFrame !== undefined) cancelAnimationFrame(scrollAnimationFrame);
    smoothScrollRunning = true;
    const startTop = c.scrollTop;
    const distance = top - startTop;
    const duration = Math.min(SCROLL_MAX_DURATION_MS, Math.max(SCROLL_MIN_DURATION_MS, Math.abs(distance) * SCROLL_DISTANCE_MULTIPLIER));
    const startTime = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const cc = deps.getChatContainer();
      if (!cc) {
        scrollAnimationFrame = undefined;
        smoothScrollRunning = false;
        return;
      }
      const progress = Math.min((now - startTime) / duration, 1);
      cc.scrollTo({ top: startTop + distance * easeOutCubic(progress) });
      if (progress < 1) {
        scrollAnimationFrame = requestAnimationFrame(step);
      } else {
        scrollAnimationFrame = undefined;
        smoothScrollRunning = false;
      }
    };
    scrollAnimationFrame = requestAnimationFrame(step);
  };

  const keepAtTop = (behavior: ScrollBehavior = 'auto') => {
    if (!active) return;
    if (anchorFrame !== undefined) cancelAnimationFrame(anchorFrame);
    anchorFrame = requestAnimationFrame(() => {
      const top = updateSpacer();
      if (top === undefined) {
        anchorFrame = undefined;
        return;
      }
      // Let the spacer commit before scrolling, otherwise the browser clamps to
      // the old max scroll and the new turn can still appear stacked.
      anchorFrame = requestAnimationFrame(() => {
        anchorFrame = undefined;
        if (!active) return;
        deps.onAnchored?.();
        deps.programmaticScrollGuard(() => scrollTo(top, behavior));
      });
    });
  };

  const activate = () => {
    active = true;
    setBottomSpacerHeight(0);
  };
  const deactivate = () => {
    active = false;
    cancelFrames();
    setBottomSpacerHeight(0);
  };
  const dispose = () => {
    active = false;
    cancelFrames();
  };

  return { activate, deactivate, dispose, isActive: () => active, keepAtTop, bottomSpacerHeight };
};
