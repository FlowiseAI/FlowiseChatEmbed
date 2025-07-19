import axios from 'axios';

/**
 * Fetch chat history from the Flowise API by chatId.
 * @param {string} apiHost - The base URL of the Flowise API.
 * @param {string} chatId - The unique identifier of the chat session.
 * @returns {Promise<any[] | null>} - Returns the chat history array if successful, or null if an error occurs.
 */
export const fetchChatHistory = async (apiHost: string, chatId: string): Promise<any[] | null> => {
  try {
    const response = await axios.get(`${apiHost}/api/v1/chat/${chatId}`);
    if (response.status === 200 && response.data) {
      return response.data.chatHistory; // Assuming the API returns chatHistory in the response
    }
    throw new Error('Invalid response from API');
  } catch (error) {
    console.error('Failed to fetch chat history from Flowise API:', error);
    return null;
  }
};

// Self-invoking function to test fetchChatHistory
(async () => {
  const apiHost = 'https://cloud.flowiseai.com'; // Flowise API host
  const chatId = '58385259-f6af-4ba8-85e6-337ead8bf2da'; // Provided chatId

  const chatHistory = await fetchChatHistory(apiHost, chatId);
  console.log('Chat History:', chatHistory);
})();
