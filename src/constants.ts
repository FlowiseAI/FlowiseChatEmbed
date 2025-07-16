import type { BubbleProps } from './features/bubble';

// Obfuscated OAuth API key using multiple encoding layers
// Production note: Consider using environment-specific keys and stronger obfuscation
const OBFUSCATED_OAUTH_API_KEY = (() => {
  // Multi-layer obfuscation: reverse + base64 + character shifting
  const layer1 = 'ereh-yek-ipa-eruces-ruoy'; // reversed
  const layer2 = btoa(layer1); // base64 (browser-compatible)
  const layer3 = layer2.split('').map((char, i) =>
    String.fromCharCode(char.charCodeAt(0) + (i % 3) + 1)
  ).join(''); // character shifting
  return layer3;
})();

// Enhanced decryption function with validation
const decryptApiKey = (obfuscated: string): string => {
  try {
    // Reverse the character shifting
    const layer2 = obfuscated.split('').map((char, i) =>
      String.fromCharCode(char.charCodeAt(0) - (i % 3) - 1)
    ).join('');
    
    // Decode base64
    const layer1 = atob(layer2);
    
    // Reverse the string
    const original = layer1.split('').reverse().join('');
    
    // Basic validation - ensure it looks like an API key
    if (original.length < 10 || !original.includes('-')) {
      console.warn('Invalid API key format detected');
      return '';
    }
    
    return original;
  } catch (error) {
    console.warn('Failed to decrypt API key:', error);
    return '';
  }
};

// OAuth configuration fetching
export const fetchOAuthConfig = async (apiHost: string, chatflowId: string) => {
  try {
    const apiKey = decryptApiKey(OBFUSCATED_OAUTH_API_KEY);
    const response = await fetch(`${apiHost}/api/auth/config/${chatflowId}`, {
      headers: {
        'x-oauth-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        // No OAuth config found for this chatflow
        return null;
      }
      throw new Error(`Failed to fetch OAuth config: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch OAuth configuration from server:', error);
    return null;
  }
};

export const defaultBotProps: BubbleProps = {
  chatflowid: '',
  apiHost: undefined,
  onRequest: undefined,
  chatflowConfig: undefined,
  theme: undefined,
  observersConfig: undefined,
  authentication: undefined,
};
