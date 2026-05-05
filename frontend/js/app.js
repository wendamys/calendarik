// ---------- ЗАПУСК ПРИЛОЖЕНИЯ ----------
document.addEventListener('DOMContentLoaded', async () => {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();
  selectedDate = new Date(currentYear, currentMonth, now.getDate());

  document.getElementById('searchTimeFrom').value = '00:00';
  document.getElementById('searchTimeTo').value = '23:59';

  initTheme();
  connectWebSocket();

  await loadInitialData();

  initAutoHighlight();
  await renderCalendar();
  updateActiveFriendDisplay();

  setupRealTimeValidation();

  document.getElementById('prevMonthBtn').onclick = prevMonth;
  document.getElementById('nextMonthBtn').onclick = nextMonth;
  document.getElementById('applySearchBtn').onclick = () => updateAllFutureHighlight();

  // Валидация времени
  document.getElementById('searchTimeFrom').addEventListener('change', function() {
    const timeFrom = this.value;
    const timeToInput = document.getElementById('searchTimeTo');
    timeToInput.min = timeFrom;
    if (timeToInput.value && timeToInput.value < timeFrom) {
      timeToInput.value = timeFrom;
      showToast('⏰ Время "до" не может быть раньше времени "от"');
    }
  });

  document.getElementById('searchTimeTo').addEventListener('change', function() {
    const timeFrom = document.getElementById('searchTimeFrom').value;
    if (this.value < timeFrom) {
      this.value = timeFrom;
      showToast('⏰ Время "до" не может быть раньше времени "от"');
    }
  });

  document.getElementById('searchTimeTo').min = document.getElementById('searchTimeFrom').value;

  // Поиск
  const searchUI = createSearchUI();
  const friendsPanel = document.querySelector('.friends-panel');
  const friendsList = document.getElementById('friendsList');
  friendsPanel.insertBefore(searchUI, friendsList);

  // Модальное окно событий
  const modal = document.getElementById('eventModal');
  document.getElementById('closeModalBtn').onclick = () => {
    modal.classList.remove('active');
    resetEditMode();
    resetValidation();
  };
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      modal.classList.remove('active');
      resetEditMode();
      resetValidation();
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
      resetEditMode();
      resetValidation();
    }
  });

  document.getElementById('addFriendBtn').style.display = 'none';
  document.getElementById('addFriendForm').style.display = 'none';

  document.getElementById('deselectFriendBtn').onclick = () => deselectFriend();

  document.getElementById('modalFriendSelect').addEventListener('change', async (e) => {
    const value = e.target.value;
    if (value === 'me') {
      await deselectFriend();
    } else {
      await selectFriend(parseInt(value));
    }
  });

  // Смена пользователя
  document.getElementById('switchUserBtn').onclick = async () => {
    await renderUserListModal();
    document.getElementById('switchUserModal').classList.add('active');
  };

  // Закрытие модального окна пользователей
  const closeSwitchModal = () => {
    document.getElementById('switchUserModal').classList.remove('active');
    // Сбрасываем режим редактирования
    const addBtn = document.getElementById('addNewUserBtn');
    const modalTitle = document.querySelector('#switchUserModal .modal-header h3');
    const addSectionTitle = document.querySelector('.add-user-section h4');

    addBtn.textContent = 'Добавить пользователя';
    addBtn.dataset.mode = 'add';
    delete addBtn.dataset.editUserId;
    modalTitle.textContent = '🦊 Управление пользователями';
    addSectionTitle.textContent = '➕ Добавить нового пользователя';
    document.getElementById('newUserFirstName').value = '';
    document.getElementById('newUserLastName').value = '';
  };

  document.getElementById('closeSwitchUserModalBtn').onclick = closeSwitchModal;

  const switchModal = document.getElementById('switchUserModal');
  switchModal.addEventListener('click', e => {
    if (e.target === switchModal) closeSwitchModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && switchModal.classList.contains('active'))
      closeSwitchModal();
  });

  // Кнопка добавления/редактирования пользователя
  document.getElementById('addNewUserBtn').addEventListener('click', async function() {
    const mode = this.dataset.mode || 'add';
    const editUserId = this.dataset.editUserId;

    const firstName = document.getElementById('newUserFirstName').value.trim();
    const lastName = document.getElementById('newUserLastName').value.trim();

    if (!firstName || !lastName) {
      showToast('Введите имя и фамилию');
      return;
    }

    if (mode === 'edit' && editUserId) {
      try {
        await updateUser(parseInt(editUserId), firstName, lastName);

        const user = users.find(u => u.id === parseInt(editUserId));
        if (user) {
          user.first_name = firstName;
          user.last_name = lastName;
        }

        if (currentUser && currentUser.id === parseInt(editUserId)) {
          currentUser.first_name = firstName;
          currentUser.last_name = lastName;
          updateCurrentUserDisplay();
        }

        showToast(`✅ Пользователь "${firstName}" обновлён`);
        closeSwitchModal();
        await renderUserListModal();
        await renderFriendsList();
      } catch (error) {
        showToast('Ошибка при обновлении пользователя');
      }
    } else {
      await addNewUser(firstName, lastName);
    }
  });

  // Кнопка смены темы
  const themeBtn = document.createElement('button');
  themeBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  themeBtn.style.cssText = 'position: fixed; bottom: 20px; left: 20px; background: #1e293b; color: white; border: none; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; font-size: 1.5rem; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
  themeBtn.title = 'Сменить тему';
  document.body.appendChild(themeBtn);

  themeBtn.addEventListener('click', () => {
    toggleTheme();
    themeBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  });

  // Горячие клавиши
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevMonth();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextMonth();
          break;
        case 't':
          e.preventDefault();
          const now = new Date();
          currentMonth = now.getMonth();
          currentYear = now.getFullYear();
          selectedDate = new Date(currentYear, currentMonth, now.getDate());
          renderCalendar();
          break;
        case 'f':
          e.preventDefault();
          document.getElementById('searchEventInput')?.focus();
          break;
      }
    }
  });
});