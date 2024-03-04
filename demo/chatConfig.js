const chatConfig = {
  chatflowid: 'b07341b9-97b4-491e-a49e-8cf7da73d235',
  apiHost: 'http://localhost:3000',
};

export function getChatConfig() {
  const urlParams = new URLSearchParams(window.location.search);
  const chatflowid = urlParams.get('chatflowid');
  if (chatflowid) {
    chatConfig.chatflowid = chatflowid;
    const chatflowidInput = document.getElementById('chatflowid');
    chatflowidInput.value = chatflowid;
  }
  return chatConfig;
}

export default chatConfig;
