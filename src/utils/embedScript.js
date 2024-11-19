export function generateEmbedScript(serverUrl) {
  const scriptPopup = `<script type="module">
  import Chatbot from '${serverUrl}/web.js'
  Chatbot.init({
      chatflowid: 'your-identifier-here',
      apiHost: '${serverUrl}'
  })
</script>`;

  const scriptFull = `<flowise-fullchatbot></flowise-fullchatbot>
<script type="module">
  import Chatbot from '${serverUrl}/web.js'
  Chatbot.initFull({
      chatflowid: 'your-identifier-here',
      apiHost: '${serverUrl}'
  })
</script>`;

  const envContext = serverUrl.includes('localhost') ? 'Development' : 'Production';

  console.log('\n\x1b[35m%s\x1b[0m', `=== ${envContext} Environment ===`);
  console.log('\x1b[90m%s\x1b[0m', `Proxy Server URL: ${serverUrl}`);

  console.log('\n\x1b[36m%s\x1b[0m', '=== Popup Chat Embed Script ===');
  console.log('\x1b[33m%s\x1b[0m', scriptPopup);

  console.log('\n\x1b[36m%s\x1b[0m', '=== Full Page Chat Embed Script ===');
  console.log('\x1b[33m%s\x1b[0m', scriptFull);
  console.log('\n');
}
