(function () {
  var log = document.getElementById('chat-log');
  var form = document.getElementById('chat-form');
  var input = document.getElementById('chat-input');
  var sendBtn = document.getElementById('chat-send');

  // Opaque conversation history returned by the server (includes function
  // call/response turns) — the server is stateless, so this is resent
  // on every turn.
  var history = [];

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
    input.value = '';
    setBusy(true);

    var typingBubble = appendTypingIndicator();

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: history }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(function (data) {
        typingBubble.remove();
        history = data.history || history;
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
