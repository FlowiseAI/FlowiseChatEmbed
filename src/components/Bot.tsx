import { createSignal, createEffect, For, onMount, Show, createMemo } from 'solid-js';
import { v4 as uuidv4 } from 'uuid';
import { sendMessageQuery, isStreamAvailableQuery, IncomingInput, getChatbotConfig, MessageBE } from '@/queries/sendMessageQuery';
import { TextInput } from './inputs/textInput';
import { GuestBubble } from './bubbles/GuestBubble';
import { BotBubble } from './bubbles/BotBubble';
import { LoadingBubble } from './bubbles/LoadingBubble';
import { Slideshow, ProductSourcesBubble, InstagramSourcesBubble } from './bubbles/SourceBubble';
import { StarterPromptBubble } from './bubbles/StarterPromptBubble';
import { BotMessageTheme, TextInputTheme, UserMessageTheme } from '@/features/bubble/types';
import socketIOClient from 'socket.io-client';
import { Popup } from '@/features/popup';
import { Avatar } from '@/components/avatars/Avatar';
import { DeleteButton } from '@/components/SendButton';
import { products, setProducts, updateProducts } from './Products';
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';
import { config } from 'process';
import { create } from 'lodash';

type messageType = 'apiMessage' | 'userMessage' | 'usermessagewaiting';

export type InstagramMetadata = {
  caption: string;
  kind: string;
  pk: number;
  resource_url: string;
  media_url: string;
  subtitles: string;
};

export type ProductMetadata = {
  name: string;
  price: string;
  item_url: string;
};

export type SourceDocument = {
  page_content: string;
  metadata: ProductMetadata | InstagramMetadata;
  type: 'Document';
};

export type ContextEvent = {
  context: SourceDocument[]; // JSON string of source documents
};

export type AnswerEvent = {
  answer: string;
};

export type MetadataEvent = {
  run_id: string;
};

export type MessageType = {
  message: string;
  type: messageType;
  sourceProducts?: SourceDocument[];
  sourceInstagramPosts?: SourceDocument[];
  fileAnnotations?: any;
};

export type UserProps = {
  customerEmail: string;
  customerName: string;
};

export type BotProps = {
  chatflowid: string;
  apiHost: string;
  chatflowConfig?: Record<string, unknown>;
  starterPrompts?: string[];
  welcomeMessage?: string;
  botMessage?: BotMessageTheme;
  userMessage?: UserMessageTheme;
  textInput?: TextInputTheme;
  poweredByTextColor?: string;
  badgeBackgroundColor?: string;
  bubbleButtonColor?: string;
  topbarColor?: string;
  bubbleTextColor?: string;
  titleColor?: string;
  title?: string;
  titleAvatarSrc?: string;
  fontSize?: number;
  isFullPage?: boolean;
};

const defaultWelcomeMessage = 'Hi there! How can I help?';

class RetriableError extends Error {}
class FatalError extends Error {}

/*const sourceDocuments = [
    {
        "pageContent": "I know some are talking about “living with COVID-19”. Tonight – I say that we will never just accept living with COVID-19. \r\n\r\nWe will continue to combat the virus as we do other diseases. And because this is a virus that mutates and spreads, we will stay on guard. \r\n\r\nHere are four common sense steps as we move forward safely.  \r\n\r\nFirst, stay protected with vaccines and treatments. We know how incredibly effective vaccines are. If you’re vaccinated and boosted you have the highest degree of protection. \r\n\r\nWe will never give up on vaccinating more Americans. Now, I know parents with kids under 5 are eager to see a vaccine authorized for their children. \r\n\r\nThe scientists are working hard to get that done and we’ll be ready with plenty of vaccines when they do. \r\n\r\nWe’re also ready with anti-viral treatments. If you get COVID-19, the Pfizer pill reduces your chances of ending up in the hospital by 90%.",
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
    },
    {
        "pageContent": "sistance,  and  polishing  [65].  For  instance,  AI  tools  generate\nsuggestions based on inputting keywords or topics. The tools\nanalyze  search  data,  trending  topics,  and  popular  queries  to\ncreate  fresh  content.  What’s  more,  AIGC  assists  in  writing\narticles and posting blogs on specific topics. While these tools\nmay not be able to produce high-quality content by themselves,\nthey can provide a starting point for a writer struggling with\nwriter’s block.\nH.  Cons of AIGC\nOne of the main concerns among the public is the potential\nlack  of  creativity  and  human  touch  in  AIGC.  In  addition,\nAIGC sometimes lacks a nuanced understanding of language\nand context, which may lead to inaccuracies and misinterpre-\ntations. There are also concerns about the ethics and legality\nof using AIGC, particularly when it results in issues such as\ncopyright  infringement  and  data  privacy.  In  this  section,  we\nwill discuss some of the disadvantages of AIGC (Table IV).",
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
        "pageContent": "Main article: Views of Elon Musk",
        "metadata": {
          "source": "https://en.wikipedia.org/wiki/Elon_Musk",
          "loc": {
            "lines": {
              "from": 2409,
              "to": 2409
            }
          }
        }
    },
    {
        "pageContent": "First Name: John\nLast Name: Doe\nAddress: 120 jefferson st.\nStates: Riverside\nCode: NJ\nPostal: 8075",
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

export const Bot = (props: BotProps & { class?: string } & UserProps) => {
  let chatContainer: HTMLDivElement | undefined;
  let bottomSpacer: HTMLDivElement | undefined;
  let botContainer: HTMLDivElement | undefined;
  console.log('props', props);

  const [userInput, setUserInput] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [sourcePopupOpen, setSourcePopupOpen] = createSignal(false);
  const [sourcePopupSrc, setSourcePopupSrc] = createSignal({});
  const [messages, setMessages] = createSignal<MessageType[]>(
    [
      {
        message: props.welcomeMessage ?? defaultWelcomeMessage,
        type: 'apiMessage',
      },
    ],
    { equals: false },
  );
  const [isChatFlowAvailableToStream, setIsChatFlowAvailableToStream] = createSignal(false);

  const [chatId, setChatId] = createSignal(props.customerEmail);
  const [starterPrompts, setStarterPrompts] = createSignal<string[]>(props.starterPrompts || [], { equals: false });

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

  const getSkus = (message: string) => {
    return [...message.matchAll(/<pr sku=(\d+)><\/pr>/g)].map((m) => m[1]);
  };

  const addEmptyMessage = () =>
    setMessages((prevMessages) => {
      const messages: MessageType[] = [...prevMessages, { message: '', type: 'apiMessage' }];
      return messages;
    });

  const updateLastMessage = (new_token: string) => {
    setMessages((data) => {
      const lastMsg = data[data.length - 1].message;

      const skus = getSkus(lastMsg);

      skus.forEach((sku) => {
        if (products().has(sku)) {
          return;
        }
        updateProducts(sku);
        setProducts((prevProducts) => {
          const newProducts = new Map(prevProducts);
          newProducts.set(sku, { loading: true });
          return newProducts;
        });
        return;
      });

      const updated = data.map((item, i) => {
        if (i === data.length - 1) {
          return { ...item, message: item.message + new_token };
        }
        return item;
      });
      addChatMessage(updated);
      return [...updated];
    });
  };

  const updateLastMessageSources = (sourceProducts?: SourceDocument[], sourceInstagramPosts?: SourceDocument[]) => {
    setMessages((data) => {
      const updated = data.map((item, i) => {
        if (i === data.length - 1) {
          return {
            ...item,
            sourceProducts: sourceProducts || item.sourceProducts,
            sourceInstagramPosts: sourceInstagramPosts || item.sourceInstagramPosts,
          };
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

  const messageTypeFEtoBE = (msg: messageType) => {
    switch (msg) {
      case 'apiMessage':
        return 'ai';
      case 'userMessage':
        return 'human';
      case 'usermessagewaiting':
        return 'human';
      default:
        return 'system';
    }
  };

  // Handle form submission
  const handleSubmit = async (value: string) => {
    console.log('handleSubmit', value);
    setUserInput(value);

    if (value.trim() === '') {
      return;
    }

    setLoading(true);
    scrollToBottom();

    setMessages((prevMessages) => {
      const messages: MessageType[] = [...prevMessages, { message: value, type: 'userMessage' }];
      addChatMessage(messages);
      return messages;
    });

    // Send user question and history to API
    const messageList: MessageBE[] = messages().map((message) => {
      return { content: message.message, type: messageTypeFEtoBE(message.type) };
    });
    const body: IncomingInput = {
      input: {
        question: value,
        chat_history: messageList,
      },
      config: {},
    };

    setIsChatFlowAvailableToStream(false);
    const abortCtrl = new AbortController();

    let currMsg = '';
    let sourceProducts: SourceDocument[] = [];
    let sourceInstagramPosts: SourceDocument[] = [];

    await fetchEventSource(`${props.apiHost}/${props.chatflowid}/stream`, {
      signal: abortCtrl.signal,
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
      openWhenHidden: true,
      onclose: () => {
        console.log('EventSource closed');
      },
      onerror: (err) => {
        console.error('EventSource error:', err);
        abortCtrl.abort();
      },
      onopen: async (response) => {
        console.log('EventSource opened', response);
      },
      onmessage(ev) {
        console.log('EventSource message:', ev.data);
        if (ev.event === 'metadata') {
          const data: MetadataEvent = JSON.parse(ev.data);
          setChatId(data.run_id);
        } else if (ev.event === 'close') {
          abortCtrl.abort();
        } else if (ev.event === 'data') {
          const data: ContextEvent | AnswerEvent = JSON.parse(ev.data);
          if (data.answer) {
            if (currMsg === '') {
              addEmptyMessage();
            }
            currMsg += data.answer;
            updateLastMessage(data.answer);
          } else if (data.context) {
            let ctx: SourceDocument[] = data.context;
            sourceInstagramPosts = ctx.filter((doc) => doc.metadata?.media_url);
            sourceProducts = ctx.filter((doc) => doc.metadata?.item_url);
          }
        }
      },
    });

    setIsChatFlowAvailableToStream(true);
    updateLastMessageSources(sourceProducts, sourceInstagramPosts);
    setLoading(false);
    setUserInput('');
    scrollToBottom();

    setMessages((prevMessages) => {
      const messages: MessageType[] = [...prevMessages];
      addChatMessage(messages);
      return messages;
    });
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
    const localChatsData = localStorage.getItem(`${props.chatflowid}_EXTERNAL`);
    if (localChatsData) {
      const localChats: { chatHistory: MessageType[]; chatId: string } = JSON.parse(localChatsData);
      setChatId(localChats.chatId);
      const msgs: MessageType[] = [];
      localChats.chatHistory.forEach((message: MessageType) => {
        msgs.push(message);
        setMessages([...msgs]);
        updateLastMessage('');
      });
    }
    setIsChatFlowAvailableToStream(true);

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
    };
  });

  const isValidURL = (url: string): URL | undefined => {
    try {
      return new URL(url);
    } catch (err) {
      return undefined;
    }
  };

  return (
    <>
      <div
        ref={botContainer}
        class={'relative flex w-full h-full text-base overflow-hidden bg-cover bg-center flex-col items-center chatbot-container ' + props.class}
      >
        <div class="flex w-full h-full justify-center pb-5 pt-16">
          <div
            ref={chatContainer}
            class="overflow-y-scroll min-w-full w-full min-h-full px-3 pt-10 relative scrollable-container chatbot-chat-view scroll-smooth"
          >
            <For each={messages()}>
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
                  {message.sourceProducts && message.sourceProducts.length > 0 && (
                    <ProductSourcesBubble sources={message.sourceProducts} backgroundColor={props.botMessage?.backgroundColor} />
                  )}
                  {message.sourceInstagramPosts && message.sourceInstagramPosts.length > 0 && (
                    <InstagramSourcesBubble sources={message.sourceInstagramPosts} backgroundColor={props.botMessage?.backgroundColor} />
                  )}
                </>
              )}
            </For>
          </div>
          <div
            style={{
              background: props.topbarColor,
              color: props.bubbleTextColor,
              'border-bottom-color': props.bubbleButtonColor,
            }}
            class={(props.isFullPage ? 'fixed' : 'absolute rounded-t-3xl') + ' flex flex-row items-center top-0 left-0 w-full border-b-2 h-14'}
          >
            <div class="w-2" />
            <Show when={props.titleAvatarSrc}>
              <Avatar initialAvatarSrc={props.titleAvatarSrc} />
            </Show>
            <Show when={props.title}>
              <span class="px-3 whitespace-pre-wrap font-semibold max-w-full" style={{ 'font-family': 'Jost', color: props.titleColor }}>
                {props.title}
              </span>
            </Show>
            <div style={{ flex: 1 }} />
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
            isFullPage={props.isFullPage}
            clearChat={clearChat}
            isDeleteEnabled={messages().length > 1}
          />
        </div>
        <Show when={messages().length === 1}>
          <Show when={starterPrompts().length > 0}>
            <div class="relative flex flex-row p-2 w-full flex-wrap">
              <For each={[...starterPrompts()]}>{(prompt) => <StarterPromptBubble prompt={prompt} onPromptClick={() => promptClick(prompt)} />}</For>
            </div>
          </Show>
        </Show>
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
  return <div ref={props.ref} class="w-full h-16" />;
};
