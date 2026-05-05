// ---------- УТИЛИТЫ ----------
function getDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDateKeyFromDate(date) {
  return getDateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

function getMinutes(timeStr) {
  if (!timeStr || timeStr === '') return null;
  let [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => (m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'));
}

function detectCategory(title) {
  const lower = title.toLowerCase();
  if (lower.includes('работа') || lower.includes('проект') || lower.includes('дедлайн')) return 'работа';
  if (lower.includes('спорт') || lower.includes('тренировка') || lower.includes('йога') || lower.includes('фитнес')) return 'спорт';
  if (lower.includes('встреча') || lower.includes('звонок') || lower.includes('созвон')) return 'встреча';
  if (lower.includes('праздник') || lower.includes('день рождения') || lower.includes('вечеринка')) return 'праздник';
  if (lower.includes('учёба') || lower.includes('урок') || lower.includes('курс') || lower.includes('лекция')) return 'учёба';
  if (lower.includes('дом') || lower.includes('семья') || lower.includes('личное')) return 'личное';
  return 'другое';
}

function filterEventsBySearch(events) {
  if (!searchQuery) return events;
  const query = searchQuery.toLowerCase();
  return events.filter(ev => ev.title.toLowerCase().includes(query));
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}