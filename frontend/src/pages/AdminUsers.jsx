import { useState, useEffect } from 'react';
import { adminApi } from '../adminApi';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const levelColors = {
    'Einsteiger': 'bg-gray-100 text-gray-600',
    'Grundkenntnisse': 'bg-blue-100 text-blue-700',
    'Mittelstufe': 'bg-yellow-100 text-yellow-700',
    'Fortgeschritten': 'bg-orange-100 text-orange-700',
    'Experte': 'bg-green-100 text-green-700',
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Nutzer ({users.length})</h2>
      <p className="text-sm text-gray-500 mb-4">
        Alle Nutzer sind vollständig anonym. Es werden nur Token-Präfixe und Lernstatistiken gespeichert — keine personenbezogenen Daten.
      </p>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Lade Nutzer...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Token</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Niveau</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Elo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Antworten</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Genauigkeit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Zuletzt aktiv</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.token_prefix}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${levelColors[u.level_label] || 'bg-gray-100 text-gray-600'}`}>
                        {u.level_label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700">{u.skill_level}</td>
                    <td className="px-4 py-3 text-gray-600">{u.total_answers}</td>
                    <td className="px-4 py-3 text-gray-600">{u.accuracy}%</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(u.last_seen).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
