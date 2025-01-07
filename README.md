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

A development server will be running on http://localhost:5678 automatically. Update `public/index.html` to connect directly to Flowise:

```html
<!-- public/index.html -->
<script type="module">
  import Chatbot from 'https://localhost:5678/web.js'; // Change to from './web.js' to 'https://localhost:5678/web.js'
  Chatbot.init({
    chatflowid: '91e9c803-5169-4db9-8207-3c0915d71c5f', // Add your Flowise chatflowid
    apiHost: 'https://your-flowise-instance.com', // Add your Flowise apiHost
  });
</script>
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
        textColor: 'black',
        buttonColor: '#3b82f6',
        buttonText: 'Start Chatting',
        buttonTextColor: 'white',
        blurredBackgroundColor: 'rgba(0, 0, 0, 0.4)', //The color of the blurred background that overlays the chat interface
        backgroundColor: 'white',
        denyButtonText: 'Cancel',
        denyButtonBgColor: '#ef4444',
      },
      customCSS: ``, // Add custom CSS styles. Use !important to override default styles
      chatWindow: {
        showTitle: true,
        showAgentMessages: true,
        title: 'Flowise Bot',
        titleAvatarSrc: 'https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/google-messages.svg',
        titleBackgroundColor: '#3B81F6',
        titleTextColor: '#ffffff',
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

This proxy server can be deployed to any Node.js hosting platform.

## Quick Start

1. Configure environment:

```bash
# Copy .env.example to .env and configure required settings:
API_HOST=https://your-flowise-instance.com
FLOWISE_API_KEY=your-api-key

# Configure your chatflows:
# Format: [identifier]=[chatflowId],[allowedDomain1],[allowedDomain2],...
#
# identifier: Any name you choose (e.g., agent1, support, salesbot)
# chatflowId: The UUID of your Flowise chatflow
# allowedDomains: Comma-separated list of domains where this chat can be embedded
#
# Examples:
support=abc123-def456,https://example.com
agent1=xyz789-uvw456,https://sales.example.com
helpdesk=ghi123-jkl456,https://help.example.com,https://support.example.com
```

2. Install dependencies: (assuming you did not run `yarn install` yet)

```bash
yarn install
```

3. Start proxy server:

```bash
yarn start
# Server will be available at:
# - Local:  http://localhost:3001
# - Cloud:  [Your Platform URL] (e.g., https://your-app.herokuapp.com)
```

4. Once the proxy server is running in production, you will be able to embed your chatbots safely without exposing your Flowise API host and chatflow IDs as below:

```html
<script type="module">
  import Chatbot from 'your-proxy-server-url/web.js'; // Must be 'your-proxy-server-url/web.js'
  Chatbot.init({
    chatflowid: 'your-identifier-here', // Must match an identifier from your .env
    apiHost: 'your-proxy-server-url', // Must match the URL of your proxy server
    chatflowConfig: {
      // ...
    },
  });
</script>
```

5. (optional) If you want to test any identifier in public/index.html, you can update it as below:

```html
<!-- public/index.html -->
chatflowid: 'your-identifier-here' // Must match an identifier from your .env
```

**Important Notes:**

- To ensure secure embedding, you must explicitly whitelist the websites authorized to embed each chatbot. This configuration is done within the .env file. Note that this also applies to your server's URL when deployed to a cloud environment, or http://localhost:3001 for local development, if needed you must whitelist it as well.
- Wildcard domains (\*) are not supported for security reasons
- Identifiers are case-insensitive (e.g., 'Support' and 'support' are treated the same)

## Cloud Deployment Requirements

When deploying to cloud platforms, you must configure the environment variables directly in your platform. The proxy server will not start without these variables being properly set. Compatible with Nixpacks for automatic deployment configuration.

## Development Mode (For Local Testing)

1. Configure your environment variables (see above)

2. Start the proxy server:

```bash
yarn start
# Server will be available at:
# - Local:  http://localhost:3001
```

3. Update the test page configuration:

- Open `public/index.html` in your code editor
- Modify the `chatflowid` and `apiHost` to match your `.env` settings:

```html
<!-- public/index.html -->
<script type="module">
  import Chatbot from './web.js';
  Chatbot.init({
    chatflowid: 'agent1', // Must match an identifier from your .env
    apiHost: 'http://localhost:3001', // Change this from window.location.origin to 'http://localhost:3001'
  });
</script>
```

For full page testing, use this configuration instead:

```html
<!-- public/index.html -->
<flowise-fullchatbot></flowise-fullchatbot>
<script type="module">
  import Chatbot from './web.js';
  Chatbot.initFull({
    chatflowid: 'agent1', // Must match an identifier from your .env
    apiHost: 'http://localhost:3001', // Change this from window.location.origin to 'http://localhost:3001'
  });
</script>
```

4. While the proxy server is running, open a new terminal and start the development server:

```bash
yarn dev
# This will serve the test page on http://localhost:5678 automatically
```

5. Test the chatbot:

- Navigate to http://localhost:5678
- The chatbot should now be visible and functional

**Note:** The development URL (http://localhost:5678) is automatically added to allowed domains in development mode. You don't need to add it manually.

## License

Source code in this repository is made available under the [MIT License](https://github.com/FlowiseAI/Flowise/blob/master/LICENSE.md).
