import { useState, useEffect } from 'react';
import { adminApi } from '../adminApi';

const STATUS_LABELS = {
  active: { label: 'Aktiv', cls: 'bg-green-100 text-green-700' },
  draft: { label: 'Entwurf', cls: 'bg-yellow-100 text-yellow-700' },
  disabled: { label: 'Deaktiviert', cls: 'bg-gray-100 text-gray-500' },
};

const TYPE_LABELS = {
  multichoice: { label: 'Multiple Choice', cls: 'bg-blue-50 text-blue-600' },
  dragdrop:    { label: 'Drag & Drop',     cls: 'bg-orange-50 text-orange-600' },
  flashcard:   { label: 'Karteikarte',     cls: 'bg-teal-50 text-teal-600' },
  fillblank:   { label: 'Lückentext',      cls: 'bg-violet-50 text-violet-600' },
  declension:  { label: 'Deklination',     cls: 'bg-pink-50 text-pink-600' },
};

// Standardinhalte je Typ
function defaultContent(type) {
  switch (type) {
    case 'dragdrop':
      return { words: ['Der', 'Tisch', 'steht', 'im', 'Wohnzimmer'], correct_order: ['Der', 'Tisch', 'steht', 'im', 'Wohnzimmer'], hint: '', example: '' };
    case 'flashcard':
      return { front: '', back: '', hint: '', example: '' };
    case 'fillblank':
      return { sentence: 'Ich gebe ___ Kind ein Buch.', correct_answer: 'dem', options: ['dem', 'den', 'der', 'das'], hint: '', example: '' };
    case 'declension':
      return { noun: 'der Hund', gender: 'maskulin', cases: { nominativ: 'der Hund', akkusativ: 'den Hund', dativ: 'dem Hund', genitiv: 'des Hundes' }, sentences: ['Der Hund bellt.', 'Ich sehe den Hund.', 'Ich gebe dem Hund Futter.', 'Das Fell des Hundes ist braun.'], hint: '', example: '' };
    default: // multichoice
      return { options: ['der', 'die', 'das'], correct_answer: '', example: '', hint: '' };
  }
}

// ---------------------------------------------------------------------------
// Typspezifische Formularfelder
// ---------------------------------------------------------------------------
function ContentFields({ type, content, setContent }) {
  if (type === 'dragdrop') {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wörter (kommagetrennt, in gemischter Reihenfolge)</label>
          <input
            value={(content?.words || []).join(', ')}
            onChange={e => setContent('words', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Wohnzimmer, steht, im, Der, Tisch"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Richtige Reihenfolge (kommagetrennt)</label>
          <input
            value={(content?.correct_order || []).join(', ')}
            onChange={e => setContent('correct_order', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Der, Tisch, steht, im, Wohnzimmer"
          />
        </div>
      </>
    );
  }

  if (type === 'flashcard') {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vorderseite (Wort/Begriff)</label>
          <input
            value={content?.front || ''}
            onChange={e => setContent('front', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="das Fenster"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rückseite (Erklärung auf Deutsch)</label>
          <textarea
            value={content?.back || ''}
            onChange={e => setContent('back', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            rows={2}
            placeholder="Neutrum – eine Öffnung in einer Wand, durch die Licht hereinkommt"
          />
        </div>
      </>
    );
  }

  if (type === 'fillblank') {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Satz mit Lücke (Lücke als ___)</label>
          <input
            value={content?.sentence || ''}
            onChange={e => setContent('sentence', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Ich gebe ___ Kind ein Buch."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Richtige Antwort</label>
          <input
            value={content?.correct_answer || ''}
            onChange={e => setContent('correct_answer', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="dem"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Antwortoptionen (kommagetrennt)</label>
          <input
            value={(content?.options || []).join(', ')}
            onChange={e => setContent('options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="dem, den, der, das"
          />
        </div>
      </>
    );
  }

  if (type === 'declension') {
    const cases = content?.cases || { nominativ: '', akkusativ: '', dativ: '', genitiv: '' };
    const sentences = content?.sentences || ['', '', '', ''];
    const setCases = (k, v) => setContent('cases', { ...cases, [k]: v });
    const setSentences = (i, v) => {
      const arr = [...sentences];
      arr[i] = v;
      setContent('sentences', arr);
    };
    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomen (mit Artikel)</label>
            <input
              value={content?.noun || ''}
              onChange={e => setContent('noun', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="der Hund"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Genus</label>
            <select
              value={content?.gender || 'maskulin'}
              onChange={e => setContent('gender', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="maskulin">maskulin</option>
              <option value="feminin">feminin</option>
              <option value="neutrum">neutrum</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {['nominativ', 'akkusativ', 'dativ', 'genitiv'].map((k, i) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{k}</label>
              <input
                value={cases[k] || ''}
                onChange={e => setCases(k, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder={k === 'nominativ' ? 'der Hund' : k === 'akkusativ' ? 'den Hund' : k === 'dativ' ? 'dem Hund' : 'des Hundes'}
              />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Satzbeispiele (je Kasus, 4 Sätze)</label>
          {['Nominativ', 'Akkusativ', 'Dativ', 'Genitiv'].map((k, i) => (
            <input
              key={i}
              value={sentences[i] || ''}
              onChange={e => setSentences(i, e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
              placeholder={`${k}-Beispiel`}
            />
          ))}
        </div>
      </>
    );
  }

  // multichoice (Standard)
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Antwortoptionen (kommagetrennt)</label>
        <input
          value={(content?.options || []).join(', ')}
          onChange={e => setContent('options', e.target.value.split(',').map(s => s.trim()))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="der, die, das"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Richtige Antwort</label>
        <input
          value={content?.correct_answer || ''}
          onChange={e => setContent('correct_answer', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="der"
        />
      </div>
    </>
  );
}

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
      content: defaultContent('multichoice'),
      difficulty: 1000,
      status: 'draft',
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setContent(key, value) {
    setForm(f => ({ ...f, content: { ...f.content, [key]: value } }));
  }

  function handleTypeChange(newType) {
    setForm(f => ({ ...f, exercise_type: newType, content: defaultContent(newType) }));
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Übungstyp</label>
              <select
                value={form.exercise_type}
                onChange={e => handleTypeChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="multichoice">Multiple Choice</option>
                <option value="dragdrop">Drag & Drop</option>
                <option value="flashcard">Karteikarte</option>
                <option value="fillblank">Lückentext</option>
                <option value="declension">Deklination</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frage / Aufgabenstellung</label>
            <input
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="z.B. Welcher Artikel gehört zu 'Tisch'?"
            />
          </div>

          {/* Typspezifische Felder */}
          <ContentFields type={form.exercise_type} content={form.content} setContent={setContent} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hinweis (für KI-Feedback)</label>
            <input
              value={form.content?.hint || ''}
              onChange={e => setContent('hint', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Kurze Grammatikerklärung"
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
  const [exerciseType, setExerciseType] = useState('multichoice');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await adminApi.generateExercises(categoryId, count, exerciseType);
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Übungstyp</label>
                <select
                  value={exerciseType}
                  onChange={e => setExerciseType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  disabled={loading}
                >
                  <option value="multichoice">Multiple Choice</option>
                  <option value="dragdrop">Drag & Drop</option>
                  <option value="flashcard">Karteikarten</option>
                  <option value="fillblank">Lückentext</option>
                  <option value="declension">Deklination</option>
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
                ✅ <strong>{result.generated} {TYPE_LABELS[exerciseType]?.label || exerciseType}-Aufgaben</strong> wurden als Entwürfe gespeichert
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {result.exercises.map((ex, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <span className="text-gray-400 text-xs">#{ex.id} · Elo {ex.difficulty} · {ex.exercise_type}</span>
                    <p className="text-gray-700 font-medium">{ex.question}</p>
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
// Hilfsfunktion: Aufgaben-Vorschau je Typ
// ---------------------------------------------------------------------------
function ExercisePreview({ ex }) {
  const type = ex.exercise_type;
  const c = ex.content || {};

  if (type === 'dragdrop') {
    return (
      <p className="text-xs text-gray-400 mt-0.5">
        Wörter: <span className="font-medium text-gray-600">{(c.words || []).join(' | ')}</span>
        {' · '}{ex.answer_count || 0} Antworten
      </p>
    );
  }
  if (type === 'flashcard') {
    return (
      <p className="text-xs text-gray-400 mt-0.5">
        Vorderseite: <span className="font-medium text-gray-600">{c.front}</span>
        {' · '}Rückseite: <span className="text-gray-500">{(c.back || '').substring(0, 40)}{c.back?.length > 40 ? '…' : ''}</span>
        {' · '}{ex.answer_count || 0} Antworten
      </p>
    );
  }
  if (type === 'fillblank') {
    return (
      <p className="text-xs text-gray-400 mt-0.5">
        Satz: <span className="font-medium text-gray-600">{c.sentence}</span>
        {' · '}Richtig: <span className="font-medium text-green-600">{c.correct_answer}</span>
        {' · '}{ex.answer_count || 0} Antworten
      </p>
    );
  }
  if (type === 'declension') {
    return (
      <p className="text-xs text-gray-400 mt-0.5">
        Nomen: <span className="font-medium text-gray-600">{c.noun}</span>
        {' · '}Nom: {c.cases?.nominativ} · Akk: {c.cases?.akkusativ} · Dat: {c.cases?.dativ} · Gen: {c.cases?.genitiv}
        {' · '}{ex.answer_count || 0} Antworten
      </p>
    );
  }
  // multichoice
  return (
    <p className="text-xs text-gray-400 mt-0.5">
      Richtig: <span className="font-medium text-gray-600">{c.correct_answer || c.correct}</span>
      {' · '}Optionen: {(c.options || []).join(', ')}
      {' · '}{ex.answer_count || 0} Antworten
    </p>
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
  const [filterType, setFilterType] = useState('');
  const [modal, setModal] = useState(null);
  const [generateModal, setGenerateModal] = useState(false);
  const [confirm, setConfirm] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [exs, cats] = await Promise.all([
        adminApi.getExercises({ status: filterStatus || undefined, category_id: filterCat || undefined }),
        adminApi.getCategories(),
      ]);
      // Clientseitiger Typ-Filter (Backend unterstützt ihn auch, aber hier einfacher)
      const filtered = filterType ? exs.filter(e => e.exercise_type === filterType) : exs;
      setExercises(filtered);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filterStatus, filterCat, filterType]);

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

      {/* Filter */}
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
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Alle Typen</option>
          <option value="multichoice">Multiple Choice</option>
          <option value="dragdrop">Drag & Drop</option>
          <option value="flashcard">Karteikarte</option>
          <option value="fillblank">Lückentext</option>
          <option value="declension">Deklination</option>
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
            const t = TYPE_LABELS[ex.exercise_type] || { label: ex.exercise_type, cls: 'bg-gray-100 text-gray-600' };
            return (
              <div key={ex.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400">#{ex.id}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.cls}`}>{t.label}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ex.category?.icon} {ex.category?.name}</span>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Elo {ex.difficulty}</span>
                      {ex.ai_generated && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">🤖 KI</span>}
                    </div>
                    <p className="text-sm font-medium text-gray-800">{ex.question}</p>
                    <ExercisePreview ex={ex} />
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
