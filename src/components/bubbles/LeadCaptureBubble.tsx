import { createSignal, Show } from 'solid-js';
import { z } from 'zod';
import { FormEvent, LeadsConfig, MessageType } from '@/components/Bot';
import { addLeadQuery, LeadCaptureInput } from '@/queries/sendMessageQuery';
import { ShortTextInput } from '@/components/inputs/textInput/components/ShortTextInput';
import { SaveLeadButton } from '@/components/buttons/LeadCaptureButtons';
import { Avatar } from '@/components/avatars/Avatar';

type Props = {
  message: MessageType;
  chatflowid: string;
  chatId: string;
  leadsConfig?: LeadsConfig;
  apiHost?: string;
  fileAnnotations?: any;
  showAvatar?: boolean;
  avatarSrc?: string;
  backgroundColor?: string;
  textColor?: string;
  sendButtonColor?: string;
  chatFeedbackStatus?: boolean;
  fontSize?: number;
  isLeadSaved: boolean;
  setIsLeadSaved: (value: boolean) => void;
  setLeadEmail: (value: string) => void;
};

const defaultBackgroundColor = '#f7f8ff';
const defaultTextColor = '#303235';
const defaultFontSize = 16;

const LeadCaptureSchema = z.object({
  name: z.string().min(2, 'Name is too short').optional(),
  email: z.string().email('Please provide a valid email').optional(),
  phone: z.string().min(5, 'Phone number is too short').optional(),
});

export const LeadCaptureBubble = (props: Props) => {
  const [leadName, setLeadName] = createSignal<string>('');
  const [leadEmail, setLeadEmail] = createSignal<string>('');
  const [leadPhone, setLeadPhone] = createSignal<number>();
  const [isLeadSaving, setIsLeadSaving] = createSignal(false);
  const [leadFormError, setLeadFormError] = createSignal<Record<string, string[]>>();

  const setLocalStorageChatflow = (chatflowid: string, chatId: string, saveObj: any = {}) => {
    const chatDetails = localStorage.getItem(`${chatflowid}_EXTERNAL`)
    const obj = { ...saveObj }
    if (chatId) obj.chatId = chatId

    if (!chatDetails) {
        localStorage.setItem(`${chatflowid}_EXTERNAL`, JSON.stringify(obj))
    } else {
        try {
            const parsedChatDetails = JSON.parse(chatDetails)
            localStorage.setItem(`${chatflowid}_EXTERNAL`, JSON.stringify({ ...parsedChatDetails, ...obj }))
        } catch (e) {
            const chatId = chatDetails
            obj.chatId = chatId
            localStorage.setItem(`${chatflowid}_EXTERNAL`, JSON.stringify(obj))
        }
    }
  }

  const getLeadsFromLocalStorage = (chatflowid: string) => {
    const chatDetails = localStorage.getItem(`${chatflowid}_EXTERNAL`);
    if (chatDetails) {
      try {
        const objchatDetails = JSON.parse(chatDetails);
        return objchatDetails?.lead ?? undefined
      } catch (e) {
        return undefined
      }
    }
    return undefined
  }

  const handleLeadCaptureSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLeadSaving(true);

    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = LeadCaptureSchema.safeParse(data);

    if (res.success) {
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
        setLocalStorageChatflow(props.chatflowid, props.chatId, { lead: { name: leadName(), email: leadEmail(), phone: leadPhone() } })
        props.setIsLeadSaved(true);
        props.setLeadEmail(leadEmail());
      }
    } else {
      const error = res.error.flatten();
      setLeadFormError(error.fieldErrors);
    }

    setIsLeadSaving(false);
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
        {props.isLeadSaved || getLeadsFromLocalStorage(props.chatflowid) ? (
          <div class="flex flex-col gap-2">
            <span>{props.leadsConfig?.successMessage || 'Thank you for submitting your contact information.'}</span>
          </div>
        ) : (
          <form class="flex flex-col gap-2" onSubmit={handleLeadCaptureSubmit}>
            <span>{props.leadsConfig?.title || 'Let us know where we can reach you:'}</span>
            <div class="flex flex-col gap-2 w-full">
              {props.leadsConfig?.name && (
                <div class="w-full flex flex-col items-start justify-start gap-1">
                  <div class={'w-full flex items-center justify-between chatbot-input border border-[#eeeeee]'}>
                    <ShortTextInput ref={undefined} placeholder="Name" name="name" value={leadName()} onInput={setLeadName} />
                  </div>
                  {leadFormError() && leadFormError()?.name && <span class="text-sm text-red-500">{leadFormError()?.name[0]}</span>}
                </div>
              )}
              {props.leadsConfig?.email && (
                <div class="w-full flex flex-col items-start justify-start gap-1">
                  <div class={'w-full flex items-center justify-between chatbot-input border border-[#eeeeee]'}>
                    <ShortTextInput
                      ref={undefined}
                      type="email"
                      placeholder="Email Address"
                      name="email"
                      value={leadEmail()}
                      onInput={setLeadEmail}
                    />
                  </div>
                  {leadFormError() && leadFormError()?.email && <span class="text-sm text-red-500">{leadFormError()?.email[0]}</span>}
                </div>
              )}
              {props.leadsConfig?.phone && (
                <div class="w-full flex flex-col items-start justify-start gap-1">
                  <div class={'w-full flex items-center justify-between chatbot-input border border-[#eeeeee]'}>
                    <ShortTextInput
                      ref={undefined}
                      type="number"
                      placeholder="Phone Number"
                      name="phone"
                      value={leadPhone()}
                      onInput={setLeadPhone}
                    />
                  </div>
                  {leadFormError() && leadFormError()?.phone && <span class="text-sm text-red-500">{leadFormError()?.phone[0]}</span>}
                </div>
              )}
              <div class="flex items-center justify-end gap-1">
                <SaveLeadButton buttonColor={props.sendButtonColor} isLoading={isLeadSaving()} />
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
