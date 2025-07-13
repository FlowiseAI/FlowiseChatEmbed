# Flowise Chat Embed - OAuth/OIDC Authentication Examples

This folder contains examples demonstrating how to use OAuth/OIDC authentication with the Flowise Chat Embed widget.

## 📁 Files

- **`index.html`** - Complete HTML demo with interactive authentication testing
- **`example.config.js`** - Example OAuth/OIDC configuration template
- **`README.md`** - This documentation file
- **`config.js`** - Your custom configuration file (create from example)

## ⚙️ Configuration Setup

Before running the demo, you need to create your OAuth/OIDC configuration:

### 1. Create `config.js` from Example

Copy the example configuration file and customize it with your settings:

```bash
# In the examples directory
cp example.config.js config.js
```

### 2. Edit Your `config.js`

Open `examples/config.js` and replace the demo values with your actual OIDC provider settings:

```javascript
export const oauthConfig = {
  // Replace with your actual client ID
  clientId: 'your-actual-client-id',
  
  // Replace with your OIDC provider's authority URL
  authority: 'https://your-oidc-provider.com',
  
  // Update redirect URI to match your setup
  redirectUri: window.location.origin + '/callback',
  
  // Customize scopes as needed
  scope: 'openid profile email'
};
```

### 3. Provider Examples

The `example.config.js` file includes examples for popular providers:

- **Google**: Use `providerExamples.google` configuration
- **Microsoft Azure AD**: Use `providerExamples.microsoft` configuration
- **Auth0**: Use `providerExamples.auth0` configuration
- **Custom OIDC**: Use `providerExamples.custom` as a template

### 4. Security Note

⚠️ **Important**: Add `config.js` to your `.gitignore` file to avoid committing sensitive OAuth credentials:

```bash
# Add to .gitignore
examples/config.js
```

## 🚀 Running the Demo

### Recommended: Using Flowise Development Server

1. **Start the development server** in the project root:
   ```bash
   yarn dev
   ```
   This starts the server on `http://localhost:5678` and serves the chat widget.

2. **Create your configuration**:
   ```bash
   cd examples
   cp example.config.js config.js
   # Edit config.js with your OAuth settings
   ```

3. **Open the demo** in your browser:
   ```
   http://localhost:5678/examples/index.html
   ```

### Alternative: Using Built Files

If you prefer not to use the development server:

1. **Build the project**:
   ```bash
   yarn build
   ```

2. **Start a local server** in the project root:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

3. **Open the demo**:
   ```
   http://localhost:8000/examples/index.html
   ```

## 🔧 Demo Features

The interactive demo includes:

### **Token Validation Testing**
- **Test Token Validation** - Check current authentication status
- **Simulate Valid Tokens** - Create mock tokens for testing
- **Simulate Expired Tokens** - Test expired token handling
- **Clear All Tokens** - Remove all cached tokens

### **Authentication Modes**
The demo shows how different authentication modes work:

- **Required Mode** - Users must authenticate to access chat
- **Optional Mode** - Users can choose to authenticate or continue as guest
- **Disabled Mode** - No authentication required

### **OIDC Provider Examples**
Configuration examples for popular providers:

- **Google OAuth 2.0**
- **Microsoft Azure AD**
- **Auth0**
- **Custom OIDC Providers**

## 🔐 Authentication Flow

1. **Token Check** - Widget checks for valid tokens in browser cache
2. **Validation** - Validates tokens using JWT expiration and userinfo endpoint
3. **Prompt** - Shows authentication prompt if required and no valid tokens
4. **OAuth Flow** - Redirects to OIDC provider for authentication
5. **Token Storage** - Stores received tokens securely in browser
6. **Auto Refresh** - Automatically refreshes tokens before expiration

## 📝 Integration Example

Here's how to integrate OAuth/OIDC authentication in your own application:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My App with Flowise Chat</title>
</head>
<body>
    <!-- Your app content -->
    
    <!-- Flowise Chat Widget -->
    <flowise-chatbot></flowise-chatbot>
    
    <script type="module">
        import Chatbot from 'flowise-embed'
        
        // Configure authentication
        const authConfig = {
            mode: 'optional', // or 'required' or 'disabled'
            oauth: {
                clientId: 'your-client-id',
                authority: 'https://your-oidc-provider.com',
                redirectUri: window.location.origin + '/callback',
                scope: 'openid profile email',
                responseType: 'code'
            },
            promptConfig: {
                title: 'Sign In Required',
                message: 'Please sign in to access personalized features.',
                loginButtonText: 'Sign In',
                skipButtonText: 'Continue as Guest'
            },
            autoRefresh: true,
            refreshThreshold: 300 // 5 minutes
        };
        
        // Initialize chat with authentication
        Chatbot.init({
            chatflowid: "your-chatflow-id",
            apiHost: "https://your-flowise-api.com",
            authentication: authConfig,
            theme: {
                button: {
                    backgroundColor: "#3B81F6",
                    right: 20,
                    bottom: 20,
                    size: "medium"
                },
                chatWindow: {
                    welcomeMessage: "Hello! How can I help you today?",
                    backgroundColor: "#ffffff",
                    height: 600,
                    width: 400,
                    showTitle: true,
                    title: "AI Assistant"
                }
            }
        });
    </script>
</body>
</html>
```

## 🔧 Configuration Options

### Authentication Config

```typescript
interface AuthenticationConfig {
  mode: 'required' | 'optional' | 'disabled';
  oauth: {
    clientId: string;
    authority: string;
    redirectUri: string;
    scope?: string;
    responseType?: string;
    prompt?: string;
  };
  promptConfig?: {
    title?: string;
    message?: string;
    loginButtonText?: string;
    skipButtonText?: string;
    backgroundColor?: string;
    textColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
  };
  tokenStorageKey?: string;
  autoRefresh?: boolean;
  refreshThreshold?: number; // seconds
}
```

### Provider-Specific Examples

#### Google OAuth 2.0
```javascript
const googleConfig = {
  clientId: 'your-app.apps.googleusercontent.com',
  authority: 'https://accounts.google.com',
  redirectUri: window.location.origin + '/callback',
  scope: 'openid profile email'
};
```

#### Microsoft Azure AD
```javascript
const azureConfig = {
  clientId: 'your-azure-client-id',
  authority: 'https://login.microsoftonline.com/your-tenant-id',
  redirectUri: window.location.origin + '/callback',
  scope: 'openid profile email'
};
```

#### Auth0
```javascript
const auth0Config = {
  clientId: 'your-auth0-client-id',
  authority: 'https://your-domain.auth0.com',
  redirectUri: window.location.origin + '/callback',
  scope: 'openid profile email'
};
```

## 🛠️ Development Notes

- The demo uses mock token validation for demonstration purposes
- In production, replace the demo configuration with your actual OIDC provider details
- Ensure your OIDC provider is configured with the correct redirect URIs
- Test with different authentication modes to find the best user experience for your application

## 📚 Additional Resources

- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect Specification](https://openid.net/connect/)
- [oauth4webapi Documentation](https://github.com/panva/oauth4webapi)
- [Flowise Documentation](https://docs.flowiseai.com/)