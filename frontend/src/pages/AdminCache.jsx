import { useState, useEffect } from 'react';
import { adminApi } from '../adminApi';

export default function AdminCache() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await adminApi.getCache();
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleClear() {
    if (!window.confirm('Gesamten KI-Cache leeren? Alle gespeicherten Bewertungen werden gelöscht und müssen neu von der KI generiert werden.')) return;
    setClearing(true);
    try {
      const res = await adminApi.clearCache();
      setMessage(res.message);
      load();
    } finally {
      setClearing(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">KI-Feedback-Cache</h2>
        <button
          onClick={handleClear}
          disabled={clearing}
          className="bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-4 py-2 rounded-lg border border-red-200 disabled:opacity-50"
        >
          {clearing ? 'Leere Cache...' : '🗑 Cache leeren'}
        </button>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
          {message}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-700">
          <strong>Wie funktioniert das Caching?</strong> Wenn ein Nutzer eine Antwort gibt, prüft das System zuerst ob dieselbe Antwort für dieselbe Aufgabe bereits von der KI bewertet wurde. Falls ja, wird das gespeicherte Feedback zurückgegeben — ohne einen neuen API-Aufruf. Das spart Kosten und beschleunigt die Antwortzeit.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Lade Cache...</div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{entries.length} gespeicherte Bewertungen (neueste zuerst)</p>
          {entries.map(e => (
            <div key={e.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 text-lg ${e.is_correct ? '✅' : '❌'}`}>{e.is_correct ? '✅' : '❌'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">Aufgabe #{e.exercise_id}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">{new Date(e.created_at).toLocaleDateString('de-DE')}</span>
                  </div>
                  <p className="text-sm text-gray-700">{e.feedback}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
