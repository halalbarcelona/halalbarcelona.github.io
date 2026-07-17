(function () {
  var listEl = document.getElementById('orders-list');
  var emptyEl = document.getElementById('orders-empty');
  var refreshBtn = document.getElementById('refresh-btn');

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function formatDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  function renderReply(reply) {
    return (
      '<div class="reply-item">' +
        '<div class="reply-meta">' + formatDate(reply.sentAt) + '</div>' +
        '<div class="reply-text">' + escapeHtml(reply.message) + '</div>' +
      '</div>'
    );
  }

  function renderOrder(order) {
    var repliesHtml = (order.replies || []).map(renderReply).join('');
    var tagsHtml =
      (order.projectType ? '<span class="order-tag">' + escapeHtml(order.projectType) + '</span>' : '') +
      (order.budget ? '<span class="order-tag">' + escapeHtml(order.budget) + '</span>' : '');

    return (
      '<div class="order-card" data-id="' + escapeHtml(order.id) + '">' +
        '<div class="order-card-header">' +
          '<div>' +
            '<div class="order-name">' + escapeHtml(order.name) + (order.businessName ? ' — ' + escapeHtml(order.businessName) : '') + '</div>' +
            '<div class="order-meta">' + escapeHtml(order.email) + (order.phone ? ' · ' + escapeHtml(order.phone) : '') + '</div>' +
          '</div>' +
          '<span class="status-badge status-' + escapeHtml(order.status) + '">' + escapeHtml(order.status) + '</span>' +
        '</div>' +
        '<div class="order-body">' +
          (tagsHtml ? '<div>' + tagsHtml + '</div>' : '') +
          '<p class="order-description">' + escapeHtml(order.description) + '</p>' +
        '</div>' +
        (repliesHtml ? '<div class="order-replies">' + repliesHtml + '</div>' : '') +
        '<form class="reply-form">' +
          '<textarea placeholder="Type your reply…" required></textarea>' +
          '<button type="submit">Send</button>' +
        '</form>' +
        '<div class="order-date">Received ' + formatDate(order.createdAt) + '</div>' +
      '</div>'
    );
  }

  function attachReplyHandlers() {
    listEl.querySelectorAll('.reply-form').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var card = form.closest('.order-card');
        var id = card.getAttribute('data-id');
        var textarea = form.querySelector('textarea');
        var message = textarea.value.trim();
        if (!message) return;

        var btn = form.querySelector('button');
        btn.disabled = true;

        fetch('/api/admin/orders/' + encodeURIComponent(id) + '/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: message }),
        })
          .then(function (res) {
            if (!res.ok) throw new Error('Request failed');
            return res.json();
          })
          .then(function () {
            loadOrders();
          })
          .catch(function () {
            alert('Could not send that reply. Please try again.');
            btn.disabled = false;
          });
      });
    });
  }

  function loadOrders() {
    fetch('/api/admin/orders')
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(function (orders) {
        if (!orders.length) {
          listEl.hidden = true;
          emptyEl.hidden = false;
          emptyEl.textContent = 'No requests yet.';
          return;
        }
        listEl.innerHTML = orders.map(renderOrder).join('');
        listEl.hidden = false;
        emptyEl.hidden = true;
        attachReplyHandlers();
      })
      .catch(function () {
        listEl.hidden = true;
        emptyEl.hidden = false;
        emptyEl.textContent = 'Could not load requests. Please refresh.';
      });
  }

  refreshBtn.addEventListener('click', loadOrders);
  loadOrders();
})();
