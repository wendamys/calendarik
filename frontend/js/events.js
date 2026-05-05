// ---------- ПРЕОБРАЗОВАНИЕ ДАННЫХ ----------
function transformEventsToCache(apiEvents) {
  const cache = {};
  for (let ev of apiEvents) {
    let startDate, startTime = '', endTime = '';

    if (ev.event_start) {
      const startParts = ev.event_start.split('T');
      startDate = startParts[0];
      if (startParts[1]) startTime = startParts[1].substring(0, 5);
    }

    if (ev.event_end) {
      const endParts = ev.event_end.split('T');
      if (endParts[1]) endTime = endParts[1].substring(0, 5);
    }

    if (startTime === '00:00' && !endTime) startTime = '';

    if (!cache[startDate]) cache[startDate] = [];

    cache[startDate].push({
      id: ev.id,
      title: ev.name,
      start: startTime,
      end: endTime,
      user_id: ev.user_id,
      category: ev.category || detectCategory(ev.name)
    });
  }
  return cache;
}

// ---------- ЗАГРУЗКА ДАННЫХ ----------
async function loadInitialData() {
  try {
    users = await fetchUsers();

    if (users.length === 0) {
      showToast('Нет пользователей в системе. Создайте нового.');
      currentUser = null;
      updateCurrentUserDisplay();
      return;
    }

    const savedUserId = localStorage.getItem('currentUserId');
    if (savedUserId) {
      const savedUser = users.find(u => u.id === parseInt(savedUserId));
      currentUser = savedUser || users[0];
    } else {
      currentUser = users[0];
    }

    await loadEventsForUser(null);
    await loadAllFriendsEventsCount();
    updateCurrentUserDisplay();
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    showToast('Ошибка загрузки данных');
  }
}

async function loadEventsForUser(userId) {
  const targetUserId = userId || (currentUser ? currentUser.id : null);
  if (!targetUserId) {
    currentEventsCache = {};
    return;
  }

  try {
    const apiEvents = await fetchEvents(targetUserId, currentYear, currentMonth);
    currentEventsCache = transformEventsToCache(apiEvents);
  } catch (error) {
    console.error('Ошибка загрузки событий:', error);
    currentEventsCache = {};
  }
}

async function loadAllFriendsEventsCount() {
  if (!users || users.length === 0 || !currentUser) return;

  for (const user of users) {
    if (user.id === currentUser.id) continue;

    try {
      const friendEvents = await fetchEvents(user.id, currentYear, currentMonth);
      const cacheKey = `${user.id}-${currentYear}-${currentMonth}`;
      friendsEventsCountCache[cacheKey] = friendEvents.length;
    } catch (error) {
      console.error(`Ошибка загрузки событий для ${user.first_name}:`, error);
    }
  }
}

function getFriendEventsCount(userId) {
  const cacheKey = `${userId}-${currentYear}-${currentMonth}`;
  return friendsEventsCountCache[cacheKey] || 0;
}

// ---------- ЛОГИКА ПОДСВЕТКИ ----------
function getDayStatus(dateKey, startMin, endMin) {
  const events = currentEventsCache[dateKey] || [];
  if (events.length === 0) return 'free';

  let hasAnyEvent = false;
  let hasIntersection = false;

  for (let ev of events) {
    let evStart = getMinutes(ev.start);
    let evEnd = getMinutes(ev.end);

    if (evStart === null) {
      hasAnyEvent = true;
      continue;
    }

    if (evEnd === null) {
      hasAnyEvent = true;
      if (evStart >= startMin && evStart < endMin) hasIntersection = true;
      continue;
    }

    hasAnyEvent = true;
    if (evEnd <= evStart) evEnd = evStart + 30;
    if (Math.max(evStart, startMin) < Math.min(evEnd, endMin)) hasIntersection = true;
  }

  if (hasIntersection) return 'busy';
  if (hasAnyEvent) return 'warning';
  return 'free';
}

function refreshFutureCache() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMin = getMinutes(currentTimeFrom);
  const endMin = getMinutes(currentTimeTo);

  if (startMin === null || endMin === null) return;

  futureStatusCache.clear();

  let cursor = new Date(today);
  let maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 2);

  while (cursor <= maxDate) {
    const dateKey = getDateKeyFromDate(cursor);
    let status = getDayStatus(dateKey, startMin, endMin);
    futureStatusCache.set(dateKey, status);
    cursor.setDate(cursor.getDate() + 1);
  }
}

function getStatusForDate(dateObj) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  if (dateOnly < today) return null;
  const key = getDateKeyFromDate(dateObj);
  return futureStatusCache.get(key) || 'free';
}

function updateAllFutureHighlight() {
  currentTimeFrom = document.getElementById('searchTimeFrom').value;
  currentTimeTo = document.getElementById('searchTimeTo').value;

  let startMin = getMinutes(currentTimeFrom);
  let endMin = getMinutes(currentTimeTo);

  if (startMin === null || endMin === null) {
    showToast('Укажите корректное время');
    return false;
  }

  if (startMin >= endMin) {
    showToast('Время начала должно быть раньше окончания');
    document.getElementById('searchTimeTo').value = currentTimeFrom;
    return false;
  }

  refreshFutureCache();
  renderCalendar();

  let busy = 0, warn = 0;
  for (let v of futureStatusCache.values()) {
    if (v === 'busy') busy++;
    if (v === 'warning') warn++;
  }

  showToast(`🔍 Будущие дни: 🔴 ${busy} занятых, 🟡 ${warn} с делами вне интервала`);
  return true;
}