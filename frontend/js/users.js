// ---------- СМЕНА ПОЛЬЗОВАТЕЛЯ ----------
function updateCurrentUserDisplay() {
  const displayElement = document.getElementById('currentUserName');
  if (currentUser) {
    displayElement.textContent = `${currentUser.first_name} ${currentUser.last_name}`;
    displayElement.style.cursor = 'default';
    displayElement.style.textDecoration = 'none';
    displayElement.title = '';
    displayElement.onclick = null;
  } else {
    displayElement.textContent = 'Создайте пользователя';
    displayElement.style.cursor = 'pointer';
    displayElement.style.textDecoration = 'underline';
    displayElement.title = 'Нажмите, чтобы создать пользователя';

    displayElement.onclick = async () => {
      await renderUserListModal();
      document.getElementById('switchUserModal').classList.add('active');
      setTimeout(() => {
        document.getElementById('newUserFirstName').focus();
      }, 300);
    };
  }
}

async function switchUser(userId) {
  try {
    const user = users.find(u => u.id === userId);
    if (!user) {
      showToast('Пользователь не найден');
      return;
    }

    currentUser = user;
    activeUserId = null;

    localStorage.setItem('currentUserId', user.id);

    document.getElementById('eventModal').classList.remove('active');

    await loadEventsForUser(null);
    await loadAllFriendsEventsCount();
    refreshFutureCache();
    await renderCalendar();
    updateActiveFriendDisplay();
    updateCurrentUserDisplay();

    showToast(`✅ Вы вошли как ${user.first_name} ${user.last_name}`);

    document.getElementById('switchUserModal').classList.remove('active');
  } catch (error) {
    console.error('Ошибка смены пользователя:', error);
    showToast('Ошибка смены пользователя');
  }
}

// ---------- РЕДАКТИРОВАНИЕ ПОЛЬЗОВАТЕЛЯ ----------
async function editUser(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return;

  document.getElementById('newUserFirstName').value = user.first_name;
  document.getElementById('newUserLastName').value = user.last_name;

  const modalTitle = document.querySelector('#switchUserModal .modal-header h3');
  const addBtn = document.getElementById('addNewUserBtn');
  const addSectionTitle = document.querySelector('.add-user-section h4');

  modalTitle.textContent = '🦊 Редактировать пользователя';
  addSectionTitle.textContent = '✏️ Изменить данные';
  addBtn.textContent = '💾 Сохранить изменения';
  addBtn.dataset.mode = 'edit';
  addBtn.dataset.editUserId = userId;

  document.getElementById('switchUserModal').classList.add('active');
  setTimeout(() => {
    document.getElementById('newUserFirstName').focus();
  }, 300);
}

async function removeUser(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return;

  if (!confirm(`Вы уверены, что хотите удалить пользователя "${user.first_name} ${user.last_name}"?\n\nВсе его события также будут удалены!`)) {
    return;
  }

  try {
    await deleteUser(userId);

    users = users.filter(u => u.id !== userId);
    friendsEventsCountCache = {};

    if (currentUser && currentUser.id === userId) {
      currentUser = users.length > 0 ? users[0] : null;

      if (currentUser) {
        localStorage.setItem('currentUserId', currentUser.id);
        await loadEventsForUser(null);
      } else {
        localStorage.removeItem('currentUserId');
        currentEventsCache = {};
      }
    }

    if (activeUserId === userId) {
      activeUserId = null;
    }

    showToast(`🗑 Пользователь "${user.first_name}" удалён`);

    await loadAllFriendsEventsCount();
    refreshFutureCache();
    await renderCalendar();
    await renderUserListModal();
    updateCurrentUserDisplay();
    updateActiveFriendDisplay();

  } catch (error) {
    showToast('Ошибка при удалении пользователя');
  }
}

// ---------- ОТРИСОВКА СПИСКА ПОЛЬЗОВАТЕЛЕЙ ----------
async function renderUserListModal() {
  const list = document.getElementById('userListModal');

  if (!users || users.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:1rem;">🦊 Нет пользователей. Создайте первого!</div>';
    return;
  }

  list.innerHTML = '';

  for (const user of users) {
    const isActive = currentUser && user.id === currentUser.id;

    const div = document.createElement('div');
    div.className = 'user-list-item' + (isActive ? ' active' : '');

    div.innerHTML = `
      <div class="user-list-item-info">
        <div class="user-list-item-avatar">🦊</div>
        <div class="user-list-item-name">${escapeHtml(user.first_name)} ${escapeHtml(user.last_name)}</div>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        ${isActive ? '<span class="user-list-item-badge">Текущий</span>' : ''}
        <button class="edit-user-btn" data-id="${user.id}" style="background: none; border: none; color: #4f46e5; cursor: pointer; font-size: 1rem;" title="Редактировать">✏️</button>
        <button class="delete-user-btn" data-id="${user.id}" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1rem;" title="Удалить">🗑</button>
      </div>
    `;

    if (!isActive) {
      div.querySelector('.user-list-item-info').addEventListener('click', () => switchUser(user.id));
    }

    div.querySelector('.edit-user-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      editUser(user.id);
    });

    div.querySelector('.delete-user-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      removeUser(user.id);
    });

    list.appendChild(div);
  }
}

async function addNewUser(firstName, lastName) {
  try {
    const newUser = await createUser(firstName, lastName);

    users.push(newUser);

    await switchUser(newUser.id);

    showToast(`✅ Пользователь ${newUser.first_name} создан`);

    document.getElementById('newUserFirstName').value = '';
    document.getElementById('newUserLastName').value = '';

    await renderUserListModal();
  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
    showToast('Ошибка создания пользователя');
  }
}