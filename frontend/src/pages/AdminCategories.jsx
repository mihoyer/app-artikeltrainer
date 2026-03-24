import { useState, useEffect } from 'react';
import { adminApi } from '../adminApi';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ slug: '', name: '', description: '', icon: '📚' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    setLoading(true);
    try {
      const cats = await adminApi.getCategories();
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminApi.createCategory(form);
      setSuccess('Kategorie angelegt!');
      setForm({ slug: '', name: '', description: '', icon: '📚' });
      setShowForm(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Kategorien</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          {showForm ? 'Abbrechen' : '+ Neue Kategorie'}
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
          {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-gray-700">Neue Kategorie anlegen</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
              <input
                type="text"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="z.B. artikel"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="z.B. Artikel"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Emoji)</label>
              <input
                type="text"
                value={form.icon}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="📚"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Kurze Beschreibung..."
              />
            </div>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50"
            >
              {saving ? 'Speichern...' : 'Anlegen'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Lade Kategorien...</div>
      ) : (
        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{cat.name}</span>
                    <span className="text-xs text-gray-400">/{cat.slug}</span>
                  </div>
                  {cat.description && <p className="text-sm text-gray-500">{cat.description}</p>}
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">{cat.active_count} aktiv</span>
                  {cat.draft_count > 0 && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">{cat.draft_count} Entwurf</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
