import { Show } from 'solid-js';

type Props = {
  visible: boolean;
  text: string;
  onDismiss: () => void;
};

export const CapWarningToast = (props: Props) => {
  return (
    <Show when={props.visible}>
      <div
        role="alert"
        style={{
          margin: '8px',
          padding: '10px',
          background: '#fef3c7',
          'border-left': '4px solid #f59e0b',
          'border-radius': '4px',
          'font-size': '12px',
          color: '#92400e',
        }}
      >
        <div>{props.text}</div>
        <div style={{ 'text-align': 'right', 'margin-top': '6px' }}>
          <button
            type="button"
            onClick={props.onDismiss}
            style={{
              background: 'none',
              border: '1px solid #92400e',
              color: '#92400e',
              padding: '3px 8px',
              'border-radius': '3px',
              'font-size': '11px',
              cursor: 'pointer',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </Show>
  );
};
