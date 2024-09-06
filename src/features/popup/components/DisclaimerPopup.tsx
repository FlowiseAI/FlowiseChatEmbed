// DisclaimerPopup.tsx
import { Show, splitProps } from 'solid-js';
import '../../../assets/index.css';

export type DisclaimerPopupProps = {
  isOpen?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  title?: string;
  message?: string;
  acceptButtonText?: string;
  declineButtonText?: string;
  linkUrl?: string;
  linkText?: string;
};

export const DisclaimerPopup = (props: DisclaimerPopupProps) => {
  const [popupProps] = splitProps(props, [
    'onAccept',
    'onDecline',
    'isOpen',
    'title',
    'message',
    'acceptButtonText',
    'declineButtonText',
    'linkUrl',
    'linkText',
  ]);

  const handleAccept = () => {
    props.onAccept?.();
  };

  const handleDecline = () => {
    props.onDecline?.();
  };

  return (
    <Show when={popupProps.isOpen}>
      <div class="popup-overlay">
        <div class="popup-content">
          <h2>{popupProps.title ?? 'Disclaimer'}</h2>
          <p>
            {popupProps.message ?? 'Stimmen Sie unserer Datenschutzerklärung zu?'}{' '}
            <a href={popupProps.linkUrl} target="_blank" rel="noopener noreferrer">
              {popupProps.linkText ?? 'Learn more'}
            </a>
          </p>
          <div class="popup-buttons">
            <button class="popup-button accept" onClick={handleAccept}>
              {popupProps.acceptButtonText ?? 'Ja'}
            </button>
            <button class="popup-button decline" onClick={handleDecline}>
              {popupProps.declineButtonText ?? 'Nein'}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};
