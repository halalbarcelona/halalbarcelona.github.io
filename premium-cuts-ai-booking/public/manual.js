(function () {
  var form = document.getElementById('manual-form');
  var errorEl = document.getElementById('manual-error');
  var submitBtn = document.getElementById('manual-submit');
  var successEl = document.getElementById('manual-success');
  var summaryEl = document.getElementById('manual-summary');
  var bookAgainBtn = document.getElementById('manual-book-again');

  var dateInput = document.getElementById('manual-date');
  var today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
  dateInput.value = today;

  function formatDate(value) {
    if (!value) return '—';
    var d = new Date(value + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function formatTime(value) {
    if (!value) return '—';
    return value;
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function clearError() {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    clearError();
    submitBtn.disabled = true;

    var service = form.querySelector('input[name="service"]:checked').value;
    var date = document.getElementById('manual-date').value;
    var time = document.getElementById('manual-time').value;
    var name = document.getElementById('manual-name').value.trim();
    var phone = document.getElementById('manual-phone').value.trim();

    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, phone: phone, service: service, date: date, time: time }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || 'Algo ha ido mal.');
          return data;
        });
      })
      .then(function () {
        summaryEl.innerHTML =
          '<dt>Servicio</dt><dd>' + service + '</dd>' +
          '<dt>Fecha</dt><dd>' + formatDate(date) + '</dd>' +
          '<dt>Hora</dt><dd>' + formatTime(time) + '</dd>' +
          '<dt>Nombre</dt><dd>' + (name || '—') + '</dd>';
        form.hidden = true;
        successEl.hidden = false;
      })
      .catch(function (err) {
        showError(err.message || 'Algo ha ido mal. Inténtalo de nuevo.');
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });

  bookAgainBtn.addEventListener('click', function () {
    form.reset();
    dateInput.value = today;
    form.hidden = false;
    successEl.hidden = true;
  });
})();
