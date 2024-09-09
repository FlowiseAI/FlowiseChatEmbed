import { Show, splitProps } from 'solid-js';

export type DisclaimerPopupProps = {
  isOpen?: boolean;
  onAccept?: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
};

export const DisclaimerPopup = (props: DisclaimerPopupProps) => {
  const [popupProps] = splitProps(props, ['onAccept', 'isOpen', 'title', 'message', 'buttonText']);

  const handleAccept = () => {
    props.onAccept?.();
  };

  return (
    <Show when={popupProps.isOpen}>
      <div class="fixed inset-0 rounded-lg flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
        <div class="bg-white p-10 rounded-lg shadow-lg max-w-md w-full text-center mx-4 font-sans">
          <h2 class="text-2xl font-semibold mb-4 flex justify-center items-center">{popupProps.title ?? 'Disclaimer'}</h2>

          <p
            class="text-gray-700 text-base mb-6"
            innerHTML={popupProps.message ?? 'By using this chatbot, you acknowledge and accept these terms.'}
          />

          <div class="flex justify-center">
            <button
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
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
