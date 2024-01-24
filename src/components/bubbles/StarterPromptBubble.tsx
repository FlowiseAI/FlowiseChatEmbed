type Props = {
  prompt: string;
  onPromptClick?: () => void;
};
export const StarterPromptBubble = (props: Props) => (
  <>
    <div
      data-modal-target="defaultModal"
      data-modal-toggle="defaultModal"
      class="flex justify-start mb-2 ml-2 items-start animate-fade-in host-container hover:brightness-90 active:brightness-75 shadow-md rounded-2xl"
      onClick={() => props.onPromptClick?.()}
    >
      <span
        class="py-1 pr-2 pl-3 whitespace-pre-wrap max-w-full chatbot-host-bubble"
        data-testid="host-bubble"
        style={{
          width: 'max-content',
          'font-size': '15px',
          'border-radius': '15px',
          cursor: 'pointer',
        }}
      >
        {props.prompt}
      </span>
    </div>
  </>
);
