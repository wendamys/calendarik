// ---------- ПОИСК ----------
let searchQuery = '';
let friendSearchQuery = '';

function filterEventsBySearch(events) {
  if (!searchQuery) return events;
  const query = searchQuery.toLowerCase();
  return events.filter(ev =>
    ev.title.toLowerCase().includes(query) ||
    (ev.category && eventCategories[ev.category]?.emoji + ' ' + ev.title).toLowerCase().includes(query)
  );
}

function filterFriendsBySearch(usersList) {
  if (!friendSearchQuery) return usersList;
  const query = friendSearchQuery.toLowerCase();
  return usersList.filter(user =>
    user.first_name.toLowerCase().includes(query) ||
    user.last_name.toLowerCase().includes(query) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(query)
  );
}

function createSearchUI() {
  // Контейнер для поиска
  const searchContainer = document.createElement('div');
  searchContainer.className = 'search-container';
  searchContainer.style.cssText = 'margin-bottom: 1rem;';

  // Поиск по событиям
  const eventSearchInput = document.createElement('input');
  eventSearchInput.type = 'text';
  eventSearchInput.id = 'searchEventInput';
  eventSearchInput.placeholder = '🔍 Поиск событий...';
  eventSearchInput.style.cssText = 'width: 100%; padding: 0.5rem 1rem; border-radius: 2rem; border: 1px solid #e2e8f0; margin-bottom: 0.5rem; font-size: 0.85rem;';

  eventSearchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderCalendar();

    // Обновляем модальное окно если открыто
    if (document.getElementById('eventModal').classList.contains('active')) {
      renderModalEvents();
    }
  });

  // Поиск по друзьям
  const friendSearchInput = document.createElement('input');
  friendSearchInput.type = 'text';
  friendSearchInput.id = 'searchFriendInput';
  friendSearchInput.placeholder = '🦊 Поиск друзей...';
  friendSearchInput.style.cssText = 'width: 100%; padding: 0.5rem 1rem; border-radius: 2rem; border: 1px solid #e2e8f0; font-size: 0.85rem;';

  friendSearchInput.addEventListener('input', (e) => {
    friendSearchQuery = e.target.value;
    renderFriendsList();
  });

  // Кнопка очистки поиска
  const clearSearchBtn = document.createElement('button');
  clearSearchBtn.textContent = '✕ Очистить поиск';
  clearSearchBtn.style.cssText = 'width: 100%; padding: 0.4rem; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 1rem; cursor: pointer; font-size: 0.75rem; color: #64748b; margin-top: 0.5rem; display: none;';

  clearSearchBtn.addEventListener('click', () => {
    searchQuery = '';
    friendSearchQuery = '';
    eventSearchInput.value = '';
    friendSearchInput.value = '';
    clearSearchBtn.style.display = 'none';
    renderCalendar();
    renderFriendsList();
  });

  // Показываем кнопку очистки если есть поиск
  const showClearBtn = () => {
    clearSearchBtn.style.display = (searchQuery || friendSearchQuery) ? 'block' : 'none';
  };

  eventSearchInput.addEventListener('input', showClearBtn);
  friendSearchInput.addEventListener('input', showClearBtn);

  searchContainer.appendChild(eventSearchInput);
  searchContainer.appendChild(friendSearchInput);
  searchContainer.appendChild(clearSearchBtn);

  return searchContainer;
}

function updateSearchStats() {
  const eventInput = document.getElementById('searchEventInput');
  const friendInput = document.getElementById('searchFriendInput');

  if (!eventInput || !friendInput) return;

  // Можно добавить подсветку активного поиска
  if (searchQuery) {
    eventInput.style.borderColor = '#4f46e5';
    eventInput.style.background = '#f8fafc';
  } else {
    eventInput.style.borderColor = '#e2e8f0';
    eventInput.style.background = 'white';
  }

  if (friendSearchQuery) {
    friendInput.style.borderColor = '#4f46e5';
    friendInput.style.background = '#f8fafc';
  } else {
    friendInput.style.borderColor = '#e2e8f0';
    friendInput.style.background = 'white';
  }
}