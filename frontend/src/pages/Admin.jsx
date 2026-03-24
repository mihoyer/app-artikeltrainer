import { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import AdminExercises from './AdminExercises';
import AdminCategories from './AdminCategories';
import AdminUsers from './AdminUsers';
import AdminCache from './AdminCache';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'exercises', label: 'Aufgaben', icon: '📝' },
  { id: 'categories', label: 'Kategorien', icon: '📂' },
  { id: 'users', label: 'Nutzer', icon: '👥' },
  { id: 'cache', label: 'KI-Cache', icon: '🤖' },
];

function AdminLayout({ onLogout, children, activeTab, setActiveTab }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-bold text-gray-800">🔐 Admin</span>
            <span className="text-gray-400 text-sm hidden sm:inline">Artikeltrainer.de</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              → Zur Seite
            </a>
            <button
              onClick={onLogout}
              className="text-sm text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar Navigation */}
        <aside className={`
          fixed inset-0 z-30 bg-black/50 md:relative md:bg-transparent md:inset-auto
          ${menuOpen ? 'block' : 'hidden'} md:block
        `} onClick={() => setMenuOpen(false)}>
          <nav
            className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl md:relative md:w-48 md:shadow-none md:bg-transparent"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 md:p-0 space-y-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMenuOpen(false); }}
                  className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Prüfen ob bereits ein Key gespeichert ist
    const key = localStorage.getItem('admin_key');
    if (key) setIsLoggedIn(true);
  }, []);

  function handleLogout() {
    localStorage.removeItem('admin_key');
    setIsLoggedIn(false);
  }

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  const PAGES = {
    dashboard: <AdminDashboard />,
    exercises: <AdminExercises />,
    categories: <AdminCategories />,
    users: <AdminUsers />,
    cache: <AdminCache />,
  };

  return (
    <AdminLayout onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      {PAGES[activeTab] || <AdminDashboard />}
    </AdminLayout>
  );
}
