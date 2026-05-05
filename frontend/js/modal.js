// ---------- МОДАЛЬНОЕ ОКНО СОБЫТИЙ ----------
let currentModalDate = null;

function openModal(dateObj) {
  if (!dateObj || !currentUser) return;

  selectedDate = new Date(dateObj);
  currentModalDate = selectedDate;
  editingEventId = null;
  renderCalendar();

  const monthShort = [
    'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
    'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
  ];

  document.getElementById('modalDateTitle').innerHTML =
    `📅 ${selectedDate.getDate()} ${monthShort[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  const select = document.getElementById('modalFriendSelect');
  select.value = activeUserId ? activeUserId : 'me';

  const friendSelector = document.querySelector('.friend-selector');
  const addEventSection = document.querySelector('.add-event-modal');

  if (activeUserId) {
    friendSelector.style.display = 'none';
    addEventSection.style.display = 'none';
  } else {
    friendSelector.style.display = 'block';
    addEventSection.style.display = 'block';
  }

  document.getElementById('modalEventTitle').value = '';
  document.getElementById('modalEventStart').value = '';
  document.getElementById('modalEventEnd').value = '';
  document.getElementById('modalAddEventBtn').textContent = '➕ Добавить';

  resetValidation();
  renderModalEvents();
  document.getElementById('eventModal').classList.add('active');
}

function startEditEvent(ev) {
  editingEventId = ev.id;
  document.getElementById('modalEventTitle').value = ev.title;
  document.getElementById('modalEventStart').value = ev.start;
  document.getElementById('modalEventEnd').value = ev.end;
  document.getElementById('modalAddEventBtn').textContent = '💾 Сохранить';
  document.getElementById('modalEventTitle').focus();
}

function resetEditMode() {
  editingEventId = null;
  document.getElementById('modalEventTitle').value = '';
  document.getElementById('modalEventStart').value = '';
  document.getElementById('modalEventEnd').value = '';
  document.getElementById('modalAddEventBtn').textContent = '➕ Добавить';
}

function renderModalEvents() {
  if (!currentModalDate) return;

  const key = getDateKeyFromDate(currentModalDate);
  let events = currentEventsCache[key] || [];
  const container = document.getElementById('modalEventsList');

  events = filterEventsBySearch(events);

  let friendHeader = '';
  if (activeUserId) {
    const friend = users.find(u => u.id === activeUserId);
    if (friend) {
      friendHeader = `
        <div style="background: #eef2ff; padding: 0.8rem; border-radius: 0.8rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
          <span>📋 События: <strong>${escapeHtml(friend.first_name)} ${escapeHtml(friend.last_name)}</strong></span>
          <button id="backToMyEventsBtn" style="background: #4f46e5; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 1rem; cursor: pointer; font-size: 0.8rem; font-weight: 600;">
            ← Мои события
          </button>
        </div>
      `;
    }
  }

  if (events.length === 0) {
    container.innerHTML = friendHeader + '<div class="empty-events">✨ Нет событий</div>';
  } else {
    container.innerHTML = friendHeader;

    events.forEach(ev => {
      const startStr = ev.start || '—';
      const endStr = ev.end || '—';
      let timeDisplay;

      if (startStr !== '—' && endStr !== '—') {
        timeDisplay = `${startStr} – ${endStr}`;
      } else if (startStr !== '—' && endStr === '—') {
        timeDisplay = `${startStr} (без окончания)`;
      } else {
        timeDisplay = '⏳ время не указано';
      }

      const category = eventCategories[ev.category] || eventCategories['другое'];

      let friendBadge = '';
      if (currentUser && ev.user_id !== currentUser.id) {
        const friend = users.find(u => u.id === ev.user_id);
        if (friend) {
          friendBadge = `<span class="event-friend-badge">${escapeHtml(friend.first_name)} ${escapeHtml(friend.last_name)}</span>`;
        }
      }

      const div = document.createElement('div');
      div.className = 'event-item-modal';
      div.style.borderLeft = `4px solid ${category.color}`;
      div.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>${category.emoji}</span>
            <strong>${escapeHtml(ev.title)}${friendBadge}</strong>
          </div>
          <div class="event-time-range">🕒 ${timeDisplay}</div>
        </div>
        ${!activeUserId ? `
          <div style="display: flex; gap: 4px;">
            <button class="edit-event-modal" data-id="${ev.id}" style="background: none; border: none; color: #4f46e5; cursor: pointer; font-size: 1.2rem;" title="Редактировать">✏️</button>
            <button class="delete-event-modal" data-id="${ev.id}" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.2rem;" title="Удалить">🗑</button>
          </div>
        ` : ''}
      `;

      if (!activeUserId) {
        div.querySelector('.edit-event-modal').addEventListener('click', (e) => {
          e.stopPropagation();
          startEditEvent(ev);
        });

        div.querySelector('.delete-event-modal').addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`Удалить событие "${ev.title}"?`)) {
            deleteEventFromDate(ev.id);
          }
        });
      }

      container.appendChild(div);
    });
  }

  const backBtn = document.getElementById('backToMyEventsBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => deselectFriend());
  }

  if (!activeUserId) {
    const addBtn = document.getElementById('modalAddEventBtn');
    const newBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newBtn, addBtn);

    newBtn.addEventListener('click', async () => {
      const title = document.getElementById('modalEventTitle').value.trim();
      let start = document.getElementById('modalEventStart').value;
      let end = document.getElementById('modalEventEnd').value;

      if (!title) { showValidation('modalEventTitle', 'Введите название'); return; }
      if (!start) { showValidation('modalEventStart', 'Укажите время начала'); return; }

      if (start && end) {
        let startMin = getMinutes(start), endMin = getMinutes(end);
        if (startMin >= endMin) {
          showValidation('modalEventEnd', 'Конец должен быть позже начала');
          return;
        }
      }

      const key = getDateKeyFromDate(currentModalDate);
      const targetUserId = currentUser.id;
      const category = detectCategory(title);

      try {
        if (editingEventId) {
          await updateEvent(editingEventId, title, start, end, key, targetUserId);

          if (currentEventsCache[key]) {
            const eventIndex = currentEventsCache[key].findIndex(ev => ev.id === editingEventId);
            if (eventIndex !== -1) {
              currentEventsCache[key][eventIndex] = {
                ...currentEventsCache[key][eventIndex],
                title: title,
                start: start,
                end: end || '',
                category: category
              };
            }
          }

          showToast(`✅ Событие "${title}" обновлено`);
          resetEditMode();
        } else {
          const newEvent = await createEvent(targetUserId, key, title, start, end || null, category);

          if (!currentEventsCache[key]) currentEventsCache[key] = [];

          let startTime = '', endTime = '';
          if (newEvent.event_start) {
            const startParts = newEvent.event_start.split('T');
            if (startParts[1]) startTime = startParts[1].substring(0, 5);
          }
          if (newEvent.event_end) {
            const endParts = newEvent.event_end.split('T');
            if (endParts[1]) endTime = endParts[1].substring(0, 5);
          }

          currentEventsCache[key].push({
            id: newEvent.id,
            title: newEvent.name,
            start: startTime || start,
            end: endTime || end || '',
            user_id: targetUserId,
            category: category
          });

          const cacheKey = `${targetUserId}-${currentYear}-${currentMonth}`;
          if (friendsEventsCountCache[cacheKey] !== undefined) {
            friendsEventsCountCache[cacheKey]++;
          }

          let toastMsg = `✅ Добавлено "${title}"`;
          if (!end) toastMsg += ' (без окончания)';
          showToast(toastMsg);
        }

        refreshFutureCache();
        await renderCalendar();
        renderModalEvents();

        document.getElementById('modalEventTitle').value = '';
        document.getElementById('modalEventStart').value = '';
        document.getElementById('modalEventEnd').value = '';
        resetValidation();
      } catch (error) {
        showToast('Ошибка при сохранении события');
      }
    });
  }
}

async function deleteEventFromDate(eventId) {
  try {
    await deleteEvent(eventId);

    const key = getDateKeyFromDate(currentModalDate);
    if (currentEventsCache[key]) {
      const deletedEvent = currentEventsCache[key].find(ev => ev.id === eventId);
      currentEventsCache[key] = currentEventsCache[key].filter(ev => ev.id !== eventId);
      if (currentEventsCache[key].length === 0) delete currentEventsCache[key];

      if (deletedEvent) {
        const cacheKey = `${deletedEvent.user_id}-${currentYear}-${currentMonth}`;
        if (friendsEventsCountCache[cacheKey] !== undefined && friendsEventsCountCache[cacheKey] > 0) {
          friendsEventsCountCache[cacheKey]--;
        }
      }
    }

    showToast('Событие удалено');
    refreshFutureCache();
    await renderCalendar();
    renderModalEvents();
  } catch (error) {
    showToast('Ошибка при удалении события');
  }
}