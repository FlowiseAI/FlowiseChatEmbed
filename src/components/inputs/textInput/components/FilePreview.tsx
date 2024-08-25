import { createSignal } from 'solid-js';
import { TrashIcon, AttachmentIcon } from '../../../icons';

type CardWithDeleteOverlayProps = {
  item: { name: string };
  onDelete: (item: { name: string }) => void;
};

export const FilePreview = (props: CardWithDeleteOverlayProps) => {
  const [isHovered, setIsHovered] = createSignal(false);
  const defaultBackgroundColor = 'transparent';

  return (
    <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} class="relative inline-block">
      <div
        class={`inline-flex items-center h-12 max-w-max p-2 mr-1 flex-none transition-opacity duration-300 ${
          isHovered() ? 'opacity-100' : 'opacity-100'
        } ${isHovered() ? 'bg-[rgba(0,0,0,0.3)]' : `bg-[${defaultBackgroundColor}]`} border border-gray-300 rounded-md`}
      >
        <AttachmentIcon color="#303235" class={`transition-filter duration-300 ${isHovered() ? 'blur-[2px]' : 'blur-none'}`} />
        <span class={`ml-1.5 'text-inherit transition-filter duration-300 ${isHovered() ? 'blur-[2px]' : 'blur-none'}`}>{props.item.name}</span>
      </div>
      {isHovered() && (
        <button
          onClick={() => props.onDelete(props.item)}
          class="absolute top-0 left-0 right-0 bottom-0 bg-transparent hover:bg-transparent flex items-center justify-center"
          title="Remove attachment"
        >
          <TrashIcon color="white" />
        </button>
      )}
    </div>
  );
};
