import { createSignal, createEffect, For, onMount, Show, createMemo } from 'solid-js';
import { v4 as uuidv4 } from 'uuid';
import { sendMessageQuery, isStreamAvailableQuery, IncomingInput, getChatbotConfig, MessageBE } from '@/queries/sendMessageQuery';
import { TextInput } from './inputs/textInput';
import { GuestBubble } from './bubbles/GuestBubble';
import { BotBubble } from './bubbles/BotBubble';
import { LoadingBubble } from './bubbles/LoadingBubble';
import { SourceBubble } from './bubbles/SourceBubble';
import { StarterPromptBubble } from './bubbles/StarterPromptBubble';
import { BotMessageTheme, TextInputTheme, UserMessageTheme } from '@/features/bubble/types';
import socketIOClient from 'socket.io-client';
import { Popup } from '@/features/popup';
import { Avatar } from '@/components/avatars/Avatar';
import { DeleteButton } from '@/components/SendButton';
import { products, setProducts, updateProducts } from './Products';
import { EventStreamContentType, fetchEventSource } from "@microsoft/fetch-event-source";

type messageType = 'apiMessage' | 'userMessage' | 'usermessagewaiting';

export type InstagramMetadata = {
  caption: string;
  kind: string;
  pk: number;
  resource_url: string;
  subtitles: string;
}

export type ItemMetadata = {
  name: string;
  price: string;
  url: string;
}

export type SourceDocument = {
  page_content: string;
  metadata: ItemMetadata | InstagramMetadata;
  type: "Document";
}


export type MessageType = {
  message: string;
  type: messageType;
  sourceDocuments?: SourceDocument[];
  fileAnnotations?: any;
};

export type UserProps = {
  customerEmail: string;
  customerName: string;
};

export type BotProps = {
  chatflowid: string;
  apiHost?: string;
  chatflowConfig?: Record<string, unknown>;
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

class RetriableError extends Error { }
class FatalError extends Error { }


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
  const [socketIOClientId, setSocketIOClientId] = createSignal('');
  const [isChatFlowAvailableToStream, setIsChatFlowAvailableToStream] = createSignal(false);

  const [chatId, setChatId] = createSignal(props.customerEmail);
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

  const getSkus = (message: string) => {
    return [...(message.matchAll(/<pr sku=(\d+)><\/pr>/g))].map((m) => m[1]);
  };

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

  const updateLastMessageSourceDocuments = (sourceDocuments: SourceDocument[]) => {
    console.log('updateLastMessageSourceDocuments', sourceDocuments);
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
  }

  // Handle form submission
  const handleSubmit = async (value: string) => {
    console.log('handleSubmit', value);
    setUserInput(value);

    if (value.trim() === '') {
      return;
    }

    setLoading(true);
    scrollToBottom();

    // Send user question and history to API
    const messageList: MessageBE[] = messages().map((message) => {
      return { content: message.message, type:  messageTypeFEtoBE(message.type) };
    });

    setMessages((prevMessages) => {
      const messages: MessageType[] = [...prevMessages, { message: value, type: 'userMessage' }];
      addChatMessage(messages);
      return messages;
    });

    const body: IncomingInput = {
      input: {
        question: value,
        chat_history: messageList,
      },
      config: {},
    };

    // if (props.chatflowConfig) body.overrideConfig = props.chatflowConfig;

    // if (isChatFlowAvailableToStream()) body.socketIOClientId = socketIOClientId();

    setIsChatFlowAvailableToStream(false);
    const abortCtrl = new AbortController();
    setMessages((prevMessages) => {
      const messages: MessageType[] = [
        ...prevMessages,
        { message: "", type: 'apiMessage'},
      ];
      return messages;
    });
    
    let currMsg = "";

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
        // if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
        //     return; // everything's good
        // } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        //     // client-side errors are usually non-retriable:
        //     throw new FatalError();
        // } else {
        //     throw new RetriableError();
        // }
      },
      onmessage(ev) {
        console.log('EventSource message:', ev.data);
        if (ev.event === 'metadata') {
          const data = JSON.parse(ev.data);
          setChatId(data.run_id);
        } else if (ev.event === 'close') {
          abortCtrl.abort();
        }
        else if (ev.event === 'data') {
          const data = JSON.parse(ev.data);
          if (data.answer) {
            currMsg += data.answer;
            updateLastMessage(data.answer);
          } else if (data.context) {
            updateLastMessageSourceDocuments(data.context);
          }
        }
      },

    });

    setIsChatFlowAvailableToStream(true);
    setLoading(false);
    setUserInput('');
    scrollToBottom();

    setMessages((prevMessages) => {
      const messages: MessageType[] = [
        ...prevMessages
      ];
      addChatMessage(messages);
      return messages;
    });

    // if (result.data) {
    //   const data = result.data;
    //   if (!isChatFlowAvailableToStream()) {
    //     let text = '';
    //     if (data.text) text = data.text;
    //     else if (data.json) text = JSON.stringify(data.json, null, 2);
    //     else text = JSON.stringify(data, null, 2);

    //     setMessages((prevMessages) => {
    //       const messages: MessageType[] = [
    //         ...prevMessages,
    //         { message: text, sourceDocuments: data?.sourceDocuments, fileAnnotations: data?.fileAnnotations, type: 'apiMessage' },
    //       ];
    //       addChatMessage(messages);
    //       return messages;
    //     });
    //   }
    //   setLoading(false);
    //   setUserInput('');
    //   scrollToBottom();
    // }
    // if (result.error) {
    //   const error = result.error;
    //   console.error(error);
    //   const err: any = error;
    //   const errorData = typeof err === 'string' ? err : err.response.data || `${err.response.status}: ${err.response.statusText}`;
    //   handleError(errorData);
    //   return;
    // }
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
      const localChats: {chatHistory: MessageType[], chatId: string} = JSON.parse(localChatsData);
      setChatId(localChats.chatId);
      const msgs: MessageType[] = [];
      localChats.chatHistory.forEach((message: MessageType) => {
        msgs.push(message);
        setMessages([...msgs]);
        updateLastMessage("");
      });
    }
    setIsChatFlowAvailableToStream(true);

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
                  {message.sourceDocuments && (message.sourceDocuments.length > 0) && (
                    <div class='flex-row flex-wrap'>
                      <For each={message.sourceDocuments}>
                        {(src: SourceDocument) => {
                          const URL = src.metadata.url || src.metadata.resource_url;
                          return (
                            <SourceBubble
                              pageContent={src.page_content}
                              metadata={src.metadata}
                              onSourceClick={() => {
                                window.open(URL, '_blank');
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
              background: props.topbarColor,
              color: props.bubbleTextColor,
              'border-bottom-color': props.bubbleButtonColor,
            }}
            class={(props.isFullPage ? 'fixed' : 'absolute rounded-t-3xl') + " flex flex-row items-center top-0 left-0 w-full border-b-2 h-14"}
          >
            <div class='w-2' />
            <Show when={props.titleAvatarSrc}>
                <Avatar initialAvatarSrc={props.titleAvatarSrc} />
            </Show>
            <Show when={props.title}>
              <span class="px-3 whitespace-pre-wrap font-semibold max-w-full" style={{"font-family":"Jost","color":props.titleColor}}>{props.title}</span>
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
            <div style={{ display: 'flex', 'flex-direction': 'row', padding: '10px', width: '100%', 'flex-wrap': 'wrap' }}>
              <For each={[...starterPrompts()]}>{(key) => <StarterPromptBubble prompt={key} onPromptClick={() => promptClick(key)} />}</For>
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


