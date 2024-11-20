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
};

export const DisclaimerPopup = (props: DisclaimerPopupProps) => {
  const [popupProps] = splitProps(props, [
    'onAccept',
    'isOpen',
    'title',
    'message',
    'buttonText',
    'blurredBackgroundColor',    
    'backgroundColor',
    'buttonColor',
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
        <div class="p-10 rounded-lg shadow-lg max-w-md w-full text-center mx-4 font-sans" 
          style={{ background: popupProps.backgroundColor || 'white' }}> {/* Background color for the popup */}
          <h2 class="text-2xl font-semibold mb-4 flex justify-center items-center">
            {popupProps.title ?? 'Disclaimer'}
          </h2>

          <p
            class="text-gray-700 text-base mb-6"
            innerHTML={popupProps.message ?? 'By using this chatbot, you agree to the <a target="_blank" href="https://flowiseai.com/terms">Terms & Condition</a>.'}
          />

          <div class="flex justify-center">
            <button
              class="text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
              style={{ background: popupProps.buttonColor || '#3b82f6' }} // Use buttonColor if provided (default blue)
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
