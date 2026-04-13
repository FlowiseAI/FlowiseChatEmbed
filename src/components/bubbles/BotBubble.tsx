import { createEffect, Show, createSignal, onMount, For } from 'solid-js';
import { Avatar } from '../avatars/Avatar';
import { Marked } from '@ts-stack/markdown';
import DOMPurify from 'dompurify';
import { FeedbackRatingType, sendFeedbackQuery, sendFileDownloadQuery, updateFeedbackQuery } from '@/queries/sendMessageQuery';
import { FileUpload, IAction, MessageType } from '../Bot';
import { CopyToClipboardButton, ThumbsDownButton, ThumbsUpButton } from '../buttons/FeedbackButtons';
import { RegenerateResponseButton } from '../buttons/RegenerateResponseButton';
import { TracesButton } from '../buttons/TracesButton';
import { TTSButton } from '../buttons/TTSButton';
import FeedbackContentDialog from '../FeedbackContentDialog';
import { AgentReasoningBubble } from './AgentReasoningBubble';
import { DownloadFileIcon, TickIcon, XIcon } from '../icons';
import { SourceBubble } from '../bubbles/SourceBubble';
import { DateTimeToggleTheme } from '@/features/bubble/types';
import { TracesDialog } from '../treeview/TracesDialog';
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
  onRegenerateResponse?: () => void;
  onMessageRendered?: () => void;
  messageRatings?: Record<string, FeedbackRatingType>;
  onMessageRatingChange?: (messageId: string, rating: FeedbackRatingType) => void;
  // TTS props
  isTTSEnabled?: boolean;
  isTTSLoading?: Record<string, boolean>;
  isTTSPlaying?: Record<string, boolean>;
  handleTTSClick?: (messageId: string, messageText: string) => void;
  handleTTSStop?: (messageId: string) => void;
  hasCustomHeader?: boolean;
  dialogContainer?: HTMLElement;
};

const defaultBackgroundColor = '#f7f8ff';
const defaultTextColor = '#303235';
const defaultFontSize = 16;
const defaultFeedbackColor = '#3B81F6';

export const BotBubble = (props: Props) => {
  let botDetailsEl: HTMLDetailsElement | undefined;

  Marked.setOptions({ isNoP: true, sanitize: props.renderHTML !== undefined ? !props.renderHTML : true });

  const [feedbackId, setFeedbackId] = createSignal('');
  const [showFeedbackContentDialog, setShowFeedbackContentModal] = createSignal(false);
  const [copiedMessage, setCopiedMessage] = createSignal(false);
  const [isTracesDialogOpen, setIsTracesDialogOpen] = createSignal(false);

  // Store a reference to the bot message element for the copyMessageToClipboard function
  const [botMessageElement, setBotMessageElement] = createSignal<HTMLElement | null>(null);

  const currentRating = () => {
    const messageId = props.message.messageId;
    if (!messageId) return props.message.rating ?? '';
    return props.messageRatings?.[messageId] ?? props.message.rating ?? '';
  };

  const thumbsUpColor = () => (currentRating() === 'THUMBS_UP' ? '#006400' : props.feedbackColor ?? defaultFeedbackColor);
  const thumbsDownColor = () => (currentRating() === 'THUMBS_DOWN' ? '#8B0000' : props.feedbackColor ?? defaultFeedbackColor);

  const renderMarkdownHtml = (content: string) => {
    const html = Marked.parse(content);
    return html.replace(/<a(?![^>]*\btarget=)([^>]*)>/g, '<a target="_blank" rel="noopener noreferrer"$1>');
  };

  const setBotMessageRef = (el: HTMLSpanElement | null) => {
    setBotMessageElement(el);
  };

  const notifyMessageRendered = () => {
    props.onMessageRendered?.();
  };

  createEffect(() => {
    const el = botMessageElement();
    const message = props.message.message ?? '';
    if (!el) return;

    // Update innerHTML synchronously so the DOM reflects the correct height
    // before any scroll logic runs — avoids async mismatch that causes jumping.
    el.innerHTML = renderMarkdownHtml(message);

    el.querySelectorAll('img').forEach((img) => {
      if ((img as HTMLImageElement).complete) return;
      img.addEventListener('load', notifyMessageRendered, { once: true });
      img.addEventListener('error', notifyMessageRendered, { once: true });
    });
    notifyMessageRendered();
  });

  createEffect(() => {
    if (props.fileAnnotations?.length) props.onMessageRendered?.();
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
    const chatDetails = localStorage.getItem(`${props.chatflowid}_EXTERNAL`);
    if (!chatDetails) return;
    try {
      const parsedDetails = JSON.parse(chatDetails);
      const messages: MessageType[] = parsedDetails.chatHistory || [];
      const message = messages.find((msg) => msg.messageId === props.message.messageId);
      if (!message) return;
      message.rating = rating;
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

    const sourceDocuments = Array.isArray(message.sourceDocuments) ? message.sourceDocuments : [];
    sourceDocuments.forEach((source: any) => {
      if (!source || !source.metadata) return;
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
    if (currentRating() === '') {
      const messageId = props.message?.messageId;
      if (!messageId) return;
      const body = {
        chatflowid: props.chatflowid,
        chatId: props.chatId,
        messageId,
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
        props.onMessageRatingChange?.(messageId, 'THUMBS_UP');
        setFeedbackId(id);
        setShowFeedbackContentModal(true);
        saveToLocalStorage('THUMBS_UP');
      }
    }
  };

  const onThumbsDownClick = async () => {
    if (currentRating() === '') {
      const messageId = props.message?.messageId;
      if (!messageId) return;
      const body = {
        chatflowid: props.chatflowid,
        chatId: props.chatId,
        messageId,
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
        props.onMessageRatingChange?.(messageId, 'THUMBS_DOWN');
        setFeedbackId(id);
        setShowFeedbackContentModal(true);
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
    return (
      <>
        <Show when={item.type === 'png' || item.type === 'jpeg'}>
          <div class="flex items-center justify-center p-0 m-0">
            <img
              class="w-full h-full bg-cover"
              decoding="async"
              src={(() => {
                const isFileStorage = typeof item.data === 'string' && item.data.startsWith('FILE-STORAGE::');
                return isFileStorage
                  ? `${props.apiHost}/api/v1/get-upload-file?chatflowId=${props.chatflowid}&chatId=${props.chatId}&fileName=${(
                      item.data as string
                    ).replace('FILE-STORAGE::', '')}`
                  : (item.data as string);
              })()}
              onLoad={() => props.onMessageRendered?.()}
              onError={() => props.onMessageRendered?.()}
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
            innerHTML={renderMarkdownHtml(item.data as string)}
            class="chatbot-host-bubble prose bot-markdown-content"
            style={{
              'background-color': props.backgroundColor ?? defaultBackgroundColor,
              color: props.textColor ?? defaultTextColor,
              'border-radius': '6px',
              'font-size': props.fontSize ? `${props.fontSize}px` : `${defaultFontSize}px`,
              '--bot-markdown-text-color': props.textColor ?? defaultTextColor,
              '--bot-markdown-code-color': '#FFFFFF',
              '--bot-markdown-inline-code-color': '#4CAF50',
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
          {props.message.artifacts && props.message.artifacts.length > 0 && (
            <div class="flex flex-row items-start flex-wrap w-full gap-2">
              <For each={props.message.artifacts}>
                {(item) => {
                  return item !== null ? <>{renderArtifacts(item)}</> : null;
                }}
              </For>
            </div>
          )}
          {props.message.thinking && (
            <div class="ml-2 mb-1 max-w-full">
              <ThinkingCard
                thinking={props.message.thinking}
                thinkingDuration={props.message.thinkingDuration}
                isThinking={props.message.isThinking}
                backgroundColor={props.backgroundColor ?? defaultBackgroundColor}
                textColor={props.textColor ?? defaultTextColor}
              />
            </div>
          )}
          {props.message.message && (
            <>
              <span
                ref={setBotMessageRef}
                class="px-4 py-2 ml-2 max-w-full chatbot-host-bubble prose bot-markdown-content"
                data-testid="host-bubble"
                style={{
                  'background-color': props.backgroundColor ?? defaultBackgroundColor,
                  color: props.textColor ?? defaultTextColor,
                  'border-radius': '6px',
                  'font-size': props.fontSize ? `${props.fontSize}px` : `${defaultFontSize}px`,
                  '--bot-markdown-text-color': props.textColor ?? defaultTextColor,
                  '--bot-markdown-code-color': '#FFFFFF',
                  '--bot-markdown-inline-code-color': '#4CAF50',
                }}
              />
              <For each={props.fileAnnotations || []}>
                {(annotations) => (
                  <button
                    type="button"
                    class="py-2 px-4 mb-2 ml-2 justify-center font-semibold text-white focus:outline-none flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100 transition-all filter hover:brightness-90 active:brightness-75 file-annotation-button"
                    onClick={() => downloadFile(annotations)}
                  >
                    {annotations.fileName}
                    <div class="ml-2">
                      <DownloadFileIcon />
                    </div>
                  </button>
                )}
              </For>
            </>
          )}
          {props.message.action && (
            <div class="px-4 py-2 flex flex-row justify-start space-x-2">
              <For each={props.message.action.elements || []}>
                {(action) => {
                  return (
                    <>
                      {(action.type === 'approve-button' && action.label === 'Yes') || action.type === 'agentflowv2-approve-button' ? (
                        <button
                          type="button"
                          class="px-4 py-2 font-medium text-green-600 border border-green-600 rounded-full hover:bg-green-600 hover:text-white transition-colors duration-300 flex items-center space-x-2"
                          onClick={() => props.handleActionClick(action, props.message.action)}
                        >
                          <TickIcon />
                          &nbsp;
                          {action.label}
                        </button>
                      ) : (action.type === 'reject-button' && action.label === 'No') || action.type === 'agentflowv2-reject-button' ? (
                        <button
                          type="button"
                          class="px-4 py-2 font-medium text-red-600 border border-red-600 rounded-full hover:bg-red-600 hover:text-white transition-colors duration-300 flex items-center space-x-2"
                          onClick={() => props.handleActionClick(action, props.message.action)}
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
        {props.message.sourceDocuments && props.message.sourceDocuments.length > 0 && (
          <div style={{ padding: '6px 8px 2px 8px' }}>
            <Show when={props.sourceDocsTitle}>
              <span
                class="px-2 py-[10px] font-semibold"
                style={{
                  display: 'block',
                  'font-size': '11px',
                  'text-transform': 'uppercase',
                  'margin-bottom': '4px',
                }}
              >
                {props.sourceDocsTitle}
              </span>
            </Show>
            <div style={{ display: 'flex', 'flex-direction': 'row', width: '100%', 'flex-wrap': 'wrap', gap: '6px' }}>
              <For each={[...removeDuplicateURL(props.message)]}>
                {(src) => {
                  const URL = isValidURL(src.metadata.source);
                  return (
                    <SourceBubble
                      pageContent={src.metadata.title ? src.metadata.title : URL ? URL.pathname : src.pageContent}
                      metadata={src.metadata}
                      backgroundColor={props.backgroundColor ?? defaultBackgroundColor}
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
          </div>
        )}
      </div>
      <div>
        <div class={`flex items-center px-2 pb-2 ${props.showAvatar ? 'ml-10' : ''}`}>
          <Show when={props.isTTSEnabled && (props.message.id || props.message.messageId)}>
            <TTSButton
              feedbackColor={props.feedbackColor}
              isLoading={(() => {
                const messageId = props.message.id || props.message.messageId;
                return !!(messageId && props.isTTSLoading?.[messageId]);
              })()}
              isPlaying={(() => {
                const messageId = props.message.id || props.message.messageId;
                return !!(messageId && props.isTTSPlaying?.[messageId]);
              })()}
              onClick={() => {
                const messageId = props.message.id || props.message.messageId;
                if (!messageId) return; // Don't allow TTS for messages without valid IDs

                const messageText = props.message.message || '';
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
          {props.chatFeedbackStatus && props.message.messageId && (
            <>
              <RegenerateResponseButton
                class="regenerate-response-button"
                feedbackColor={props.feedbackColor}
                onClick={() => props.onRegenerateResponse?.()}
              />
              <CopyToClipboardButton feedbackColor={props.feedbackColor} onClick={() => copyMessageToClipboard()} />
              <Show when={copiedMessage()}>
                <div class="copied-message" style={{ color: props.feedbackColor ?? defaultFeedbackColor }}>
                  Copied!
                </div>
              </Show>
              {currentRating() === '' || currentRating() === 'THUMBS_UP' ? (
                <ThumbsUpButton
                  feedbackColor={thumbsUpColor()}
                  isDisabled={currentRating() === 'THUMBS_UP'}
                  rating={currentRating()}
                  onClick={onThumbsUpClick}
                />
              ) : null}
              {currentRating() === '' || currentRating() === 'THUMBS_DOWN' ? (
                <ThumbsDownButton
                  feedbackColor={thumbsDownColor()}
                  isDisabled={currentRating() === 'THUMBS_DOWN'}
                  rating={currentRating()}
                  onClick={onThumbsDownClick}
                />
              ) : null}
              <Show when={props.message.dateTime}>
                <div class="text-sm text-gray-500 ml-2">
                  {formatDateTime(props.message.dateTime, props?.dateTimeToggle?.date, props?.dateTimeToggle?.time)}
                </div>
              </Show>
            </>
          )}
          {!props.isLoading &&
            props.showAgentMessages &&
            props.message.message &&
            props.message.agentFlowExecutedData &&
            Array.isArray(props.message.agentFlowExecutedData) &&
            props.message.agentFlowExecutedData.length > 0 && (
              <TracesButton feedbackColor={props.feedbackColor} onClick={() => setIsTracesDialogOpen(true)} />
            )}
        </div>
        <TracesDialog
          isOpen={isTracesDialogOpen()}
          onClose={() => setIsTracesDialogOpen(false)}
          workflowData={props.message.agentFlowExecutedData}
          backgroundColor={props.backgroundColor}
          textColor={props.textColor}
          apiHost={props.apiHost}
          chatflowid={props.chatflowid}
          chatId={props.chatId}
          hasCustomHeader={props.hasCustomHeader}
          dialogContainer={props.dialogContainer}
        />
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
