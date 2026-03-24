/**
 * Admin API Client
 * Alle Aufrufe an die geschützten /api/admin/* Endpunkte
 */

const BASE = import.meta.env.VITE_API_URL || '';

function getAdminKey() {
  return localStorage.getItem('admin_key') || '';
}

async function adminFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': getAdminKey(),
      ...(options.headers || {}),
    },
  });
  if (res.status === 403) throw new Error('Nicht autorisiert – bitte Admin-Key prüfen');
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Fehler beim API-Aufruf');
  }
  return res.json();
}

export const adminApi = {
  // Dashboard
  getStats: () => adminFetch('/api/admin/stats'),

  // Aufgaben
  getExercises: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.category_id) q.set('category_id', params.category_id);
    return adminFetch(`/api/admin/exercises?${q}`);
  },
  getExercise: (id) => adminFetch(`/api/admin/exercises/${id}`),
  createExercise: (data) => adminFetch('/api/admin/exercises', { method: 'POST', body: JSON.stringify(data) }),
  updateExercise: (id, data) => adminFetch(`/api/admin/exercises/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  approveExercise: (id) => adminFetch(`/api/admin/exercises/${id}/approve`, { method: 'POST' }),
  disableExercise: (id) => adminFetch(`/api/admin/exercises/${id}/disable`, { method: 'POST' }),
  deleteExercise: (id) => adminFetch(`/api/admin/exercises/${id}`, { method: 'DELETE' }),

  // Kategorien
  getCategories: () => adminFetch('/api/admin/categories'),
  createCategory: (data) => adminFetch('/api/admin/categories', { method: 'POST', body: JSON.stringify(data) }),

  // KI-Generierung
  generateExercises: (category_id, count) => adminFetch('/api/admin/generate', {
    method: 'POST',
    body: JSON.stringify({ category_id, count })
  }),

  // Cache
  getCache: () => adminFetch('/api/admin/cache'),
  clearCache: () => adminFetch('/api/admin/cache', { method: 'DELETE' }),

  // Nutzer
  getUsers: () => adminFetch('/api/admin/users'),
};
