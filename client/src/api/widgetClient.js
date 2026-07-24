const BASE_URL = 'http://localhost:8000/api/v1';

async function widgetRequest(path, apiKey, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.detail || 'Request failed';
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }

  return data;
}

export function sendWidgetMessage(apiKey, sessionId, message) {
  return widgetRequest('/chat/', apiKey, {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, message, widget_source: 'external_widget' }),
  });
}

export function getWidgetHistory(apiKey, sessionId) {
  return widgetRequest(`/chat/history?session_id=${encodeURIComponent(sessionId)}`, apiKey, {
    method: 'GET',
  });
}