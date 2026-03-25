import { createEffect, createMemo, Show, createSignal, onMount, For } from 'solid-js';
import { Avatar } from '../avatars/Avatar';
import { Marked } from '@ts-stack/markdown';
import DOMPurify from 'dompurify';
import { FeedbackRatingType, sendFeedbackQuery, sendFileDownloadQuery, updateFeedbackQuery } from '@/queries/sendMessageQuery';
import { FileUpload, IAction, MessageType } from '../Bot';
import { CopyToClipboardButton, RegenerateResponseButton, ThumbsDownButton, ThumbsUpButton } from '../buttons/FeedbackButtons';
import { TTSButton } from '../buttons/TTSButton';
import FeedbackContentDialog from '../FeedbackContentDialog';
import { AgentReasoningBubble } from './AgentReasoningBubble';
import { TickIcon, XIcon } from '../icons';
import { SourceBubble } from '../bubbles/SourceBubble';
import { DateTimeToggleTheme } from '@/features/bubble/types';
import { WorkflowTreeView } from '../treeview/WorkflowTreeView';
import { ThinkingCard } from './ThinkingBubble';

type Props = {
  message: MessageType;
  chatflowid: string;
  chatId: string;
  apiHost?: string;
  onRequest?: (request: RequestInit) => Promise<void>;
  fileAnnotations?: any;
  showAvatar?: boolean;
  avatarSrc?: string;
  backgroundColor?: string;
  textColor?: string;
  chatFeedbackStatus?: boolean;
  fontSize?: number;
  feedbackColor?: string;
  isLoading: boolean;
  dateTimeToggle?: DateTimeToggleTheme;
  showAgentMessages?: boolean;
  sourceDocsTitle?: string;
  renderHTML?: boolean;
  handleActionClick: (elem: any, action: IAction | undefined | null) => void;
  handleSourceDocumentsClick: (src: any) => void;
  showRegenerateResponseButton?: boolean;
  onRegenerateResponse?: () => void;
  // TTS props
  isTTSEnabled?: boolean;
  isTTSLoading?: Record<string, boolean>;
  isTTSPlaying?: Record<string, boolean>;
  handleTTSClick?: (messageId: string, messageText: string) => void;
  handleTTSStop?: (messageId: string) => void;
};

const defaultBackgroundColor = '#f7f8ff';
const defaultTextColor = '#303235';
const defaultFontSize = 16;
const defaultFeedbackColor = '#3B81F6';

export const BotBubble = (props: Props) => {
  let botDetailsEl: HTMLDetailsElement | undefined;

  Marked.setOptions({ isNoP: true, sanitize: props.renderHTML !== undefined ? !props.renderHTML : true });

  const [rating, setRating] = createSignal('');
  const [feedbackId, setFeedbackId] = createSignal('');
  const [showFeedbackContentDialog, setShowFeedbackContentModal] = createSignal(false);
  const [copiedMessage, setCopiedMessage] = createSignal(false);
  const [thumbsUpColor, setThumbsUpColor] = createSignal(props.feedbackColor ?? defaultFeedbackColor); // default color
  const [thumbsDownColor, setThumbsDownColor] = createSignal(props.feedbackColor ?? defaultFeedbackColor); // default color
  const [responseVersionIndex, setResponseVersionIndex] = createSignal(0);
  const [ratingByMessageId, setRatingByMessageId] = createSignal<Record<string, FeedbackRatingType>>({});

  // Store a reference to the bot message element for the copyMessageToClipboard function
  const [botMessageElement, setBotMessageElement] = createSignal<HTMLElement | null>(null);

  const responseVersions = createMemo(() => {
    if (props.message.responseVersions && props.message.responseVersions.length > 0) return props.message.responseVersions;
    return [props.message];
  });

  const totalResponseVersions = createMemo(() => responseVersions().length);
  const hasMultipleResponseVersions = createMemo(() => totalResponseVersions() > 1);

  const activeMessage = createMemo(() => {
    const versions = responseVersions();
    const safeIndex = Math.min(Math.max(responseVersionIndex(), 0), versions.length - 1);
    const selectedVersion = versions[safeIndex] ?? props.message;
    const isLatestVersion = safeIndex === versions.length - 1;
    if (isLatestVersion) {
      // Keep the newest version in sync with streaming updates stored in top-level message fields.
      return { ...selectedVersion, ...props.message };
    }
    return selectedVersion;
  });

  const currentRating = () => {
    const active = activeMessage();
    const activeMessageId = active.messageId;
    if (activeMessageId && ratingByMessageId()[activeMessageId]) return ratingByMessageId()[activeMessageId];
    return active.rating ?? '';
  };

  const setBotMessageRef = (el: HTMLSpanElement) => {
    if (el) {
      setBotMessageElement(el);
    }
  };

  createEffect(() => {
    const versions = responseVersions();
    if (versions.length === 0) {
      setResponseVersionIndex(0);
      return;
    }
    const defaultIndex = props.message.responseVersionIndex ?? versions.length - 1;
    const safeIndex = Math.min(Math.max(defaultIndex, 0), versions.length - 1);
    setResponseVersionIndex(safeIndex);
  });

  createEffect(() => {
    const el = botMessageElement();
    const messageData = activeMessage();
    if (el) {
      el.innerHTML = Marked.parse(messageData.message ?? '');

      // Apply textColor to all links, headings, and other markdown elements except code
      const textColor = props.textColor ?? defaultTextColor;
      el.querySelectorAll('a, h1, h2, h3, h4, h5, h6, strong, em, blockquote, li').forEach((element) => {
        (element as HTMLElement).style.color = textColor;
      });

      // Code blocks (with pre) get white text
      el.querySelectorAll('pre').forEach((element) => {
        (element as HTMLElement).style.color = '#FFFFFF';
        // Also ensure any code elements inside pre have white text
        element.querySelectorAll('code').forEach((codeElement) => {
          (codeElement as HTMLElement).style.color = '#FFFFFF';
        });
      });

      // Inline code (not in pre) gets green text
      el.querySelectorAll('code:not(pre code)').forEach((element) => {
        (element as HTMLElement).style.color = '#4CAF50'; // Green color
      });

      // Set target="_blank" for links
      el.querySelectorAll('a').forEach((link) => {
        link.target = '_blank';
      });

      const activeRating = currentRating();
      setRating(activeRating);
      if (activeRating === 'THUMBS_UP') {
        setThumbsUpColor('#006400');
        setThumbsDownColor(props.feedbackColor ?? defaultFeedbackColor);
      } else if (activeRating === 'THUMBS_DOWN') {
        setThumbsDownColor('#8B0000');
        setThumbsUpColor(props.feedbackColor ?? defaultFeedbackColor);
      } else {
        setThumbsUpColor(props.feedbackColor ?? defaultFeedbackColor);
        setThumbsDownColor(props.feedbackColor ?? defaultFeedbackColor);
      }
      const fileAnnotations = messageData.fileAnnotations ?? props.fileAnnotations;
      if (fileAnnotations && fileAnnotations.length) {
        for (const annotations of fileAnnotations) {
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
          el.appendChild(button);
        }
      }
    }
  });

  const downloadFile = async (fileAnnotation: any) => {
    try {
      const response = await sendFileDownloadQuery({
        apiHost: props.apiHost,
        body: { fileName: fileAnnotation.fileName, chatflowId: props.chatflowid, chatId: props.chatId } as any,
        onRequest: props.onRequest,
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
      const text = botMessageElement() ? botMessageElement()?.textContent : '';
      await navigator.clipboard.writeText(text || '');
      setCopiedMessage(true);
      setTimeout(() => {
        setCopiedMessage(false);
      }, 2000); // Hide the message after 2 seconds
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const saveToLocalStorage = (rating: FeedbackRatingType) => {
    const activeMessageId = activeMessage().messageId;
    if (!activeMessageId) return;
    const chatDetails = localStorage.getItem(`${props.chatflowid}_EXTERNAL`);
    if (!chatDetails) return;
    try {
      const parsedDetails = JSON.parse(chatDetails);
      const messages: MessageType[] = parsedDetails.chatHistory || [];
      let hasUpdate = false;
      for (const message of messages) {
        if (message.messageId === activeMessageId) {
          message.rating = rating;
          hasUpdate = true;
          continue;
        }
        if (message.responseVersions && message.responseVersions.length > 0) {
          for (const version of message.responseVersions) {
            if (version.messageId === activeMessageId) {
              version.rating = rating;
              hasUpdate = true;
            }
          }
        }
      }
      if (!hasUpdate) return;
      localStorage.setItem(`${props.chatflowid}_EXTERNAL`, JSON.stringify({ ...parsedDetails, chatHistory: messages }));
    } catch (e) {
      return;
    }
  };

  const isValidURL = (url: string): URL | undefined => {
    try {
      return new URL(url);
    } catch (err) {
      return undefined;
    }
  };

  const removeDuplicateURL = (message: MessageType) => {
    const visitedURLs: string[] = [];
    const newSourceDocuments: any = [];

    message.sourceDocuments.forEach((source: any) => {
      if (isValidURL(source.metadata.source) && !visitedURLs.includes(source.metadata.source)) {
        visitedURLs.push(source.metadata.source);
        newSourceDocuments.push(source);
      } else if (!isValidURL(source.metadata.source)) {
        newSourceDocuments.push(source);
      }
    });
    return newSourceDocuments;
  };

  const onThumbsUpClick = async () => {
    if (rating() === '') {
      const activeMessageId = activeMessage().messageId;
      if (!activeMessageId) return;
      const body = {
        chatflowid: props.chatflowid,
        chatId: props.chatId,
        messageId: activeMessageId,
        rating: 'THUMBS_UP' as FeedbackRatingType,
        content: '',
      };
      const result = await sendFeedbackQuery({
        chatflowid: props.chatflowid,
        apiHost: props.apiHost,
        body,
        onRequest: props.onRequest,
      });

      if (result.data) {
        const data = result.data as any;
        let id = '';
        if (data && data.id) id = data.id;
        setRating('THUMBS_UP');
        setRatingByMessageId((prev) => ({ ...prev, [activeMessageId]: 'THUMBS_UP' }));
        setFeedbackId(id);
        setShowFeedbackContentModal(true);
        // update the thumbs up color state
        setThumbsUpColor('#006400');
        saveToLocalStorage('THUMBS_UP');
      }
    }
  };

  const onThumbsDownClick = async () => {
    if (rating() === '') {
      const activeMessageId = activeMessage().messageId;
      if (!activeMessageId) return;
      const body = {
        chatflowid: props.chatflowid,
        chatId: props.chatId,
        messageId: activeMessageId,
        rating: 'THUMBS_DOWN' as FeedbackRatingType,
        content: '',
      };
      const result = await sendFeedbackQuery({
        chatflowid: props.chatflowid,
        apiHost: props.apiHost,
        body,
        onRequest: props.onRequest,
      });

      if (result.data) {
        const data = result.data as any;
        let id = '';
        if (data && data.id) id = data.id;
        setRating('THUMBS_DOWN');
        setRatingByMessageId((prev) => ({ ...prev, [activeMessageId]: 'THUMBS_DOWN' }));
        setFeedbackId(id);
        setShowFeedbackContentModal(true);
        // update the thumbs down color state
        setThumbsDownColor('#8B0000');
        saveToLocalStorage('THUMBS_DOWN');
      }
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
      onRequest: props.onRequest,
    });

    if (result.data) {
      setFeedbackId('');
      setShowFeedbackContentModal(false);
    }
  };

  onMount(() => {
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

  const renderArtifacts = (item: Partial<FileUpload>) => {
    // Instead of onMount, we'll use a callback ref to apply styles
    const setArtifactRef = (el: HTMLSpanElement) => {
      if (el) {
        const textColor = props.textColor ?? defaultTextColor;
        // Apply textColor to all elements except code blocks
        el.querySelectorAll('a, h1, h2, h3, h4, h5, h6, strong, em, blockquote, li').forEach((element) => {
          (element as HTMLElement).style.color = textColor;
        });

        // Code blocks (with pre) get white text
        el.querySelectorAll('pre').forEach((element) => {
          (element as HTMLElement).style.color = '#FFFFFF';
          // Also ensure any code elements inside pre have white text
          element.querySelectorAll('code').forEach((codeElement) => {
            (codeElement as HTMLElement).style.color = '#FFFFFF';
          });
        });

        // Inline code (not in pre) gets green text
        el.querySelectorAll('code:not(pre code)').forEach((element) => {
          (element as HTMLElement).style.color = '#4CAF50'; // Green color
        });

        el.querySelectorAll('a').forEach((link) => {
          link.target = '_blank';
        });
      }
    };

    return (
      <>
        <Show when={item.type === 'png' || item.type === 'jpeg'}>
          <div class="flex items-center justify-center p-0 m-0">
            <img
              class="w-full h-full bg-cover"
              src={(() => {
                const isFileStorage = typeof item.data === 'string' && item.data.startsWith('FILE-STORAGE::');
                return isFileStorage
                  ? `${props.apiHost}/api/v1/get-upload-file?chatflowId=${props.chatflowid}&chatId=${props.chatId}&fileName=${(
                      item.data as string
                    ).replace('FILE-STORAGE::', '')}`
                  : (item.data as string);
              })()}
            />
          </div>
        </Show>
        <Show when={item.type === 'html'}>
          <div class="mt-2">
            <div innerHTML={DOMPurify.sanitize(item.data as string)} />
          </div>
        </Show>
        <Show when={item.type !== 'png' && item.type !== 'jpeg' && item.type !== 'html'}>
          <span
            ref={setArtifactRef}
            innerHTML={Marked.parse(item.data as string)}
            class="prose"
            style={{
              'background-color': props.backgroundColor ?? defaultBackgroundColor,
              color: props.textColor ?? defaultTextColor,
              'border-radius': '6px',
              'font-size': props.fontSize ? `${props.fontSize}px` : `${defaultFontSize}px`,
            }}
          />
        </Show>
      </>
    );
  };

  const formatDateTime = (dateTimeString: string | undefined, showDate: boolean | undefined, showTime: boolean | undefined) => {
    if (!dateTimeString) return '';

    try {
      const date = new Date(dateTimeString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid ISO date string:', dateTimeString);
        return '';
      }

      let formatted = '';

      if (showDate) {
        const dateFormatter = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        const [{ value: month }, , { value: day }, , { value: year }] = dateFormatter.formatToParts(date);
        formatted = `${month.charAt(0).toUpperCase() + month.slice(1)} ${day}, ${year}`;
      }

      if (showTime) {
        const timeFormatter = new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        const timeString = timeFormatter.format(date).toLowerCase();
        formatted = formatted ? `${formatted}, ${timeString}` : timeString;
      }

      return formatted;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const activeArtifacts = createMemo(() => activeMessage().artifacts ?? []);
  const activeSourceDocuments = createMemo(() => activeMessage().sourceDocuments ?? []);

  return (
    <div>
      <div class="flex flex-row justify-start mb-2 items-start host-container" style={{ 'margin-right': '50px' }}>
        <Show when={props.showAvatar}>
          <Avatar initialAvatarSrc={props.avatarSrc} />
        </Show>
        <div class="flex flex-col justify-start">
          {props.showAgentMessages &&
            activeMessage().agentFlowExecutedData &&
            Array.isArray(activeMessage().agentFlowExecutedData) &&
            activeMessage().agentFlowExecutedData.length > 0 && (
              <div>
                <WorkflowTreeView
                  workflowData={activeMessage().agentFlowExecutedData}
                  indentationLevel={24}
                  apiHost={props.apiHost}
                  chatflowid={props.chatflowid}
                  chatId={props.chatId}
                />
              </div>
            )}
          {props.showAgentMessages && activeMessage().agentReasoning && (
            <details ref={botDetailsEl} class="mb-2 px-4 py-2 ml-2 chatbot-host-bubble rounded-[6px]">
              <summary class="cursor-pointer">
                <span class="italic">Agent Messages</span>
              </summary>
              <br />
              <For each={activeMessage().agentReasoning}>
                {(agent) => {
                  const agentMessages = agent.messages ?? [];
                  let msgContent = agent.instructions || (agentMessages.length > 1 ? agentMessages.join('\\n') : agentMessages[0]);
                  if (agentMessages.length === 0 && !agent.instructions) msgContent = `<p>Finished</p>`;
                  return (
                    <AgentReasoningBubble
                      agentName={agent.agentName ?? ''}
                      agentMessage={msgContent}
                      agentArtifacts={agent.artifacts}
                      backgroundColor={props.backgroundColor}
                      textColor={props.textColor}
                      fontSize={props.fontSize}
                      apiHost={props.apiHost}
                      chatflowid={props.chatflowid}
                      chatId={props.chatId}
                      renderHTML={props.renderHTML}
                    />
                  );
                }}
              </For>
            </details>
          )}
          {activeArtifacts().length > 0 && (
            <div class="flex flex-row items-start flex-wrap w-full gap-2">
              <For each={activeArtifacts()}>
                {(item) => {
                  return item !== null ? <>{renderArtifacts(item)}</> : null;
                }}
              </For>
            </div>
          )}
          {activeMessage().thinking && (
            <div class="ml-2 mb-1 max-w-full">
              <ThinkingCard
                thinking={activeMessage().thinking}
                thinkingDuration={activeMessage().thinkingDuration}
                isThinking={activeMessage().isThinking}
                backgroundColor={props.backgroundColor ?? defaultBackgroundColor}
                textColor={props.textColor ?? defaultTextColor}
              />
            </div>
          )}
          {activeMessage().message && (
            <span
              ref={setBotMessageRef}
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
          {activeMessage().action && (
            <div class="px-4 py-2 flex flex-row justify-start space-x-2">
              <For each={activeMessage().action?.elements || []}>
                {(action) => {
                  return (
                    <>
                      {(action.type === 'approve-button' && action.label === 'Yes') || action.type === 'agentflowv2-approve-button' ? (
                        <button
                          type="button"
                          class="px-4 py-2 font-medium text-green-600 border border-green-600 rounded-full hover:bg-green-600 hover:text-white transition-colors duration-300 flex items-center space-x-2"
                          onClick={() => props.handleActionClick(action, activeMessage().action)}
                        >
                          <TickIcon />
                          &nbsp;
                          {action.label}
                        </button>
                      ) : (action.type === 'reject-button' && action.label === 'No') || action.type === 'agentflowv2-reject-button' ? (
                        <button
                          type="button"
                          class="px-4 py-2 font-medium text-red-600 border border-red-600 rounded-full hover:bg-red-600 hover:text-white transition-colors duration-300 flex items-center space-x-2"
                          onClick={() => props.handleActionClick(action, activeMessage().action)}
                        >
                          <XIcon isCurrentColor={true} />
                          &nbsp;
                          {action.label}
                        </button>
                      ) : (
                        <button type="button">{action.label}</button>
                      )}
                    </>
                  );
                }}
              </For>
            </div>
          )}
        </div>
      </div>
      <div>
        {activeSourceDocuments().length > 0 && (
          <>
            <Show when={props.sourceDocsTitle}>
              <span class="px-2 py-[10px] font-semibold">{props.sourceDocsTitle}</span>
            </Show>
            <div style={{ display: 'flex', 'flex-direction': 'row', width: '100%', 'flex-wrap': 'wrap' }}>
              <For each={[...removeDuplicateURL({ ...activeMessage(), sourceDocuments: activeSourceDocuments() } as MessageType)]}>
                {(src) => {
                  const URL = isValidURL(src.metadata.source);
                  return (
                    <SourceBubble
                      pageContent={src.metadata.title ? src.metadata.title : URL ? URL.pathname : src.pageContent}
                      metadata={src.metadata}
                      onSourceClick={() => {
                        if (URL) {
                          window.open(src.metadata.source, '_blank');
                        } else {
                          props.handleSourceDocumentsClick(src);
                        }
                      }}
                    />
                  );
                }}
              </For>
            </div>
          </>
        )}
      </div>
      <div>
        <div class={`flex items-center px-2 pb-2 ${props.showAvatar ? 'ml-10' : ''}`}>
          <Show when={props.isTTSEnabled && (activeMessage().id || activeMessage().messageId)}>
            <TTSButton
              feedbackColor={props.feedbackColor}
              isLoading={(() => {
                const messageId = activeMessage().id || activeMessage().messageId;
                return !!(messageId && props.isTTSLoading?.[messageId]);
              })()}
              isPlaying={(() => {
                const messageId = activeMessage().id || activeMessage().messageId;
                return !!(messageId && props.isTTSPlaying?.[messageId]);
              })()}
              onClick={() => {
                const messageId = activeMessage().id || activeMessage().messageId;
                if (!messageId) return; // Don't allow TTS for messages without valid IDs

                const messageText = activeMessage().message || '';
                if (props.isTTSLoading?.[messageId]) {
                  return; // Prevent multiple clicks while loading
                }
                if (props.isTTSPlaying?.[messageId]) {
                  props.handleTTSStop?.(messageId);
                } else {
                  props.handleTTSClick?.(messageId, messageText);
                }
              }}
            />
          </Show>
          {props.chatFeedbackStatus && activeMessage().messageId && (
            <>
              <Show when={hasMultipleResponseVersions()}>
                <div class="text-sm text-gray-500 mr-2 flex items-center">
                  <button
                    type="button"
                    class="px-1"
                    disabled={responseVersionIndex() === 0}
                    onClick={() => setResponseVersionIndex((prev) => Math.max(0, prev - 1))}
                    title="Previous response"
                  >
                    {'<'}
                  </button>
                  <span>{`${responseVersionIndex() + 1}/${totalResponseVersions()}`}</span>
                  <button
                    type="button"
                    class="px-1"
                    disabled={responseVersionIndex() === totalResponseVersions() - 1}
                    onClick={() => setResponseVersionIndex((prev) => Math.min(totalResponseVersions() - 1, prev + 1))}
                    title="Next response"
                  >
                    {'>'}
                  </button>
                </div>
              </Show>
              <Show when={props.showRegenerateResponseButton}>
                <RegenerateResponseButton feedbackColor={props.feedbackColor} onClick={() => props.onRegenerateResponse?.()} />
              </Show>
              <CopyToClipboardButton feedbackColor={props.feedbackColor} onClick={() => copyMessageToClipboard()} />
              <Show when={copiedMessage()}>
                <div class="copied-message" style={{ color: props.feedbackColor ?? defaultFeedbackColor }}>
                  Copied!
                </div>
              </Show>
              {rating() === '' || rating() === 'THUMBS_UP' ? (
                <ThumbsUpButton feedbackColor={thumbsUpColor()} isDisabled={rating() === 'THUMBS_UP'} rating={rating()} onClick={onThumbsUpClick} />
              ) : null}
              {rating() === '' || rating() === 'THUMBS_DOWN' ? (
                <ThumbsDownButton
                  feedbackColor={thumbsDownColor()}
                  isDisabled={rating() === 'THUMBS_DOWN'}
                  rating={rating()}
                  onClick={onThumbsDownClick}
                />
              ) : null}
              <Show when={activeMessage().dateTime}>
                <div class="text-sm text-gray-500 ml-2">
                  {formatDateTime(activeMessage().dateTime, props?.dateTimeToggle?.date, props?.dateTimeToggle?.time)}
                </div>
              </Show>
            </>
          )}
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
      </div>
    </div>
  );
};
