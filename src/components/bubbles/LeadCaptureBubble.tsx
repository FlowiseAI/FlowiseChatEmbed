import { createSignal, Show } from 'solid-js';
import { LeadsConfig, MessageType } from '@/components/Bot';
import { addLeadQuery, LeadCaptureInput } from '@/queries/sendMessageQuery';
import { ShortTextInput } from '@/components/inputs/textInput/components/ShortTextInput';
import { CancelLeadCaptureButton, SaveLeadButton } from '@/components/buttons/LeadCaptureButtons';
import { Avatar } from '@/components/avatars/Avatar';

type Props = {
  message: MessageType;
  chatflowid: string;
  chatId: string;
  leadsConfig?: LeadsConfig;
  apiHost?: string;
  handleCancelLeadCapture: () => void;
  fileAnnotations?: any;
  showAvatar?: boolean;
  avatarSrc?: string;
  backgroundColor?: string;
  textColor?: string;
  sendButtonColor?: string;
  chatFeedbackStatus?: boolean;
  fontSize?: number;
};

const defaultBackgroundColor = '#f7f8ff';
const defaultTextColor = '#303235';
const defaultFontSize = 16;

export const LeadCaptureBubble = (props: Props) => {
  const [leadName, setLeadName] = createSignal('');
  const [leadEmail, setLeadEmail] = createSignal('');
  const [leadPhone, setLeadPhone] = createSignal('');
  const [isLeadSaving, setIsLeadSaving] = createSignal(false);
  const [isLeadSaved, setIsLeadSaved] = createSignal(false);

  const handleLeadCaptureSubmit = async () => {
    setIsLeadSaving(true);

    const body: LeadCaptureInput = {
      chatflowid: props.chatflowid,
      chatId: props.chatId,
      name: leadName(),
      email: leadEmail(),
      phone: leadPhone(),
    };

    const result = await addLeadQuery({
      apiHost: props.apiHost,
      body,
    });

    if (result.data) {
      localStorage.setItem(`${props.chatflowid}_LEAD`, 'true');
      setIsLeadSaving(false);
      setIsLeadSaved(true);
    }
  };

  return (
    <div class="flex flex-col justify-start mb-2 items-start host-container" style={{ 'margin-right': '50px' }}>
      <Show when={props.showAvatar}>
        <Avatar initialAvatarSrc={props.avatarSrc} />
      </Show>
      <div
        class="px-4 py-2 ml-2 max-w-full chatbot-host-bubble prose"
        data-testid="host-bubble"
        style={{
          'background-color': props.backgroundColor ?? defaultBackgroundColor,
          color: props.textColor ?? defaultTextColor,
          'border-radius': '6px',
          'font-size': props.fontSize ? `${props.fontSize}px` : `${defaultFontSize}`,
        }}
      >
        {isLeadSaved() || localStorage.getItem(`${props.chatflowid}_LEAD`) ? (
          <div class="flex flex-col gap-2">
            <span>{props.leadsConfig?.successMessage || 'Thank you for submitting your contact information.'}</span>
          </div>
        ) : (
          <div class="flex flex-col gap-2">
            <span>{props.leadsConfig?.title || 'Let us know where we can reach you:'}</span>
            <div class="flex flex-col gap-2 w-full">
              {props.leadsConfig?.name && (
                <div class={'flex items-center justify-between chatbot-input border border-[#eeeeee]'}>
                  <ShortTextInput ref={undefined} placeholder="Name" name="leadName" value={leadName()} onInput={setLeadName} />
                </div>
              )}
              {props.leadsConfig?.email && (
                <div class={'flex items-center justify-between chatbot-input border border-[#eeeeee]'}>
                  <ShortTextInput
                    ref={undefined}
                    type="email"
                    placeholder="Email Address"
                    name="leadEmail"
                    value={leadEmail()}
                    onInput={setLeadEmail}
                  />
                </div>
              )}
              {props.leadsConfig?.phone && (
                <div class={'w-full h-10 flex items-center justify-between chatbot-input border border-[#eeeeee]'}>
                  <ShortTextInput
                    ref={undefined}
                    type="number"
                    placeholder="Phone Number"
                    name="leadPhone"
                    value={leadPhone()}
                    onInput={setLeadPhone}
                  />
                </div>
              )}
              <div class="flex items-center justify-end gap-1">
                <CancelLeadCaptureButton buttonColor={props.sendButtonColor} onClick={props.handleCancelLeadCapture} />
                <SaveLeadButton buttonColor={props.sendButtonColor} isLoading={isLeadSaving()} onClick={handleLeadCaptureSubmit} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
