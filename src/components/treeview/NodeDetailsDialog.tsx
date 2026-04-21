import { Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { NodeDetailsContent, nddStyles } from './NodeDetailsContent';
import { CHAT_HEADER_HEIGHT } from '@/constants';

type NodeDetailsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  node: {
    label: string;
    name: string;
    status: string;
    data: any;
  } | null;
  backgroundColor?: string;
  textColor?: string;
  apiHost?: string;
  chatflowid?: string;
  chatId?: string;
  // When opened in Bubble chat and there is a header we want to portal the modal outside so it covers the header
  dialogContainer?: HTMLElement;
  hasCustomHeader?: boolean;
};

export const NodeDetailsDialog = (props: NodeDetailsDialogProps) => {
  // In bubble mode with a custom header, the modal should cover the popup including the
  // chat header — some padding offset is needed. In all other cases (full page or bubble
  // without a custom header) we offset by CHAT_HEADER_HEIGHT to clear the chat title bar.
  const dialogPaddingTop = () => (props.dialogContainer && props.hasCustomHeader ? 50 : CHAT_HEADER_HEIGHT);

  const DialogContent = () => (
    <>
      <style>{nddStyles}</style>
      <div
        class="node-details-dialog-root"
        style={{
          position: 'fixed',
          inset: '0',
          'z-index': 1002,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'overflow-x': 'hidden',
          'overflow-y': 'auto',
          outline: 'none',
          'padding-top': `${dialogPaddingTop()}px`,
        }}
        on:click={() => props.onClose()}
      >
        <div
          class="node-details-dialog-paper"
          style={{
            position: 'relative',
            width: '100%',
            'max-width': '640px',
            margin: '24px 16px',
            'background-color': props.backgroundColor ?? '#ffffff',
            color: props.textColor ?? '#303235',
            'border-radius': '8px',
            'box-shadow': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
            display: 'flex',
            'flex-direction': 'column',
            'max-height': `calc(100% - ${dialogPaddingTop()}px)`,
            'overflow-y': 'auto',
            outline: 'none',
            'font-family': "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          }}
          on:click={(e) => e.stopPropagation()}
        >
          <NodeDetailsContent
            node={props.node!}
            backgroundColor={props.backgroundColor}
            textColor={props.textColor}
            apiHost={props.apiHost}
            chatflowid={props.chatflowid}
            chatId={props.chatId}
          />
        </div>
      </div>

      <div
        style={{ position: 'fixed', inset: '0', 'z-index': 1001, 'background-color': 'rgba(0,0,0,0.25)', 'pointer-events': 'auto' }}
        on:click={() => props.onClose()}
      />
    </>
  );

  return (
    <Show when={props.isOpen && props.node}>
      <Show when={props.dialogContainer} fallback={<DialogContent />}>
        {(container) => (
          <Portal mount={container()}>
            <DialogContent />
          </Portal>
        )}
      </Show>
    </Show>
  );
};
