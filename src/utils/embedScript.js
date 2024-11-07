export function generateEmbedScript(serverUrl) {
  const scriptPopup = `<script type="module">
    import Chatbot from '${serverUrl}/web.js'
    Chatbot.init({
        chatflowid: 'proxy',
        apiHost: '${serverUrl}'
    })
</script>`;

  const scriptFull = `<flowise-fullchatbot></flowise-fullchatbot>
<script type="module">
    import Chatbot from '${serverUrl}/web.js'
    Chatbot.initFull({
        chatflowid: 'proxy',
        apiHost: '${serverUrl}'
    })
</script>`;

  // Display Popup Version
  console.log('\n\x1b[36m%s\x1b[0m', '=== Popup Chat Embed Script ===');
  console.log('\x1b[33m%s\x1b[0m', scriptPopup);

  // Display Full Version
  console.log('\n\x1b[36m%s\x1b[0m', '=== Full Page Chat Embed Script ===');
  console.log('\x1b[33m%s\x1b[0m', scriptFull);
}
