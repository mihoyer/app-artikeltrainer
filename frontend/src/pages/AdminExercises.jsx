import { useState, useEffect } from 'react';
import { adminApi } from '../adminApi';

const STATUS_LABELS = {
  active: { label: 'Aktiv', cls: 'bg-green-100 text-green-700' },
  draft: { label: 'Entwurf', cls: 'bg-yellow-100 text-yellow-700' },
  disabled: { label: 'Deaktiviert', cls: 'bg-gray-100 text-gray-500' },
};

// ---------------------------------------------------------------------------
// Modal: Aufgabe bearbeiten / neu anlegen
// ---------------------------------------------------------------------------
function ExerciseModal({ exercise, categories, onClose, onSaved }) {
  const isNew = !exercise?.id;
  const [form, setForm] = useState(
    exercise || {
      category_id: categories[0]?.id || 1,
      exercise_type: 'multichoice',
      question: '',
      content: { options: ['der', 'die', 'das'], correct_answer: '', example: '', hint: '' },
      difficulty: 1000,
      status: 'draft',
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setContent(key, value) {
    setForm(f => ({ ...f, content: { ...f.content, [key]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        await adminApi.createExercise(form);
      } else {
        await adminApi.updateExercise(exercise.id, form);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">{isNew ? 'Neue Aufgabe' : `Aufgabe #${exercise.id} bearbeiten`}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
              <select
                value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
              <select
                value={form.exercise_type}
                onChange={e => setForm(f => ({ ...f, exercise_type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="multichoice">Multiple Choice</option>
                <option value="vocab">Vokabeln</option>
                <option value="dragdrop">Drag & Drop</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frage</label>
            <input
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="z.B. Welcher Artikel gehört zu 'Tisch'?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Antwortoptionen (kommagetrennt)</label>
            <input
              value={(form.content?.options || []).join(', ')}
              onChange={e => setContent('options', e.target.value.split(',').map(s => s.trim()))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="der, die, das"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Richtige Antwort</label>
            <input
              value={form.content?.correct_answer || ''}
              onChange={e => setContent('correct_answer', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="der"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hinweis (für KI-Feedback)</label>
            <input
              value={form.content?.hint || ''}
              onChange={e => setContent('hint', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Tisch ist maskulin."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beispielsatz</label>
            <input
              value={form.content?.example || ''}
              onChange={e => setContent('example', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Der Tisch steht im Wohnzimmer."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schwierigkeit (Elo)</label>
              <input
                type="number"
                value={form.difficulty}
                onChange={e => setForm(f => ({ ...f, difficulty: parseFloat(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                min="500" max="2000" step="50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="draft">Entwurf</option>
                <option value="active">Aktiv</option>
                <option value="disabled">Deaktiviert</option>
              </select>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Abbrechen</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50"
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal: KI-Aufgaben generieren
// ---------------------------------------------------------------------------
function GenerateModal({ categories, onClose, onGenerated }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 1);
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await adminApi.generateExercises(categoryId, count);
      setResult(res);
      onGenerated();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-800">🤖 KI-Aufgaben generieren</h3>
            <p className="text-sm text-gray-500 mt-0.5">Die KI erstellt neue Aufgaben als Entwürfe zur Prüfung</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  disabled={loading}
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anzahl Aufgaben (1–20)</label>
                <input
                  type="number"
                  value={count}
                  onChange={e => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  min="1" max="20"
                  disabled={loading}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
                <strong>Hinweis:</strong> Die generierten Aufgaben landen im Status <strong>Entwurf</strong> und sind für Nutzer nicht sichtbar. Du kannst sie danach einzeln prüfen und freigeben.
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
            </>
          ) : (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
                ✅ <strong>{result.generated} Aufgaben</strong> wurden als Entwürfe gespeichert.
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {result.exercises.map((ex, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <span className="text-gray-400 text-xs">#{ex.id} · Elo {ex.difficulty}</span>
                    <p className="text-gray-700 font-medium">{ex.question}</p>
                    <p className="text-gray-500 text-xs">Richtig: <span className="font-medium text-green-600">{ex.correct_answer}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            {result ? 'Schließen' : 'Abbrechen'}
          </button>
          {!result && (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-5 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  KI arbeitet...
                </>
              ) : '🤖 Generieren'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hauptkomponente
// ---------------------------------------------------------------------------
export default function AdminExercises() {
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | exercise-object
  const [generateModal, setGenerateModal] = useState(false);
  const [confirm, setConfirm] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [exs, cats] = await Promise.all([
        adminApi.getExercises({ status: filterStatus || undefined, category_id: filterCat || undefined }),
        adminApi.getCategories(),
      ]);
      setExercises(exs);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filterStatus, filterCat]);

  async function handleApprove(id) {
    await adminApi.approveExercise(id);
    load();
  }

  async function handleDisable(id) {
    await adminApi.disableExercise(id);
    load();
  }

  async function handleDelete(id) {
    await adminApi.deleteExercise(id);
    setConfirm(null);
    load();
  }

  // Anzahl Entwürfe für Badge
  const draftCount = exercises.filter(e => e.status === 'draft').length;

  return (
    <div>
      {modal && (
        <ExerciseModal
          exercise={modal === 'new' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
      {generateModal && (
        <GenerateModal
          categories={categories}
          onClose={() => setGenerateModal(false)}
          onGenerated={load}
        />
      )}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-800 mb-2">Aufgabe löschen?</h3>
            <p className="text-sm text-gray-500 mb-4">Diese Aktion kann nicht rückgängig gemacht werden. Alle Fortschrittsdaten und Cache-Einträge werden ebenfalls gelöscht.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg">Abbrechen</button>
              <button onClick={() => handleDelete(confirm)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Löschen</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800">Aufgaben</h2>
          {draftCount > 0 && (
            <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {draftCount} Entwurf{draftCount !== 1 ? 'e' : ''} warten
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setGenerateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-1.5"
          >
            🤖 KI generieren
          </button>
          <button
            onClick={() => setModal('new')}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            + Neue Aufgabe
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Alle Status</option>
          <option value="active">Aktiv</option>
          <option value="draft">Entwurf</option>
          <option value="disabled">Deaktiviert</option>
        </select>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Alle Kategorien</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        {draftCount > 0 && (
          <button
            onClick={() => setFilterStatus('draft')}
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-sm font-medium px-3 py-2 rounded-lg"
          >
            Entwürfe prüfen →
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Lade Aufgaben...</div>
      ) : (
        <div className="space-y-3">
          {exercises.length === 0 && <div className="text-center py-12 text-gray-400">Keine Aufgaben gefunden.</div>}
          {exercises.map(ex => {
            const s = STATUS_LABELS[ex.status] || STATUS_LABELS.disabled;
            return (
              <div key={ex.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400">#{ex.id}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ex.category?.icon} {ex.category?.name}</span>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Elo {ex.difficulty}</span>
                      {ex.ai_generated && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">🤖 KI</span>}
                    </div>
                    <p className="text-sm font-medium text-gray-800">{ex.question}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Richtig: <span className="font-medium text-gray-600">{ex.content?.correct_answer || ex.content?.correct}</span>
                      {' · '}Optionen: {(ex.content?.options || []).join(', ')}
                      {' · '}{ex.answer_count || 0} Antworten
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {ex.status === 'draft' && (
                      <button
                        onClick={() => handleApprove(ex.id)}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium"
                      >
                        ✓ Freigeben
                      </button>
                    )}
                    {ex.status === 'active' && (
                      <button
                        onClick={() => handleDisable(ex.id)}
                        className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg"
                      >
                        Deaktivieren
                      </button>
                    )}
                    {ex.status === 'disabled' && (
                      <button
                        onClick={() => handleApprove(ex.id)}
                        className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg"
                      >
                        Aktivieren
                      </button>
                    )}
                    <button
                      onClick={() => setModal(ex)}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => setConfirm(ex.id)}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
