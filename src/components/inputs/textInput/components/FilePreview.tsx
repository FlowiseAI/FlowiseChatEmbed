import { createSignal } from 'solid-js';
import { TrashIcon, AttachmentIcon } from '../../../icons';

type CardWithDeleteOverlayProps = {
  item: { name: string };
  disabled?: boolean;
  onDelete: (item: { name: string }) => void;
};

export const FilePreview = (props: CardWithDeleteOverlayProps) => {
  const [isHovered, setIsHovered] = createSignal(false);
  const defaultBackgroundColor = 'transparent';

  const onMouseEnter = () => {
    if (props.disabled) return;
    setIsHovered(true);
  };

  const onMouseLeave = () => {
    if (props.disabled) return;
    setIsHovered(false);
  };

  return (
    <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} class="relative inline-block">
      <div
        class={`inline-flex items-center h-12 max-w-max p-2 flex-none transition-opacity duration-300 ${
          isHovered() ? 'opacity-100' : 'opacity-100'
        } ${isHovered() ? 'bg-[rgba(0,0,0,0.3)]' : `bg-[${defaultBackgroundColor}]`} border border-gray-300 rounded-md`}
      >
        <AttachmentIcon color="#303235" class={`transition-filter duration-300 ${isHovered() ? 'blur-[2px]' : 'blur-none'}`} />
        <span class={`ml-1.5 'text-inherit transition-filter duration-300 ${isHovered() ? 'blur-[2px]' : 'blur-none'}`}>{props.item.name}</span>
      </div>
      {isHovered() && !props.disabled && (
        <button
          disabled={props.disabled}
          onClick={() => props.onDelete(props.item)}
          class="absolute top-0 left-0 right-0 bottom-0 bg-transparent hover:bg-transparent flex items-center justify-center"
          title="Remove attachment"
        >
          <TrashIcon color="white" />
        </button>
      )}
      {props.disabled && (
        <div class="absolute inset-0 bg-[rgba(0,0,0,0.4)] flex items-center justify-center z-10 rounded-md">
          <div class="spinner border-4 border-gray-200 border-t-4 border-t-white rounded-full w-6 h-6 animate-spin" />
        </div>
      )}
    </div>
  );
};
