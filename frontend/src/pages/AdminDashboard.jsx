import { useState, useEffect } from 'react';
import { adminApi } from '../adminApi';

function StatCard({ label, value, sub, color = 'green' }) {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  };
  return (
    <div className={`border rounded-xl p-4 ${colors[color]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="font-medium text-sm mt-1">{label}</div>
      {sub && <div className="text-xs opacity-70 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getStats()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">Lade Statistiken...</div>;
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Nutzer gesamt" value={stats.users.total} color="blue" />
        <StatCard label="Aufgaben aktiv" value={stats.exercises.active} sub={`${stats.exercises.total} gesamt`} color="green" />
        <StatCard label="Entwürfe" value={stats.exercises.draft} sub="Warten auf Freigabe" color="yellow" />
        <StatCard label="Antworten gesamt" value={stats.answers.total} sub={`${stats.answers.accuracy}% korrekt`} color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Aufgaben-Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Aktiv</span>
              <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">{stats.exercises.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Entwurf</span>
              <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">{stats.exercises.draft}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Deaktiviert</span>
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">{stats.exercises.disabled}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">KI-generiert</span>
              <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">{stats.exercises.ai_generated}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-700 mb-3">KI-Feedback-Cache</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Gespeicherte Bewertungen</span>
              <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{stats.cache.entries}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Jeder Cache-Eintrag spart einen OpenAI API-Aufruf wenn ein Nutzer dieselbe Antwort gibt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
