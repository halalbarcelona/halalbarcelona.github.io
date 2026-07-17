(function () {
  var chatToggleBtn = document.getElementById('toggle-chat');
  var manualToggleBtn = document.getElementById('toggle-manual');
  var chatShell = document.getElementById('chat-shell');
  var manualShell = document.getElementById('manual-shell');

  function showChat() {
    chatShell.hidden = false;
    manualShell.hidden = true;
    chatToggleBtn.classList.add('active');
    manualToggleBtn.classList.remove('active');
    chatToggleBtn.setAttribute('aria-selected', 'true');
    manualToggleBtn.setAttribute('aria-selected', 'false');
  }

  function showManual() {
    chatShell.hidden = true;
    manualShell.hidden = false;
    manualToggleBtn.classList.add('active');
    chatToggleBtn.classList.remove('active');
    manualToggleBtn.setAttribute('aria-selected', 'true');
    chatToggleBtn.setAttribute('aria-selected', 'false');
  }

  chatToggleBtn.addEventListener('click', showChat);
  manualToggleBtn.addEventListener('click', showManual);
})();
