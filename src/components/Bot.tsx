import { createSignal, createEffect, For, onMount, Show } from 'solid-js';
import { v4 as uuidv4 } from 'uuid';
import { sendMessageQuery, isStreamAvailableQuery, IncomingInput, getChatbotConfig } from '@/queries/sendMessageQuery';
import { TextInput } from './inputs/textInput';
import { GuestBubble } from './bubbles/GuestBubble';
import { BotBubble } from './bubbles/BotBubble';
import { LoadingBubble } from './bubbles/LoadingBubble';
import { SourceBubble } from './bubbles/SourceBubble';
import { StarterPromptBubble } from './bubbles/StarterPromptBubble';
import { BotMessageTheme, TextInputTheme, UserMessageTheme } from '@/features/bubble/types';
import { Badge } from './Badge';
import socketIOClient from 'socket.io-client';
import { Popup } from '@/features/popup';
import { Avatar } from '@/components/avatars/Avatar';
import { DeleteButton } from '@/components/SendButton';

type messageType = 'apiMessage' | 'userMessage' | 'usermessagewaiting';

export type MessageType = {
  message: string;
  type: messageType;
  sourceDocuments?: any;
  fileAnnotations?: any;
};

export type BotProps = {
  chatflowid: string;
  apiHost?: string;
  document_text?: string;
  chatflowConfig?: Record<string, unknown>;
  welcomeMessage?: string;
  botMessage?: BotMessageTheme;
  userMessage?: UserMessageTheme;
  textInput?: TextInputTheme;
  poweredByTextColor?: string;
  badgeBackgroundColor?: string;
  bubbleBackgroundColor?: string;
  bubbleTextColor?: string;
  title?: string;
  titleAvatarSrc?: string;
  fontSize?: number;
  isFullPage?: boolean;
};

const defaultWelcomeMessage = 'Hello, how can I help?</br><small>rewrite, improve, summarize, lengthen, shorten...</small>';

/*const sourceDocuments = [
    {
        "pageContent": "Build faster, with more focus. From the small stuff to the big picture, our product organizes work so teams are clear what to do, why it matters, and how to get it done.",
        "metadata": {
          "source": "blob",
          "blobType": "",
          "loc": {
            "lines": {
              "from": 450,
              "to": 462
            }
          }
        }
    }
  ,
    {
        "pageContent": "The HP Garage is a private museum where the company Hewlett-Packard (HP) was founded. It is located at 367 Addison Avenue in Palo Alto, California. It is considered to be the 'Birthplace of Silicon Valley'. The garage has since been designated a California Historical Landmark and is listed on the National Register of Historic Places. Though not open for public tours, the property can be viewed from the sidewalk and driveway. History: The home, originally designated as 367 Addison Avenue, was first occupied in 1905 by John Spencer, his wife Ione, and their two adult daughters. John Spencer became Palo Alto's first mayor in 1909. In 1918, the house was divided into two separate apartments, numbered 367 and 369. In 1937, David 'Dave' Packard, then 25 years old, visited William 'Bill' Hewlett in Palo Alto and the pair had their first business meeting. Both men attended Stanford University, where its Dean of Engineering Frederick Terman encouraged his students to establish their own electronics companies in the area instead of leaving California. In 1938, newly married Dave and Lucile Packard moved into 367 Addison Ave, the first-floor three-room apartment, with Bill Hewlett sleeping in the shed. Mrs. Spencer, now widowed, moved into the second-floor apartment, 369 Addison. Hewlett and Packard began to use the one-car garage, with $538 (equivalent to $11,185 in 2022) in capital. In 1939, Packard and Hewlett formed their partnership with a coin toss, creating the name Hewlett-Packard. Hewlett-Packard's first product, built in the garage, was an audio oscillator, the HP200A. One of Hewlett-Packard's first customers was Walt Disney Studios, which purchased eight oscillators to test and certify the sound systems in theaters that were going to run the first major film released in stereophonic sound, Fantasia.",
        "metadata": {
          "source": "blob",
          "blobType": "",
          "pdf": {
            "version": "1.10.100",
            "info": {
              "PDFFormatVersion": "1.5",
              "IsAcroFormPresent": false,
              "IsXFAPresent": false,
              "Title": "",
              "Author": "",
              "Subject": "",
              "Keywords": "",
              "Creator": "LaTeX with hyperref",
              "Producer": "pdfTeX-1.40.21",
              "CreationDate": "D:20230414003603Z",
              "ModDate": "D:20230414003603Z",
              "Trapped": {
                "name": "False"
              }
            },
            "metadata": null,
            "totalPages": 17
          },
          "loc": {
            "pageNumber": 8,
            "lines": {
              "from": 301,
              "to": 317
            }
          }
        }
    },
    {
        "pageContent": "Main article: HP Garage",
        "metadata": {
          "source": "https://en.wikipedia.org/wiki/HP_Garage,
          "loc": {
            "lines": {
              "from": 2409,
              "to": 2409
            }
          }
        }
    },
    {
        "pageContent": "First Name: Hewlett\nLast Name: Packard\nAddress: 367 Addison Avenue\nStates: Palo Alto\nCode: CA\nPostal: 94301",
        "metadata": {
          "source": "blob",
          "blobType": "",
          "line": 1,
          "loc": {
            "lines": {
              "from": 1,
              "to": 6
            }
          }
        }
    },
]*/

export const Bot = (props: BotProps & { class?: string }) => {
  let chatContainer: HTMLDivElement | undefined;
  let bottomSpacer: HTMLDivElement | undefined;
  let botContainer: HTMLDivElement | undefined;

  const [userInput, setUserInput] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [sourcePopupOpen, setSourcePopupOpen] = createSignal(false);
  const [sourcePopupSrc, setSourcePopupSrc] = createSignal({});
  const [messages, setMessages] = createSignal<MessageType[]>(
    [
      {
        message: 'Context: <small>' + props.document_text + '</small>' ?? 'Nothing selected.',
        type: 'apiMessage',
      },
      {
        message: props.welcomeMessage ?? defaultWelcomeMessage,
        type: 'apiMessage',
      },
    ],
    { equals: false },
  );
  const [socketIOClientId, setSocketIOClientId] = createSignal('');
  const [isChatFlowAvailableToStream, setIsChatFlowAvailableToStream] = createSignal(false);
  const [chatId, setChatId] = createSignal(uuidv4());
  const [starterPrompts, setStarterPrompts] = createSignal<string[]>([], { equals: false });

  onMount(() => {
    if (!bottomSpacer) return;
    setTimeout(() => {
      chatContainer?.scrollTo(0, chatContainer.scrollHeight);
    }, 50);
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      chatContainer?.scrollTo(0, chatContainer.scrollHeight);
    }, 50);
  };

  /**
   * Add each chat message into localStorage
   */
  const addChatMessage = (allMessage: MessageType[]) => {
    localStorage.setItem(`${props.chatflowid}_EXTERNAL`, JSON.stringify({ chatId: chatId(), chatHistory: allMessage }));
  };

  const updateLastMessage = (text: string) => {
    setMessages((data) => {
      const updated = data.map((item, i) => {
        if (i === data.length - 1) {
          return { ...item, message: item.message + text };
        }
        return item;
      });
      addChatMessage(updated);
      return [...updated];
    });
  };

  const updateLastMessageSourceDocuments = (sourceDocuments: any) => {
    setMessages((data) => {
      const updated = data.map((item, i) => {
        if (i === data.length - 1) {
          return { ...item, sourceDocuments: sourceDocuments };
        }
        return item;
      });
      addChatMessage(updated);
      return [...updated];
    });
  };

  // Handle errors
  const handleError = (message = 'Oops! There seems to be an error. Please try again.') => {
    setMessages((prevMessages) => {
      const messages: MessageType[] = [...prevMessages, { message, type: 'apiMessage' }];
      addChatMessage(messages);
      return messages;
    });
    setLoading(false);
    setUserInput('');
    scrollToBottom();
  };

  const promptClick = (prompt: string) => {
    handleSubmit(prompt);
  };

  // Handle form submission
  const handleSubmit = async (value: string) => {
    setUserInput(value);

    if (value.trim() === '') {
      return;
    }

    setLoading(true);
    scrollToBottom();

    // Send user question and history to API
    const welcomeMessage = props.welcomeMessage ?? defaultWelcomeMessage;
    const messageList = messages().filter((msg) => msg.message !== welcomeMessage);

    setMessages((prevMessages) => {
      const messages: MessageType[] = [...prevMessages, { message: value, type: 'userMessage' }];
      addChatMessage(messages);
      return messages;
    });

    const body: IncomingInput = {
      question: value + '. Use this context: ' + props.document_text,
      history: messageList,
      chatId: chatId(),
    };

    if (props.chatflowConfig) body.overrideConfig = props.chatflowConfig;

    if (isChatFlowAvailableToStream()) body.socketIOClientId = socketIOClientId();

    const result = await sendMessageQuery({
      chatflowid: props.chatflowid,
      apiHost: props.apiHost,
      body,
    });

    if (result.data) {
      const data = result.data;
      if (!isChatFlowAvailableToStream()) {
        let text = '';
        if (data.text) text = data.text;
        else if (data.json) text = JSON.stringify(data.json, null, 2);
        else text = JSON.stringify(data, null, 2);

        setMessages((prevMessages) => {
          const messages: MessageType[] = [
            ...prevMessages,
            { message: text, sourceDocuments: data?.sourceDocuments, fileAnnotations: data?.fileAnnotations, type: 'apiMessage' },
          ];
          addChatMessage(messages);
          return messages;
        });
      }
      setLoading(false);
      setUserInput('');
      scrollToBottom();
    }
    if (result.error) {
      const error = result.error;
      console.error(error);
      const err: any = error;
      const errorData = typeof err === 'string' ? err : err.response.data || `${err.response.status}: ${err.response.statusText}`;
      handleError(errorData);
      return;
    }
  };

  const clearChat = () => {
    try {
      localStorage.removeItem(`${props.chatflowid}_EXTERNAL`);
      setChatId(uuidv4());
      setMessages([
        {
          message: props.welcomeMessage ?? defaultWelcomeMessage,
          type: 'apiMessage',
        },
      ]);
    } catch (error: any) {
      const errorData = error.response.data || `${error.response.status}: ${error.response.statusText}`;
      console.error(`error: ${errorData}`);
    }
  };

  // Auto scroll chat to bottom
  createEffect(() => {
    if (messages()) scrollToBottom();
  });

  createEffect(() => {
    if (props.fontSize && botContainer) botContainer.style.fontSize = `${props.fontSize}px`;
  });

  // eslint-disable-next-line solid/reactivity
  createEffect(async () => {
    const chatMessage = localStorage.getItem(`${props.chatflowid}_EXTERNAL`);
    if (chatMessage) {
      const objChatMessage = JSON.parse(chatMessage);
      setChatId(objChatMessage.chatId);
      const loadedMessages = objChatMessage.chatHistory.map((message: MessageType) => {
        const chatHistory: MessageType = {
          message: message.message,
          type: message.type,
        };
        if (message.sourceDocuments) chatHistory.sourceDocuments = message.sourceDocuments;
        if (message.fileAnnotations) chatHistory.fileAnnotations = message.fileAnnotations;
        return chatHistory;
      });
      setMessages([...loadedMessages]);
    }

    // Determine if particular chatflow is available for streaming
    const { data } = await isStreamAvailableQuery({
      chatflowid: props.chatflowid,
      apiHost: props.apiHost,
    });

    if (data) {
      setIsChatFlowAvailableToStream(data?.isStreaming ?? false);
    }

    // Get the chatbotConfig
    const result = await getChatbotConfig({
      chatflowid: props.chatflowid,
      apiHost: props.apiHost,
    });

    if (result.data) {
      const chatbotConfig = result.data;
      if (chatbotConfig.starterPrompts) {
        const prompts: string[] = [];
        Object.getOwnPropertyNames(chatbotConfig.starterPrompts).forEach((key) => {
          prompts.push(chatbotConfig.starterPrompts[key].prompt);
        });
        setStarterPrompts(prompts);
      }
    }

    const socket = socketIOClient(props.apiHost as string);

    socket.on('connect', () => {
      setSocketIOClientId(socket.id);
    });

    socket.on('start', () => {
      setMessages((prevMessages) => [...prevMessages, { message: '', type: 'apiMessage' }]);
    });

    socket.on('sourceDocuments', updateLastMessageSourceDocuments);

    socket.on('token', updateLastMessage);

    // eslint-disable-next-line solid/reactivity
    return () => {
      setUserInput('');
      setLoading(false);
      setMessages([
        {
          message: props.welcomeMessage ?? defaultWelcomeMessage,
          type: 'apiMessage',
        },
      ]);
      if (socket) {
        socket.disconnect();
        setSocketIOClientId('');
      }
    };
  });

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

  return (
    <>
      <div
        ref={botContainer}
        class={'relative flex w-full h-full text-base overflow-hidden bg-cover bg-center flex-col items-center chatbot-container ' + props.class}
      >
        <div class="flex w-full h-full justify-center">
          <div
            style={{ 'padding-bottom': '100px', 'padding-top': '70px' }}
            ref={chatContainer}
            class="overflow-y-scroll min-w-full w-full min-h-full px-3 pt-10 relative scrollable-container chatbot-chat-view scroll-smooth"
          >
            <For each={[...messages()]}>
              {(message, index) => (
                <>
                  {message.type === 'userMessage' && (
                    <GuestBubble
                      message={message.message}
                      backgroundColor={props.userMessage?.backgroundColor}
                      textColor={props.userMessage?.textColor}
                      showAvatar={props.userMessage?.showAvatar}
                      avatarSrc={props.userMessage?.avatarSrc}
                    />
                  )}
                  {message.type === 'apiMessage' && (
                    <BotBubble
                      message={message.message}
                      fileAnnotations={message.fileAnnotations}
                      apiHost={props.apiHost}
                      backgroundColor={props.botMessage?.backgroundColor}
                      textColor={props.botMessage?.textColor}
                      showAvatar={props.botMessage?.showAvatar}
                      avatarSrc={props.botMessage?.avatarSrc}
                    />
                  )}
                  {message.type === 'userMessage' && loading() && index() === messages().length - 1 && <LoadingBubble />}
                  {message.sourceDocuments && message.sourceDocuments.length && (
                    <div style={{ display: 'flex', 'flex-direction': 'row', width: '100%' }}>
                      <For each={[...removeDuplicateURL(message)]}>
                        {(src) => {
                          const URL = isValidURL(src.metadata.source);
                          return (
                            <SourceBubble
                              pageContent={URL ? URL.pathname : src.pageContent}
                              metadata={src.metadata}
                              onSourceClick={() => {
                                if (URL) {
                                  window.open(src.metadata.source, '_blank');
                                } else {
                                  setSourcePopupSrc(src);
                                  setSourcePopupOpen(true);
                                }
                              }}
                            />
                          );
                        }}
                      </For>
                    </div>
                  )}
                </>
              )}
            </For>
          </div>
          <div
            style={{
              display: 'flex',
              'flex-direction': 'row',
              'align-items': 'center',
              height: '50px',
              position: props.isFullPage ? 'fixed' : 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              background: props.bubbleBackgroundColor,
              color: props.bubbleTextColor,
              'border-top-left-radius': props.isFullPage ? '0px' : '6px',
              'border-top-right-radius': props.isFullPage ? '0px' : '6px',
            }}
          >
            <Show when={props.titleAvatarSrc}>
              <>
                <div style={{ width: '15px' }} />
                <Avatar initialAvatarSrc={props.titleAvatarSrc} />
              </>
            </Show>
            <Show when={props.title}>
              <span class="px-3 whitespace-pre-wrap font-semibold max-w-full">{props.title}</span>
            </Show>
            <div style={{ flex: 1 }} />
            <DeleteButton
              sendButtonColor={props.bubbleTextColor}
              type="button"
              isDisabled={messages().length === 1}
              class="my-2 ml-2"
              on:click={clearChat}
            >
              <span style={{ 'font-family': 'Poppins, sans-serif' }}>Clear</span>
            </DeleteButton>
          </div>
          <TextInput
            backgroundColor={props.textInput?.backgroundColor}
            textColor={props.textInput?.textColor}
            placeholder={props.textInput?.placeholder}
            sendButtonColor={props.textInput?.sendButtonColor}
            fontSize={props.fontSize}
            disabled={loading()}
            defaultValue={userInput()}
            onSubmit={handleSubmit}
          />
        </div>
        <Show when={messages().length === 1}>
          <Show when={starterPrompts().length > 0}>
            <div style={{ display: 'flex', 'flex-direction': 'row', padding: '10px', width: '100%', 'flex-wrap': 'wrap' }}>
              <For each={[...starterPrompts()]}>{(key) => <StarterPromptBubble prompt={key} onPromptClick={() => promptClick(key)} />}</For>
            </div>
          </Show>
        </Show>
        <Badge badgeBackgroundColor={props.badgeBackgroundColor} poweredByTextColor={props.poweredByTextColor} botContainer={botContainer} />
        <BottomSpacer ref={bottomSpacer} />
      </div>
      {sourcePopupOpen() && <Popup isOpen={sourcePopupOpen()} value={sourcePopupSrc()} onClose={() => setSourcePopupOpen(false)} />}
    </>
  );
};

type BottomSpacerProps = {
  ref: HTMLDivElement | undefined;
};
const BottomSpacer = (props: BottomSpacerProps) => {
  return <div ref={props.ref} class="w-full h-32" />;
};
