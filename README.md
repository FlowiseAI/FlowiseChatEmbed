<!-- markdownlint-disable MD030 -->

# Flowise Embed

Javascript library to display flowise chatbot on your website

![Flowise](https://github.com/FlowiseAI/FlowiseChatEmbed/blob/main/images/ChatEmbed.gif?raw=true)

Install:

```bash
yarn install
```

Dev:

```bash
yarn dev
```

Build:

```bash
yarn build
```

## Embed in your HTML

### PopUp

```html
<script type="module">
  import Chatbot from 'https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js';
  Chatbot.init({
    chatflowid: '<chatflowid>',
    apiHost: 'http://localhost:3000',
  });
</script>
```

### FullPage

```html
<script type="module">
  import Chatbot from 'https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js';
  Chatbot.initFull({
    chatflowid: '<chatflowid>',
    apiHost: 'http://localhost:3000',
  });
</script>
<flowise-fullchatbot></flowise-fullchatbot>
```

To enable full screen, add `margin: 0` to <code>body</code> style, and confirm you don't set height and width

```html
<body style="margin: 0">
  <script type="module">
    import Chatbot from 'https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js';
    Chatbot.initFull({
      chatflowid: '<chatflowid>',
      apiHost: 'http://localhost:3000',
      theme: {
        chatWindow: {
          // height: 700, don't set height
          // width: 400, don't set width
        },
      },
    });
  </script>
</body>
```

## Configuration

You can also customize chatbot with different configuration

```html
<script type="module">
  import Chatbot from 'https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js';
  Chatbot.init({
    chatflowid: '91e9c803-5169-4db9-8207-3c0915d71c5f',
    apiHost: 'http://localhost:3000',
    chatflowConfig: {
      // topK: 2
    },
    observersConfig: {
      // (optional) Allows you to execute code in parent based upon signal observations within the chatbot.
      // The userinput field submitted to bot ("" when reset by bot)
      observeUserInput: (userInput) => {
        console.log({ userInput });
      },
      // The bot message stack has changed
      observeMessages: (messages) => {
        console.log({ messages });
      },
      // The bot loading signal changed
      observeLoading: (loading) => {
        console.log({ loading });
      },
    },
    theme: {
      button: {
        backgroundColor: '#3B81F6',
        right: 20,
        bottom: 20,
        size: 48, // small | medium | large | number
        dragAndDrop: true,
        iconColor: 'white',
        customIconSrc: 'https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/google-messages.svg',
        autoWindowOpen: {
          autoOpen: true, //parameter to control automatic window opening
          openDelay: 2, // Optional parameter for delay time in seconds
          autoOpenOnMobile: false, //parameter to control automatic window opening in mobile
        },
      },
      tooltip: {
        showTooltip: true,
        tooltipMessage: 'Hi There 👋!',
        tooltipBackgroundColor: 'black',
        tooltipTextColor: 'white',
        tooltipFontSize: 16,
      },
      disclaimer: {
        title: 'Disclaimer',
        message: 'By using this chatbot, you agree to the <a target="_blank" href="https://flowiseai.com/terms">Terms & Condition</a>',
      },
      chatWindow: {
        showTitle: true,
        showAgentMessages: true,
        title: 'Flowise Bot',
        titleAvatarSrc: 'https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/google-messages.svg',
        welcomeMessage: 'Hello! This is custom welcome message',
        errorMessage: 'This is a custom error message',
        backgroundColor: '#ffffff',
        backgroundImage: 'enter image path or link', // If set, this will overlap the background color of the chat window.
        height: 700,
        width: 400,
        fontSize: 16,
        starterPrompts: ['What is a bot?', 'Who are you?'], // It overrides the starter prompts set by the chat flow passed
        starterPromptFontSize: 15,
        clearChatOnReload: false, // If set to true, the chat will be cleared when the page reloads
        sourceDocsTitle: 'Sources:',
        renderHTML: true,
        botMessage: {
          backgroundColor: '#f7f8ff',
          textColor: '#303235',
          showAvatar: true,
          avatarSrc: 'https://raw.githubusercontent.com/zahidkhawaja/langchain-chat-nextjs/main/public/parroticon.png',
        },
        userMessage: {
          backgroundColor: '#3B81F6',
          textColor: '#ffffff',
          showAvatar: true,
          avatarSrc: 'https://raw.githubusercontent.com/zahidkhawaja/langchain-chat-nextjs/main/public/usericon.png',
        },
        textInput: {
          placeholder: 'Type your question',
          backgroundColor: '#ffffff',
          textColor: '#303235',
          sendButtonColor: '#3B81F6',
          maxChars: 50,
          maxCharsWarningMessage: 'You exceeded the characters limit. Please input less than 50 characters.',
          autoFocus: true, // If not used, autofocus is disabled on mobile and enabled on desktop. true enables it on both, false disables it on both.
          sendMessageSound: true,
          // sendSoundLocation: "send_message.mp3", // If this is not used, the default sound effect will be played if sendSoundMessage is true.
          receiveMessageSound: true,
          // receiveSoundLocation: "receive_message.mp3", // If this is not used, the default sound effect will be played if receiveSoundMessage is true.
        },
        feedback: {
          color: '#303235',
        },
        dateTimeToggle: {
          date: true,
          time: true,
        },
        footer: {
          textColor: '#303235',
          text: 'Powered by',
          company: 'Flowise',
          companyLink: 'https://flowiseai.com',
        },
      },
    },
  });
</script>
```

## (Experimental) Proxy Server Setup

The Flowise Embed Proxy Server enhances the security of your chatbot implementation by acting as a protective intermediary layer. This server eliminates the need to expose sensitive Flowise instance details in your frontend code and provides several key security benefits:

![Proxy Server](https://github.com/FlowiseAI/FlowiseChatEmbed/blob/main/images/proxyserver.png?raw=true)

- **Enhanced Security**: Conceals your Flowise API host and chatflow IDs from client-side exposure
- **Access Control**: Implements strict domain-based restrictions for chatbot embedding
- **Secure Communication**: Acts as a secure gateway for all interactions between your website and Flowise instance
- **Authentication Management**: Handles API key authentication securely on the server side, away from client exposure
- **Request Validation**: Validates all incoming requests before forwarding them to your Flowise instance

This proxy server can be deployed to any Node.js hosting platform.

### Quick Start

1. Configure environment:
```bash
# Copy .env.example to .env and configure:
API_HOST=https://your-flowise-instance.com
FLOWISE_API_KEY=your-api-key
CHATFLOW_1=agent1:50db97c6-64c9-4333-bab4-7d6202171602,https://example1.com # Format: CHATFLOW_[NUMBER]=[identifier]:[chatflowId],[allowedDomain]
CHATFLOW_2=agent2:3c28f529-a70f-4459-9bc5-4f4c5d03d8c8,https://example2.com,https://another-example2.com # Format: CHATFLOW_[NUMBER]=[identifier]:[chatflowId],[allowedDomain,...]
```

2. Start proxy server:
```bash
yarn run proxy
```
By default, it will be available on http://localhost:3001

3. Open another terminal and start dev mode to test the Embed snippet:
```bash
yarn run dev
```
This will serve the `index.html` from `public` folder and open up http://localhost:5678.
Modify the `chatflowid` and `apiHost` in the `index.html`:
- chatflowid: The identifier from your CHATFLOW_X configuration
- apiHost: Proxy server URL

```html
<script type="module">
    import Chatbot from 'http://localhost:5678/web.js'
    Chatbot.init({
        chatflowid: 'agent1',
        apiHost: 'http://localhost:3001',
        chatflowConfig: {
            // ...
        },
        theme: {
            // ...
        }
    })
</script>
```

and for full page:

```html
<flowise-fullchatbot></flowise-fullchatbot>
<script type="module">
    import Chatbot from 'http://localhost:5678/web.js'
    Chatbot.initFull({
        chatflowid: 'agent1',
        apiHost: 'http://localhost:3001',
        chatflowConfig: {
            // ...
        },
        theme: {
            // ...
        }
    })
</script>
```

### CHATFLOWS Configuration

Configure which websites can embed your chatbots using numbered CHATFLOW entries:
```env
# Format: CHATFLOW_[NUMBER]=[identifier]:[chatflowId],[allowedDomain]
# Examples:
CHATFLOW_1=agent1:20db97c6-64c9-4411-bab4-7d6202171600,https://example1.com
CHATFLOW_2=agent2:1c28f529-a70f-5001-9bc5-4f4c5d03d8c0,https://example2.com,https://anotherexample2.com
```

Each configuration follows this format:
- `identifier`: Your chosen name for the chatbot (used in the embed code as identifier/proxy)
- `chatflowId`: Your real Flowise chatflow ID
- `allowedDomain`: Domain(s) where this chat can be embedded

**Important Notes:**
- You must specify which websites can embed each chatbot
- Wildcard domains (*) are not supported for security reasons

### Cloud Deployment Requirements

When deploying to cloud platforms, you must configure the following environment variables. The proxy server will not start without these variables being properly set:

```env
API_HOST=https://your-flowise-instance.com
FLOWISE_API_KEY=your-api-key
CHATFLOW_1=agent1:your-chatflow-id,https://your-allowed-domain.com
```
## License

Source code in this repository is made available under the [MIT License](https://github.com/FlowiseAI/Flowise/blob/master/LICENSE.md).