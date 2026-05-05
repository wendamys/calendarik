// ---------- ТЕМА ----------
function initTheme() {
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  localStorage.setItem('theme', currentTheme);
}

// ---------- ВАЛИДАЦИЯ ----------
function setupRealTimeValidation() {
  const titleInput = document.getElementById('modalEventTitle');
  const startInput = document.getElementById('modalEventStart');
  const endInput = document.getElementById('modalEventEnd');

  titleInput.addEventListener('input', () => {
    const title = titleInput.value.trim();
    if (title.length > 0) clearValidation('modalEventTitle');
  });

  startInput.addEventListener('change', () => {
    clearValidation('modalEventStart');
    validateTimes();
  });

  endInput.addEventListener('change', () => {
    clearValidation('modalEventEnd');
    validateTimes();
  });
}

function validateTimes() {
  const start = document.getElementById('modalEventStart').value;
  const end = document.getElementById('modalEventEnd').value;

  if (start && end) {
    const startMin = getMinutes(start);
    const endMin = getMinutes(end);
    if (startMin >= endMin) {
      showValidation('modalEventEnd', 'Конец должен быть позже начала');
    } else {
      clearValidation('modalEventEnd');
    }
  }
}

function showValidation(fieldId, message) {
  const field = document.getElementById(fieldId);
  field.style.borderColor = '#ef4444';
  field.style.background = '#fef2f2';

  let errorDiv = field.parentElement.querySelector('.validation-error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.style.cssText = 'color: #ef4444; font-size: 0.7rem; margin-top: 2px;';
    field.parentElement.appendChild(errorDiv);
  }
  errorDiv.textContent = message;
}

function clearValidation(fieldId) {
  const field = document.getElementById(fieldId);
  field.style.borderColor = '#cbd5e1';
  field.style.background = 'white';

  const errorDiv = field.parentElement.querySelector('.validation-error');
  if (errorDiv) errorDiv.remove();
}

function resetValidation() {
  ['modalEventTitle', 'modalEventStart', 'modalEventEnd'].forEach(id => clearValidation(id));
}