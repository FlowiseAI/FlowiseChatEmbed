import { createEffect, on, Show, createSignal, onMount, For } from 'solid-js';
import { Avatar } from '../avatars/Avatar';
import { Marked } from '@ts-stack/markdown';
import { FeedbackRatingType, sendFeedbackQuery, sendFileDownloadQuery, updateFeedbackQuery } from '@/queries/sendMessageQuery';
import { MessageType } from '../Bot';
import { CopyToClipboardButton, ThumbsDownButton, ThumbsUpButton } from '../buttons/FeedbackButtons';
import FeedbackContentDialog from '../FeedbackContentDialog';
import { AgentReasoningBubble } from './AgentReasoningBubble';

type Props = {
  message: MessageType;
  chatflowid: string;
  chatId: string;
  apiHost?: string;
  fileAnnotations?: any;
  showAvatar?: boolean;
  avatarSrc?: string;
  backgroundColor?: string;
  textColor?: string;
  chatFeedbackStatus?: boolean;
  fontSize?: number;
  feedbackColor?: string;
  isLoading: boolean;
  showAgentMessages?: boolean;
};

const defaultBackgroundColor = '#f7f8ff';
const defaultTextColor = '#303235';
const defaultFontSize = 16;
const defaultFeedbackColor = '#3B81F6';

Marked.setOptions({ isNoP: true });

export const BotBubble = (props: Props) => {
  let botMessageEl: HTMLDivElement | undefined;
  let botDetailsEl: HTMLDetailsElement | undefined;

  const [rating, setRating] = createSignal('');
  const [feedbackId, setFeedbackId] = createSignal('');
  const [showFeedbackContentDialog, setShowFeedbackContentModal] = createSignal(false);
  const [copiedMessage, setCopiedMessage] = createSignal(false);
  const [thumbsUpColor, setThumbsUpColor] = createSignal(props.feedbackColor ?? defaultFeedbackColor); // default color
  const [thumbsDownColor, setThumbsDownColor] = createSignal(props.feedbackColor ?? defaultFeedbackColor); // default color

  const downloadFile = async (fileAnnotation: any) => {
    try {
      const response = await sendFileDownloadQuery({
        apiHost: props.apiHost,
        body: { question: '', fileName: fileAnnotation.fileName },
      });
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileAnnotation.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const copyMessageToClipboard = async () => {
    try {
      const text = botMessageEl ? botMessageEl?.textContent : '';
      await navigator.clipboard.writeText(text || '');
      setCopiedMessage(true);
      setTimeout(() => {
        setCopiedMessage(false);
      }, 2000); // Hide the message after 2 seconds
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const saveRatingToLocalStorage = (rating: string) => {
    const storageKey = `${props.chatflowid}_EXTERNAL`;  // Corrected key naming
    const chatHistory = JSON.parse(localStorage.getItem(storageKey) || '{"chatHistory": []}');
  
    const messageIndex = chatHistory.chatHistory.findIndex((msg: any) => msg.messageId === props.message?.messageId);
  
    if (messageIndex !== -1) {
      chatHistory.chatHistory[messageIndex].rating = rating;
    } else {
      chatHistory.chatHistory.push({
        messageId: props.message?.messageId,
        rating: rating,
      });
    }
  
    localStorage.setItem(storageKey, JSON.stringify(chatHistory));
  };
  
  const getRatingFromLocalStorage = () => {
    const storageKey = `${props.chatflowid}_EXTERNAL`; 
    const chatHistory = JSON.parse(localStorage.getItem(storageKey) || '{"chatHistory": []}');
  
    const message = chatHistory.chatHistory.find((msg: any) => msg.messageId === props.message?.messageId);
    return message ? message.rating : null;
  };
  
  const throttle = (func: (...args: any[]) => void, limit: number) => {
    let lastFunc: number | undefined;
    let lastRan = 0;

    return function(...args: any[]) {
        const now = Date.now();
        if (!lastRan || (now - lastRan >= limit)) {
            func(...args);
            lastRan = now;
        } else {
            clearTimeout(lastFunc);
            lastFunc = window.setTimeout(function() {
                func(...args);
                lastRan = Date.now();
            }, limit - (now - lastRan));
        }
    };
};

const sendFeedback = async (rating: 'THUMBS_UP' | 'THUMBS_DOWN') => {
    const body = {
        chatflowid: props.chatflowid,
        chatId: props.chatId,
        messageId: props.message?.messageId as string,
        rating: rating as FeedbackRatingType,
        content: '',
    };

    try {
        const result = await sendFeedbackQuery({
            chatflowid: props.chatflowid,
            apiHost: props.apiHost,
            body,
        });

        if (result.data) {
            const data = result.data as any;
            let id = '';
            if (data && data.id) id = data.id;

            // Update local state
            setRating(rating);
            setFeedbackId(id);
            setShowFeedbackContentModal(true);

            // Update colors based on rating
            if (rating === 'THUMBS_UP') {
                setThumbsUpColor('#006400');
                setThumbsDownColor(props.feedbackColor ?? defaultFeedbackColor);
            } else {
                setThumbsDownColor('#8B0000');
                setThumbsUpColor(props.feedbackColor ?? defaultFeedbackColor);
            }

            // Save to local storage after successful update
            saveRatingToLocalStorage(rating);
        } else {
            console.error('Feedback submission failed:', result);
        }
    } catch (error) {
        console.error('Error sending feedback:', error);
    }
};

// Use throttled version of sendFeedback
const throttledSendFeedback = throttle(sendFeedback, 2000); // Adjust the limit as needed

const onThumbsUpClick = async () => {
    if (rating() !== 'THUMBS_UP') {
        throttledSendFeedback('THUMBS_UP');
    }
};

const onThumbsDownClick = async () => {
    if (rating() !== 'THUMBS_DOWN') {
        throttledSendFeedback('THUMBS_DOWN');
    }
};
  const submitFeedbackContent = async (text: string) => {
    const body = {
      content: text,
    };
    const result = await updateFeedbackQuery({
      id: feedbackId(),
      apiHost: props.apiHost,
      body,
    });

    if (result.data) {
      setFeedbackId('');
      setShowFeedbackContentModal(false);
    }
  };

  onMount(() => {
    const savedRating = getRatingFromLocalStorage();
    if (savedRating) {
      setRating(savedRating);
      if (savedRating === 'THUMBS_UP') {
        setThumbsUpColor('#006400');
        setThumbsDownColor(props.feedbackColor ?? defaultFeedbackColor); // reset thumbs down color
      } else if (savedRating === 'THUMBS_DOWN') {
        setThumbsDownColor('#8B0000');
        setThumbsUpColor(props.feedbackColor ?? defaultFeedbackColor); // reset thumbs up color
      }
    }

    if (botMessageEl) {
      botMessageEl.innerHTML = Marked.parse(props.message.message);
      botMessageEl.querySelectorAll('a').forEach((link) => {
        link.target = '_blank';
      });
      if (props.fileAnnotations && props.fileAnnotations.length) {
        for (const annotations of props.fileAnnotations) {
          const button = document.createElement('button');
          button.textContent = annotations.fileName;
          button.className =
            'py-2 px-4 mb-2 justify-center font-semibold text-white focus:outline-none flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 transition-all filter hover:brightness-90 active:brightness-75 file-annotation-button';
          button.addEventListener('click', function () {
            downloadFile(annotations);
          });
          const svgContainer = document.createElement('div');
          svgContainer.className = 'ml-2';
          svgContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-download" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>`;
          button.appendChild(svgContainer);
          botMessageEl.appendChild(button);
        }
      }
    }

    if (botDetailsEl && props.isLoading) {
      botDetailsEl.open = true;
    }
  });

  createEffect(() => {
    if (botDetailsEl && props.isLoading) {
      botDetailsEl.open = true;
    } else if (botDetailsEl && !props.isLoading) {
      botDetailsEl.open = false;
    }
  });

  return (
    <div>
      <div class="flex flex-row justify-start mb-2 items-start host-container" style={{ 'margin-right': '50px' }}>
        <Show when={props.showAvatar}>
          <Avatar initialAvatarSrc={props.avatarSrc} />
        </Show>
        <div class="flex flex-col justify-start">
          {props.showAgentMessages && props.message.agentReasoning && (
            <details ref={botDetailsEl} class="mb-2 px-4 py-2 ml-2 chatbot-host-bubble rounded-[6px]">
              <summary class="cursor-pointer">
                <span class="italic">Agent Messages</span>
              </summary>
              <br />
              <For each={props.message.agentReasoning}>
                {(agent) => {
                  const agentMessages = agent.messages ?? [];
                  let msgContent = agent.instructions || (agentMessages.length > 1 ? agentMessages.join('\\n') : agentMessages[0]);
                  if (agentMessages.length === 0 && !agent.instructions) msgContent = `<p>Finished</p>`;
                  return (
                    <AgentReasoningBubble
                      agentName={agent.agentName ?? ''}
                      agentMessage={msgContent}
                      backgroundColor={props.backgroundColor}
                      textColor={props.textColor}
                      fontSize={props.fontSize}
                    />
                  );
                }}
              </For>
            </details>
          )}
          {props.message.message && (
            <span
              ref={botMessageEl}
              class="px-4 py-2 ml-2 max-w-full chatbot-host-bubble prose"
              data-testid="host-bubble"
              style={{
                'background-color': props.backgroundColor ?? defaultBackgroundColor,
                color: props.textColor ?? defaultTextColor,
                'border-radius': '6px',
                'font-size': props.fontSize ? `${props.fontSize}px` : `${defaultFontSize}px`,
              }}
            />
          )}
        </div>
      </div>
      <div>
        {props.chatFeedbackStatus && props.message.messageId && (
          <>
            <div class={`flex items-center px-2 pb-2 ${props.showAvatar ? 'ml-10' : ''}`}>
              <CopyToClipboardButton feedbackColor={props.feedbackColor} onClick={() => copyMessageToClipboard()} />
              <Show when={copiedMessage()}>
                <div class="copied-message" style={{ color: props.feedbackColor ?? defaultFeedbackColor }}>
                  Copied!
                </div>
              </Show>
              <ThumbsUpButton feedbackColor={thumbsUpColor()} isDisabled={rating() === 'THUMBS_UP'} rating={rating()} onClick={onThumbsUpClick} />
              <ThumbsDownButton
                feedbackColor={thumbsDownColor()}
                isDisabled={rating() === 'THUMBS_DOWN'}
                rating={rating()}
                onClick={onThumbsDownClick}
              />
            </div>
            <Show when={showFeedbackContentDialog()}>
              <FeedbackContentDialog
                isOpen={showFeedbackContentDialog()}
                onClose={() => setShowFeedbackContentModal(false)}
                onSubmit={submitFeedbackContent}
                backgroundColor={props.backgroundColor}
                textColor={props.textColor}
              />
            </Show>
          </>
        )}
      </div>
    </div>
  );
};
