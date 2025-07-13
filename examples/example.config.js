/**
 * OAuth/OIDC Configuration for Flowise Chat Embed Demo
 * 
 * Replace these values with your actual OIDC provider settings.
 * This file should be customized for your specific authentication provider.
 */

// Demo configuration - replace with your actual values
export const oauthConfig = {
  // Your OIDC client ID
  clientId: 'demo-client-id-replace-with-yours',
  
  // Your OIDC provider authority/issuer URL
  // Examples:
  // - Google: 'https://accounts.google.com'
  // - Microsoft: 'https://login.microsoftonline.com/your-tenant-id'
  // - Auth0: 'https://your-domain.auth0.com'
  // - Custom: 'https://your-oidc-provider.com'
  authority: 'https://demo-oidc-provider.com',
  
  // Redirect URI - where users return after authentication
  // This should match what's configured in your OIDC provider
  redirectUri: window.location.origin + '/callback',
  
  // OAuth scopes to request
  scope: 'openid profile email',
  
  // OAuth response type
  responseType: 'code',
  
  // Optional: prompt parameter for OIDC provider
  prompt: 'select_account'
};

// Complete authentication configuration
export const authConfig = {
  // Authentication mode: 'required', 'optional', or 'disabled'
  mode: 'optional',
  
  // OAuth configuration
  oauth: oauthConfig,
  
  // UI prompt configuration
  promptConfig: {
    title: 'Sign In to Continue',
    message: 'Please sign in to access personalized chat features and chat history.',
    loginButtonText: 'Sign In with OIDC',
    skipButtonText: 'Continue as Guest',
    // Optional: customize colors
    // backgroundColor: '#ffffff',
    // textColor: '#333333',
    // buttonColor: '#3B81F6',
    // buttonTextColor: '#ffffff'
  },
  
  // Storage key for tokens (optional)
  tokenStorageKey: 'flowise_demo_tokens',
  
  // Auto-refresh tokens before expiration
  autoRefresh: true,
  
  // Refresh threshold in seconds (5 minutes)
  refreshThreshold: 300
};

// Provider-specific configuration examples
export const providerExamples = {
  google: {
    clientId: 'your-app.apps.googleusercontent.com',
    authority: 'https://accounts.google.com',
    redirectUri: window.location.origin + '/callback',
    scope: 'openid profile email'
  },
  
  microsoft: {
    clientId: 'your-azure-client-id',
    authority: 'https://login.microsoftonline.com/your-tenant-id',
    redirectUri: window.location.origin + '/callback',
    scope: 'openid profile email'
  },
  
  auth0: {
    clientId: 'your-auth0-client-id',
    authority: 'https://your-domain.auth0.com',
    redirectUri: window.location.origin + '/callback',
    scope: 'openid profile email'
  },
  
  custom: {
    clientId: 'your-custom-client-id',
    authority: 'https://your-oidc-provider.com',
    redirectUri: window.location.origin + '/callback',
    scope: 'openid profile email'
  }
};

// Chatbot configuration
export const chatbotConfig = {
  // Replace with your actual Flowise chatflow ID
  chatflowid: "your-chatflow-id-here",
  
  // Replace with your actual Flowise API host
  apiHost: "https://your-flowise-api.com",
  
  // Authentication configuration
  authentication: authConfig,
  
  // Theme configuration
  theme: {
      button: {
        backgroundColor: '#CC0B2A',
        right: 20,
        bottom: 20,
        size: 48, // small | medium | large | number
        dragAndDrop: true,
        iconColor: 'white',
        customIconSrc: 'https://cdnjs.cloudflare.com/ajax/libs/simple-icons/15.6.0/element.svg',
        autoWindowOpen: {
          autoOpen: false, //parameter to control automatic window opening
          openDelay: 2, // Optional parameter for delay time in seconds
          autoOpenOnMobile: false, //parameter to control automatic window opening in mobile
        },
      },
      disclaimer: {
        title: 'Disclaimer',
        message: 'By using this chatbot, you agree to the <a target="_blank" href="https://flowiseai.com/terms">Terms & Condition</a>',
        textColor: 'black',
        buttonColor: '#3b82f6',
        buttonText: 'I agree',
        buttonTextColor: 'white',
        blurredBackgroundColor: 'rgba(0, 0, 0, 0.4)', //The color of the blurred background that overlays the chat interface
        backgroundColor: 'white',
        denyButtonText: 'Cancel',
        denyButtonBgColor: '#ef4444',
      },
      form: {
        backgroundColor: 'white',
        textColor: 'black',
      },
      customCSS: ``, // Add custom CSS styles. Use !important to override default styles
      chatWindow: {
        showTitle: true,
        showAgentMessages: true,
        title: 'CSU Custom AI Agents Bot',
        titleAvatarSrc: 'https://cdnjs.cloudflare.com/ajax/libs/simple-icons/15.6.0/element.svg',
        titleBackgroundColor: '#CC0B2A',
        titleTextColor: '#ffffff',
        welcomeMessage: 'Hi! I am the CSU Custom AI Agents Bot. How can I help you today?',
        errorMessage: 'Hi! I seem to be having some issues. Please try again later.',
        backgroundColor: '#ffffff',
        backgroundImage: 'enter image path or link', // If set, this will overlap the background color of the chat window.
        height: 700,
        width: 600,
        fontSize: 16,
        starterPrompts: ['What are Model Context Protocol agents?', 'What are Data Transformation bots?'], // It overrides the starter prompts set by the chat flow passed
        starterPromptFontSize: 15,
        clearChatOnReload: false, // If set to true, the chat will be cleared when the page reloads
        sourceDocsTitle: 'Sources:',
        renderHTML: true,
        botMessage: {
          backgroundColor: '#f7f8ff',
          textColor: '#303235',
          showAvatar: true,
          avatarSrc: 'https://cdnjs.cloudflare.com/ajax/libs/simple-icons/15.6.0/element.svg',
        },
        userMessage: {
          backgroundColor: '#f7f8ff',
          textColor: '#303235',
          showAvatar: true,
          avatarSrc: 'https://raw.githubusercontent.com/zahidkhawaja/langchain-chat-nextjs/main/public/usericon.png',
        },
        textInput: {
          placeholder: 'Type your question',
          backgroundColor: '#ffffff',
          textColor: '#303235',
          sendButtonColor: '#CC0B2A',
          maxChars: 50,
          maxCharsWarningMessage: 'You exceeded the characters limit. Please input less than 50 characters.',
          autoFocus: true, // If not used, autofocus is disabled on mobile and enabled on desktop. true enables it on both, false disables it on both.
          sendMessageSound: false,
          // sendSoundLocation: "send_message.mp3", // If this is not used, the default sound effect will be played if sendSoundMessage is true.
          receiveMessageSound: false,
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
          text: 'Maintained by',
          company: 'CSU',
          companyLink: 'https://calstate.edu',
        },
      },
    },
};