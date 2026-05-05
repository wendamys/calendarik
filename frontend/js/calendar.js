// ---------- ОТРИСОВКА КАЛЕНДАРЯ ----------
async function renderCalendar() {
  if (!currentUser) {
    const tbody = document.getElementById('calendarBody');
    tbody.innerHTML = '';

    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 7;
    emptyCell.style.cssText = 'text-align:center;padding:2rem;cursor:pointer;font-size:1.1rem;';
    emptyCell.innerHTML = '🦊 <span style="text-decoration:underline;color:#4f46e5;font-weight:600;">Создайте пользователя</span>, чтобы начать';
    emptyCell.addEventListener('click', async () => {
      await renderUserListModal();
      document.getElementById('switchUserModal').classList.add('active');
      setTimeout(() => {
        document.getElementById('newUserFirstName').focus();
      }, 300);
    });
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);

    document.getElementById('monthYearDisplay').innerText = 'Нет пользователя';
    return;
  }

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  let startWeekday = firstDayOfMonth.getDay();
  let startOffset = startWeekday === 0 ? 6 : startWeekday - 1;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const tbody = document.getElementById('calendarBody');

  tbody.style.opacity = '0';
  tbody.style.transform = 'translateY(10px)';

  setTimeout(() => {
    tbody.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    tbody.style.opacity = '1';
    tbody.style.transform = 'translateY(0)';
  }, 50);

  tbody.innerHTML = '';

  let dateCounter = 1, nextCounter = 1, cellIndex = 0;

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  document.getElementById('monthYearDisplay').innerText =
    `${monthNames[currentMonth]} ${currentYear}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let r = 0; r < 6; r++) {
    const tr = document.createElement('tr');

    for (let c = 0; c < 7; c++) {
      const td = document.createElement('td');
      let dayValue = null, dateObj = null;

      if (cellIndex < startOffset) {
        let prevDay = prevMonthDays - (startOffset - cellIndex) + 1;
        dayValue = prevDay;
        let prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        let prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        dateObj = new Date(prevYear, prevMonth, prevDay);
        td.classList.add('other-month');
      } else if (dateCounter <= daysInMonth) {
        dayValue = dateCounter;
        dateObj = new Date(currentYear, currentMonth, dateCounter);
        dateCounter++;
      } else {
        dayValue = nextCounter;
        let nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        let nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        dateObj = new Date(nextYear, nextMonth, nextCounter);
        nextCounter++;
        td.classList.add('other-month');
      }

      const daySpan = document.createElement('div');
      daySpan.className = 'day-number';
      daySpan.innerText = dayValue;
      td.appendChild(daySpan);

      if (dateObj) {
        const key = getDateKeyFromDate(dateObj);
        let evts = currentEventsCache[key] || [];
        evts = filterEventsBySearch(evts);

        if (evts.length) {
          const dotDiv = document.createElement('div');
          dotDiv.className = 'event-dot';

          for (let i = 0; i < Math.min(evts.length, 3); i++) {
            const dot = document.createElement('span');
            dot.className = 'dot';
            dot.style.backgroundColor = eventCategories[evts[i].category]?.color || '#f97316';
            dotDiv.appendChild(dot);
          }

          if (evts.length > 3) {
            dotDiv.innerHTML += `<span style="font-size:9px;">+${evts.length - 3}</span>`;
          }

          td.appendChild(dotDiv);
        }

        const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

        if (dateOnly >= today) {
          let status = getStatusForDate(dateObj);
          if (status === 'free') td.classList.add('search-green');
          else if (status === 'busy') td.classList.add('search-red');
          else if (status === 'warning') td.classList.add('search-yellow');
        }
      }

      if (selectedDate && dateObj && selectedDate.toDateString() === dateObj.toDateString()) {
        td.style.boxShadow = 'inset 0 0 0 2px #4f46e5';
        td.style.backgroundColor = '#e0e7ff';
      }

      td.addEventListener('click', (function(dObj) {
        return () => openModal(dObj);
      })(dateObj));

      td.addEventListener('dblclick', (function(dObj) {
        return (e) => {
          e.preventDefault();
          openModal(dObj);
          setTimeout(() => document.getElementById('modalEventTitle').focus(), 300);
        };
      })(dateObj));

      tr.appendChild(td);
      cellIndex++;
    }

    tbody.appendChild(tr);
  }

  await renderFriendsList();
  updateFriendSelect();
}

// ---------- НАВИГАЦИЯ ----------
async function prevMonth() {
  if (!currentUser) return;

  let nm = currentMonth - 1, ny = currentYear;
  if (nm < 0) { nm = 11; ny--; }
  currentMonth = nm;
  currentYear = ny;
  selectedDate = new Date(currentYear, currentMonth, 1);

  const targetUserId = activeUserId || currentUser.id;
  await loadEventsForUser(targetUserId);
  await loadAllFriendsEventsCount();
  refreshFutureCache();
  await renderCalendar();
}

async function nextMonth() {
  if (!currentUser) return;

  let nm = currentMonth + 1, ny = currentYear;
  if (nm > 11) { nm = 0; ny++; }
  currentMonth = nm;
  currentYear = ny;
  selectedDate = new Date(currentYear, currentMonth, 1);

  const targetUserId = activeUserId || currentUser.id;
  await loadEventsForUser(targetUserId);
  await loadAllFriendsEventsCount();
  refreshFutureCache();
  await renderCalendar();
}

function initAutoHighlight() {
  const timeFromInput = document.getElementById('searchTimeFrom');
  const timeToInput = document.getElementById('searchTimeTo');
  currentTimeFrom = timeFromInput.value;
  currentTimeTo = timeToInput.value;
  refreshFutureCache();
}