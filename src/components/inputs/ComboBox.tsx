import { createSignal, Show, For, createEffect } from 'solid-js';
import { ChevronDownIcon } from '../icons';

/**
 * 재사용 가능한 콤보박스 컴포넌트
 *
 * 초기값 설정 방법:
 * 1. value: 제어 컴포넌트로 사용 (부모에서 상태 관리)
 * 2. defaultValue: 초기값만 설정하고 이후 자유롭게 변경 가능
 * 3. 둘 다 없으면: 첫 번째 활성화된 옵션을 자동으로 선택
 */

type ComboBoxOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  options: ComboBoxOption[];
  value?: string;
  label?: string;
  defaultValue?: string; // 초기 기본값
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  class?: string;
  style?: Record<string, any>;
};

export const ComboBox = (props: Props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [selectedValue, setSelectedValue] = createSignal(props.value || '');
  const [searchTerm, setSearchTerm] = createSignal('');

  // 초기값 설정 로직
  createEffect(() => {
    if (!selectedValue() && props.options.length > 0) {
      let initialValue = '';

      // 1. props.value가 있으면 그것을 사용
      if (props.value) {
        initialValue = props.value;
      }
      // 2. props.value가 없고 defaultValue가 있으면 defaultValue 사용
      else if (props.defaultValue) {
        initialValue = props.defaultValue;
      }
      // 3. 둘 다 없으면 첫 번째 활성화된 옵션 사용
      else {
        const firstOption = props.options.find((opt) => !opt.disabled);
        if (firstOption) {
          initialValue = firstOption.value;
        }
      }

      // 초기값이 설정되었고 유효한 옵션인 경우
      if (initialValue && props.options.some((opt) => opt.value === initialValue)) {
        setSelectedValue(initialValue);
        // 초기값 설정 시 onChange 콜백 호출 (단, props.value가 아닌 경우에만)
        if (props.onChange && !props.value) {
          props.onChange(initialValue);
        }
      }
    }
  });

  // 선택된 옵션의 라벨을 찾는 함수
  const getSelectedLabel = () => {
    const option = props.options.find((opt) => opt.value === selectedValue());
    return option ? option.label : props.placeholder || '선택하세요';
  };

  // 검색어에 맞는 옵션들을 필터링
  const filteredOptions = () => {
    if (!searchTerm()) return props.options;
    return props.options.filter(
      (option) => option.label.toLowerCase().includes(searchTerm().toLowerCase()) || option.value.toLowerCase().includes(searchTerm().toLowerCase()),
    );
  };

  // 옵션 선택 처리
  const handleOptionSelect = (option: ComboBoxOption) => {
    if (option.disabled) return;

    setSelectedValue(option.value);
    setIsOpen(false);
    setSearchTerm('');

    if (props.onChange) {
      props.onChange(option.value);
    }
  };

  // 검색어 변경 처리
  const handleSearchChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setSearchTerm(target.value);
  };

  // 외부 클릭 시 드롭다운 닫기
  const handleOutsideClick = (e: Event) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.combo-box-container')) {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // 드롭다운 토글
  const toggleDropdown = () => {
    if (props.disabled) return;
    setIsOpen(!isOpen());
    if (!isOpen()) {
      setSearchTerm('');
    }
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      toggleDropdown();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // props.value가 변경될 때 selectedValue 업데이트
  createEffect(() => {
    if (props.value !== undefined) {
      setSelectedValue(props.value);
    }
  });

  // 외부 클릭 이벤트 리스너 등록
  createEffect(() => {
    if (isOpen()) {
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  });

  return (
    <div class={`combo-box-container relative ${props.class || ''}`} style={props.style}>
      {/* Label과 콤보박스를 감싸는 컨테이너 */}
      <div class="flex items-center space-x-2">
        {/* Label 표시 */}
        <Show when={props.label}>
          <label class="text-sm font-medium text-gray-700 whitespace-nowrap">{props.label}</label>
        </Show>

        {/* 메인 입력 필드 */}
        <div
          class={`
            flex items-center justify-between w-full px-2  
            border border-gray-300 rounded-md cursor-pointer
            ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
            ${isOpen() ? 'border-blue-500 ring-2 ring-blue-200' : ''}
            transition-all duration-200
          `}
          onClick={toggleDropdown}
          onKeyDown={handleKeyDown}
          tabIndex={props.disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen()}
          aria-haspopup="listbox"
        >
          <span class={`truncate ${selectedValue() ? 'text-gray-900' : 'text-gray-500'}`} style={{ 'font-size': '12px' }}>
            {getSelectedLabel()}
          </span>
          <ChevronDownIcon class={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen() ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* 드롭다운 메뉴 */}
      <Show when={isOpen()}>
        <div class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* 검색 입력 필드 */}
          <div class="p-2 border-b border-gray-200" style={{ display: 'none' }}>
            <input
              type="text"
              value={searchTerm()}
              onInput={handleSearchChange}
              placeholder="검색..."
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>

          {/* 옵션 목록 */}
          <div class="max-h-48 overflow-y-auto">
            <Show when={filteredOptions().length > 0} fallback={<div class="px-3 py-2 text-sm text-gray-500 text-center">검색 결과가 없습니다</div>}>
              <For each={filteredOptions()}>
                {(option) => (
                  <div
                    class={`
                      px-3 py-2 cursor-pointer text-sm transition-colors duration-150
                      ${option.value === selectedValue() ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100 text-gray-900'}
                      ${option.disabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}
                    `}
                    style={{ 'font-size': '12px', 'line-height': '22px' }}
                    onClick={() => handleOptionSelect(option)}
                    role="option"
                    aria-selected={option.value === selectedValue()}
                  >
                    {option.label}
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
};
