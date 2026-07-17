(function () {
  var form = document.getElementById('order-form');
  var errorEl = document.getElementById('order-error');
  var submitBtn = document.getElementById('order-submit');
  var successEl = document.getElementById('order-success');

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

    var payload = {
      name: document.getElementById('order-name').value.trim(),
      email: document.getElementById('order-email').value.trim(),
      phone: document.getElementById('order-phone').value.trim(),
      businessName: document.getElementById('order-business').value.trim(),
      projectType: document.getElementById('order-type').value,
      budget: document.getElementById('order-budget').value,
      description: document.getElementById('order-description').value.trim(),
    };

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || 'Something went wrong.');
          return data;
        });
      })
      .then(function () {
        form.hidden = true;
        successEl.hidden = false;
      })
      .catch(function (err) {
        showError(err.message || 'Something went wrong. Please try again.');
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });
})();
