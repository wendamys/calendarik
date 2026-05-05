// ---------- API ЗАПРОСЫ ----------
async function fetchUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('Ошибка загрузки пользователей');
    const data = await response.json();
    console.log("Данные из БД (массив):", data);
    return data;
  } catch (error) {
    console.error("Не удалось загрузить пользователей:", error);
    return [];
  }
}

async function fetchEvents(userId, year, month) {
  try {
    const response = await fetch(`${API_BASE_URL}/events`);
    if (!response.ok) throw new Error('Ошибка загрузки событий');
    const allEvents = await response.json();

    const filteredEvents = allEvents.filter(ev => {
      if (ev.user_id !== userId) return false;
      const eventDate = new Date(ev.event_start);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });

    return filteredEvents;
  } catch (error) {
    console.error("Не удалось загрузить события:", error);
    return [];
  }
}

async function createEvent(userId, dateKey, name, startTime, endTime, category) {
  try {
    let eventStart = startTime ? `${dateKey}T${startTime}:00` : `${dateKey}T00:00:00`;
    let eventEnd = endTime ? `${dateKey}T${endTime}:00` : null;

    const body = {
      name: name,
      event_start: eventStart,
      event_end: eventEnd,
      user_id: userId
    };

    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Ошибка создания события');
    }

    const newEvent = await response.json();
    newEvent.category = category || detectCategory(name);
    return newEvent;
  } catch (error) {
    console.error("Ошибка создания события:", error);
    throw error;
  }
}

async function updateEvent(eventId, name, startTime, endTime, dateKey, userId) {
  try {
    let eventStart = startTime ? `${dateKey}T${startTime}:00` : `${dateKey}T00:00:00`;
    let eventEnd = endTime ? `${dateKey}T${endTime}:00` : null;

    const body = {
      name: name,
      event_start: eventStart,
      event_end: eventEnd,
      user_id: userId
    };

    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Ошибка обновления события');
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка обновления события:", error);
    throw error;
  }
}

async function deleteEvent(eventId) {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Ошибка удаления события');
    }

    return true;
  } catch (error) {
    console.error("Ошибка удаления события:", error);
    throw error;
  }
}

async function createUser(firstName, lastName) {
  try {
    const body = {
      first_name: firstName,
      last_name: lastName
    };

    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Ошибка создания пользователя');
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка создания пользователя:", error);
    throw error;
  }
}

async function updateUser(userId, firstName, lastName) {
  try {
    const body = {
      first_name: firstName,
      last_name: lastName
    };

    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Ошибка обновления пользователя');
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка обновления пользователя:", error);
    throw error;
  }
}

async function deleteUser(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Ошибка удаления пользователя');
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка удаления пользователя:", error);
    throw error;
  }
}