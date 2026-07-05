(function () {
  var log = document.getElementById('chat-log');
  var form = document.getElementById('chat-form');
  var input = document.getElementById('chat-input');
  var sendBtn = document.getElementById('chat-send');

  // Full Anthropic-format message history (includes tool_use/tool_result
  // blocks) — the server is stateless, so this is resent on every turn.
  var apiMessages = [];

  function appendBubble(role, text) {
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + role;
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
    return bubble;
  }

  function appendTypingIndicator() {
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble assistant typing';
    bubble.innerHTML = '<span></span><span></span><span></span>';
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
    return bubble;
  }

  function setBusy(busy) {
    input.disabled = busy;
    sendBtn.disabled = busy;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;

    appendBubble('user', text);
    apiMessages.push({ role: 'user', content: text });
    input.value = '';
    setBusy(true);

    var typingBubble = appendTypingIndicator();

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: apiMessages }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(function (data) {
        typingBubble.remove();
        apiMessages = data.messages || apiMessages;
        appendBubble('assistant', data.reply || "Sorry, I didn't catch that.");
      })
      .catch(function () {
        typingBubble.remove();
        appendBubble('error', "Sorry, something went wrong reaching the assistant. Please try again.");
      })
      .finally(function () {
        setBusy(false);
        input.focus();
      });
  });
})();
