import { useState } from 'react';
import { adminApi } from '../adminApi';

export default function AdminLogin({ onLogin }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    localStorage.setItem('admin_key', key);
    try {
      await adminApi.getStats();
      onLogin();
    } catch (err) {
      setError('Ungültiger Admin-Key. Bitte nochmal versuchen.');
      localStorage.removeItem('admin_key');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-2xl font-bold text-gray-800">Admin-Bereich</h1>
          <p className="text-gray-500 text-sm mt-1">Artikeltrainer.de</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin-Key</label>
            <input
              type="password"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="Admin-Key eingeben..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Prüfe...' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
}
