import { Show, splitProps } from 'solid-js';

export type DisclaimerPopupProps = {
  isOpen?: boolean;
  onAccept?: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
  blurredBackgroundColor?: string;
  backgroundColor?: string;
  buttonColor?: string;
  textColor?: string;
  buttonTextColor?: string;
};

export const DisclaimerPopup = (props: DisclaimerPopupProps) => {
  const [popupProps] = splitProps(props, [
    'onAccept',
    'isOpen',
    'title',
    'message',
    'textColor',
    'buttonColor',
    'buttonText',
    'buttonTextColor',
    'blurredBackgroundColor',
    'backgroundColor',
  ]);

  const handleAccept = () => {
    popupProps.onAccept?.();
  };

  return (
    <Show when={popupProps.isOpen}>
      <div
        class="fixed inset-0 rounded-lg flex items-center justify-center backdrop-blur-sm z-50"
        style={{ background: popupProps.blurredBackgroundColor || 'rgba(0, 0, 0, 0.4)' }}
      >
        <div
          class="p-10 rounded-lg shadow-lg max-w-md w-full text-center mx-4 font-sans"
          style={{ background: popupProps.backgroundColor || 'white', color: popupProps.textColor || 'black' }}
        >
          <h2 class="text-2xl font-semibold mb-4 flex justify-center items-center">{popupProps.title ?? 'Disclaimer'}</h2>

          <p
            class="text-gray-700 text-base mb-6"
            style={{ color: popupProps.textColor || 'black' }}
            innerHTML={
              popupProps.message ??
              'By using this chatbot, you agree to the <a target="_blank" href="https://flowiseai.com/terms">Terms & Condition</a>.'
            }
          />

          <div class="flex justify-center">
            <button
              class="font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
              style={{ background: popupProps.buttonColor || '#3b82f6', color: popupProps.buttonTextColor || 'white' }}
              onClick={handleAccept}
            >
              {popupProps.buttonText ?? 'Start Chatting'}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};
