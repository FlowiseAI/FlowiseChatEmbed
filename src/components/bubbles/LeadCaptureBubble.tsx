import { createSignal, Show } from 'solid-js';
import { z } from 'zod';
import { FormEvent, LeadsConfig, MessageType } from '@/components/Bot';
import { addLeadQuery, LeadCaptureInput } from '@/queries/sendMessageQuery';
import { SaveLeadButton } from '@/components/buttons/LeadCaptureButtons';
import { Avatar } from '@/components/avatars/Avatar';
import { getLocalStorageChatflow, setLocalStorageChatflow } from '@/utils';

type Props = {
  message: MessageType;
  chatflowid: string;
  chatId: string;
  leadsConfig?: LeadsConfig;
  apiHost?: string;
  showAvatar?: boolean;
  avatarSrc?: string;
  backgroundColor?: string;
  textColor?: string;
  sendButtonColor?: string;
  fontSize?: number;
  isLeadSaved: boolean;
  setIsLeadSaved: (value: boolean) => void;
  setLeadEmail: (value: string) => void;
};

const defaultBackgroundColor = '#f7f8ff';
const defaultTextColor = '#303235';
const defaultFontSize = 16;
const phoneRegex = new RegExp(/^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/);

const LeadCaptureSchema = z.object({
  name: z.string().min(2, 'Name is too short').optional(),
  email: z.string().email('Please provide a valid email').optional(),
  phone: z.string().min(5, 'Phone number is too short').regex(phoneRegex, 'Invalid Number!').optional(),
});

export const LeadCaptureBubble = (props: Props) => {
  const [leadName, setLeadName] = createSignal<string>('');
  const [leadEmail, setLeadEmail] = createSignal<string>('');
  const [leadPhone, setLeadPhone] = createSignal<string>('');
  const [isLeadSaving, setIsLeadSaving] = createSignal(false);
  const [leadFormError, setLeadFormError] = createSignal<Record<string, string[]>>();

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
        setLocalStorageChatflow(props.chatflowid, props.chatId, {
          lead: {
            name: leadName(),
            email: leadEmail(),
            phone: leadPhone(),
          },
        });
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
    <div class="flex flex-row justify-start mb-2 items-start host-container" style={{ 'margin-right': '50px' }}>
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
          'font-size': props.fontSize ? `${props.fontSize}px` : `${defaultFontSize}px`,
        }}
      >
        {props.isLeadSaved || getLocalStorageChatflow(props.chatflowid)?.lead ? (
          <div class="flex flex-col gap-2">
            <span style={{ 'white-space': 'pre-line' }}>
              {props.leadsConfig?.successMessage || 'Thank you for submitting your contact information.'}
            </span>
          </div>
        ) : (
          <form class="flex flex-col gap-2" onSubmit={handleLeadCaptureSubmit}>
            <span style={{ 'white-space': 'pre-line' }}>{props.leadsConfig?.title || 'Let us know where we can reach you:'}</span>
            <div class="flex flex-col gap-2 w-full">
              {props.leadsConfig?.name && (
                <div class="w-full flex flex-col items-start justify-start gap-1">
                  <div class={'w-full flex items-center justify-between chatbot-input border border-[#eeeeee]'}>
                    <input
                      class="focus:outline-none bg-transparent px-4 py-4 flex-1 w-full h-full min-h-[56px] max-h-[128px] text-input disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 "
                      placeholder="Name"
                      name="name"
                      style={{ width: '100%' }}
                      value={leadName()}
                      onChange={(e) => setLeadName(e.currentTarget.value)}
                    />
                  </div>
                  {leadFormError() && leadFormError()?.name && <span class="text-sm text-red-500">{leadFormError()?.name[0]}</span>}
                </div>
              )}
              {props.leadsConfig?.email && (
                <div class="w-full flex flex-col items-start justify-start gap-1">
                  <div class={'w-full flex items-center justify-between chatbot-input border border-[#eeeeee]'}>
                    <input
                      class="focus:outline-none bg-transparent px-4 py-4 flex-1 w-full h-full min-h-[56px] max-h-[128px] text-input disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 "
                      type="email"
                      placeholder="Email Address"
                      name="email"
                      style={{ width: '100%' }}
                      value={leadEmail()}
                      onChange={(e) => setLeadEmail(e.currentTarget.value)}
                    />
                  </div>
                  {leadFormError() && leadFormError()?.email && <span class="text-sm text-red-500">{leadFormError()?.email[0]}</span>}
                </div>
              )}
              {props.leadsConfig?.phone && (
                <div class="w-full flex flex-col items-start justify-start gap-1">
                  <div class={'w-full flex items-center justify-between chatbot-input border border-[#eeeeee]'}>
                    <input
                      class="focus:outline-none bg-transparent px-4 py-4 flex-1 w-full h-full min-h-[56px] max-h-[128px] text-input disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 "
                      type="number"
                      placeholder="Phone Number"
                      name="phone"
                      style={{ width: '100%' }}
                      value={leadPhone()}
                      onChange={(e) => setLeadPhone(e.target.value)}
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
