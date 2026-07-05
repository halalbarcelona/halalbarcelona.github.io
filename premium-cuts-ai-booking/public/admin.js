(function () {
  var table = document.getElementById('bookings-table');
  var body = document.getElementById('bookings-body');
  var emptyState = document.getElementById('empty-state');
  var refreshBtn = document.getElementById('refresh-btn');

  function formatDateTime(isoString) {
    if (!isoString) return '—';
    var d = new Date(isoString.replace(' ', 'T') + 'Z');
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  }

  function render(bookings) {
    if (!bookings.length) {
      table.hidden = true;
      emptyState.hidden = false;
      emptyState.textContent = 'No bookings yet.';
      return;
    }

    body.innerHTML = bookings
      .map(function (b) {
        return (
          '<tr>' +
          '<td class="id">#' + b.id + '</td>' +
          '<td>' + escapeHtml(b.name) + '</td>' +
          '<td class="phone">' + escapeHtml(b.phone) + '</td>' +
          '<td>' + escapeHtml(b.service) + '</td>' +
          '<td>' + escapeHtml(b.date) + '</td>' +
          '<td>' + escapeHtml(b.time) + '</td>' +
          '<td class="created">' + formatDateTime(b.created_at) + '</td>' +
          '</tr>'
        );
      })
      .join('');

    table.hidden = false;
    emptyState.hidden = true;
  }

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function loadBookings() {
    emptyState.hidden = false;
    emptyState.textContent = 'Loading bookings…';
    table.hidden = true;

    fetch('/api/bookings')
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(render)
      .catch(function () {
        table.hidden = true;
        emptyState.hidden = false;
        emptyState.textContent = 'Could not load bookings. Please refresh.';
      });
  }

  refreshBtn.addEventListener('click', loadBookings);
  loadBookings();
})();
