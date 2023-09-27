import { createSignal, onCleanup } from 'solid-js';
import { createPopper } from '@popperjs/core';
import { Instance as PopperInstance } from '@popperjs/core';
import { MagicIcon } from '@/components/icons';

type DropdownProps = {
  onInput: (value: string) => void;
};

function Dropdown(props: DropdownProps) {
  let dropdownDiv: any;
  const [isOpen, setIsOpen] = createSignal(false);
  let popperInstance: PopperInstance | null = null;

  const toggleDropdown = (e: Event, dropdownID: string) => {
    e.preventDefault();
    let element = e.currentTarget as HTMLElement;
    popperInstance = createPopper(element, dropdownDiv, {
      placement: 'top-end',
    });
    setIsOpen(!isOpen());
    onCleanup(() => {
      if (popperInstance) {
        popperInstance.destroy();
        popperInstance = null;
      }
    });
  };
  const closeDropdown = () => {
    setIsOpen(false);
  };

  return (
    <div class="flex flex-wrap">
      <div class="w-full sm:w-6/12 md:w-4/12 px-4">
        <div class="relative inline-flex align-middle w-full">
          <button
            class="text-white font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 bg-slate-700 ease-linear transition-all duration-150"
            type="button"
            onClick={(e) => toggleDropdown(e, 'dropdown-id')}
          >
            <MagicIcon />
          </button>
          <div
            ref={dropdownDiv}
            id="dropdown-id"
            class={`${
              isOpen() ? 'block' : 'hidden'
            } bg-white text-base z-50 float-left py-2 list-none text-left rounded shadow-lg mb-1`}
            style="min-width:12rem"
          >
            <a
              onClick={(e) => {
                props.onInput(`Tell me about my building`);
                closeDropdown();
              }}
              class="text-sm py-2 px-4 font-normal block w-full whitespace-nowrap bg-transparent text-slate-700"
            >
              Tell me about my building
            </a>
            <a
              onClick={(e) => {
                props.onInput(`What can I do to get into compliance?`);
                closeDropdown();
              }}
              class="text-sm py-2 px-4 font-normal block w-full whitespace-nowrap bg-transparent text-slate-700"
            >
              What can I do to get into compliance?
            </a>
            <a
              onClick={(e) => {
                props.onInput(
                  `What type of projects to you recommend I start?`
                );
                closeDropdown();
              }}
              class="text-sm py-2 px-4 font-normal block w-full whitespace-nowrap bg-transparent text-slate-700"
            >
              What type of projects to you recommend I start?
            </a>
            {/* <div class="h-0 my-2 border border-solid border-t-0 border-slate-800 opacity-25"></div>
            <a
              href="#"
              class="text-sm py-2 px-4 font-normal block w-full whitespace-nowrap bg-transparent text-slate-700"
            >
              Take Me Home
            </a> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dropdown;
