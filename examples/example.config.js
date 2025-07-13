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
      backgroundColor: "#3B81F6",
      right: 20,
      bottom: 20,
      size: "medium",
      iconColor: "white",
      customIconSrc: "https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/google-messages.svg",
    },
    chatWindow: {
      welcomeMessage: "Hello! I'm your AI assistant with OAuth authentication. How can I help you today?",
      backgroundColor: "#ffffff",
      height: 600,
      width: 400,
      fontSize: 16,
      showTitle: true,
      title: "AI Assistant",
      titleBackgroundColor: "#3B81F6",
      titleTextColor: "#ffffff",
      botMessage: {
        backgroundColor: "#f7f8ff",
        textColor: "#303235",
        showAvatar: true,
        avatarSrc: "https://raw.githubusercontent.com/zahidkhawaja/langchain-chat-nextjs/main/public/bot-image.jpg",
      },
      userMessage: {
        backgroundColor: "#3B81F6",
        textColor: "#ffffff",
        showAvatar: true,
        avatarSrc: "https://raw.githubusercontent.com/zahidkhawaja/langchain-chat-nextjs/main/public/usericon.png",
      },
      textInput: {
        placeholder: "Type your message...",
        backgroundColor: "#ffffff",
        textColor: "#303235",
        sendButtonColor: "#3B81F6",
      }
    }
  }
};