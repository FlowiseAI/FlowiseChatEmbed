import { createSignal, createMemo, Show } from 'solid-js';
import { FileIcon, GlobeIcon } from '../icons';

type Props = {
  pageContent: string;
  metadata: { source?: string; [key: string]: any };
  onSourceClick?: () => void;
  backgroundColor?: string;
};

// Mix two hex colors together (0..1 ratio of `target`).
const mixHex = (base: string, target: string, ratio: number): string => {
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    const full =
      h.length === 3
        ? h
            .split('')
            .map((c) => c + c)
            .join('')
        : h;
    return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
  };
  try {
    const [r1, g1, b1] = parse(base);
    const [r2, g2, b2] = parse(target);
    const mix = (a: number, b: number) => Math.round(a + (b - a) * ratio);
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(mix(r1, r2))}${toHex(mix(g1, g2))}${toHex(mix(b1, b2))}`;
  } catch {
    return base;
  }
};

const isValidURL = (url: string): URL | undefined => {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
};

const FaviconIcon = (props: { url: URL }) => {
  const [errored, setErrored] = createSignal(false);
  const host = props.url.hostname;
  const favicon = `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  return (
    <Show when={!errored()} fallback={<SourceGlobeIcon />}>
      <img
        src={favicon}
        alt=""
        width={14}
        height={14}
        style={{ width: '14px', height: '14px', 'border-radius': '3px', 'flex-shrink': 0, 'object-fit': 'contain' }}
        onError={() => setErrored(true)}
      />
    </Show>
  );
};

const SourceGlobeIcon = () => <GlobeIcon width="14" height="14" style={{ 'flex-shrink': 0, color: '#6b7280' }} />;
const SourceFileIcon = () => <FileIcon width="14" height="14" style={{ 'flex-shrink': 0, color: '#6b7280' }} />;

export const SourceBubble = (props: Props) => {
  const [isHovered, setIsHovered] = createSignal(false);
  const url = createMemo(() => (props.metadata?.source ? isValidURL(props.metadata.source) : undefined));
  // Lighter tint of the bot bubble color (mix 60% toward white). Falls back to a soft neutral.
  const baseBg = createMemo(() => (props.backgroundColor ? mixHex(props.backgroundColor, '#ffffff', 0.6) : '#fafbff'));
  // Hover: a touch darker than the resting tint (mix 8% toward black).
  const hoverBg = createMemo(() => mixHex(baseBg(), '#000000', 0.04));

  return (
    <button
      type="button"
      data-testid="host-bubble"
      title={props.pageContent}
      onClick={() => props.onSourceClick?.()}
      class="source-chip animate-fade-in"
      style={{
        display: 'inline-flex',
        'align-items': 'center',
        gap: '6px',
        'max-width': '160px',
        padding: '6px 12px',
        'background-color': isHovered() ? hoverBg() : baseBg(),
        border: isHovered() ? '1px solid #d1d5db' : '1px solid #e5e7eb',
        'border-radius': '9999px',
        'font-size': '12px',
        'line-height': '1.2',
        color: '#374151',
        cursor: 'pointer',
        'box-shadow': '0 1px 1px rgba(0,0,0,0.02)',
        transition: 'background-color 120ms ease, border-color 120ms ease, transform 120ms ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Show when={url()} fallback={<SourceFileIcon />}>
        <FaviconIcon url={url() as URL} />
      </Show>
      <span
        style={{
          'white-space': 'nowrap',
          overflow: 'hidden',
          'text-overflow': 'ellipsis',
          'max-width': '120px',
        }}
      >
        {props.pageContent}
      </span>
    </button>
  );
};
