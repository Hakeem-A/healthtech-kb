import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Icon from './icons';



const ROLE_BADGE_STYLES = {
  admin: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/80',
  editor: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80',
  viewer: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/80',
};

function initialsFromEmail(email) {
  if (!email) return '?';
  return email.split('@')[0].slice(0, 2).toUpperCase();
}

function NavItem({ to, icon, label, active, title }) {
  const base = 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all';
  const activeCls = active
    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100 shadow-2xs'
    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900';
  const inertCls = 'text-slate-400 cursor-not-allowed';

  const inner = (
    <>
      <Icon name={icon} className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
      <span className="truncate">{label}</span>
    </>
  );

  if (!to) {
    return (
      <span className={`${base} ${inertCls}`} title={title} aria-disabled="true">
        {inner}
      </span>
    );
  }

  return (
    <Link to={to} className={`${base} ${activeCls}`} aria-current={active ? 'page' : undefined} title={title}>
      {inner}
    </Link>
  );
}

function NavSection({ title, children }) {
  return (
    <div className="mb-6">
      {title && (
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-3">
          {title}
        </p>
      )}
      <nav className="flex flex-col gap-1">{children}</nav>
    </div>
  );
}

function SidebarForRole({ role, pathname, search }) {
  if (role === 'admin') {
    return (
      <>
        <NavSection>
          <NavItem to="/articles" icon="articles" label="Articles" active={pathname === '/articles' && !search} />
        </NavSection>
        <NavSection title="Administration">
          <NavItem to="/review" icon="inbox" label="Review Queue" active={pathname === '/review'} />
          <NavItem to="/articles/low-rated" icon="alertTriangle" label="Low-rated Articles" active={pathname === '/articles/low-rated'} />
          <NavItem to="/analytics" icon="chart" label="Analytics" active={pathname === '/analytics'} />
          <NavItem to="/users" icon="users" label="Users & Roles" active={pathname.startsWith('/users')} />
          <NavItem to="/admin" icon="shield" label="Audit & Assistant Logs" active={pathname === '/admin'} />
        </NavSection>
      </>
    );
  }

  if (role === 'editor') {
    return (
      <NavSection title="My Work">
        <NavItem
          to="/articles"
          icon="clipboard"
          label="Drafts"
          active={pathname === '/articles' && !search}
        />
        <NavItem
          to="/articles?status=under_review"
          icon="inbox"
          label="In Review"
          active={search === '?status=under_review'}
        />
        <NavItem
          to="/articles?status=published"
          icon="articles"
          label="Published"
          active={search === '?status=published'}
        />
        <NavItem
          to="/articles/low-rated"
          icon="alertTriangle"
          label="Low-rated"
          active={pathname === '/articles/low-rated'}
        />
      </NavSection>
    );
  }

  // viewer
  return (
    <NavSection title="Clinical Topics">
      <NavItem
        to="/articles"
        icon="home"
        label="All Articles"
        active={pathname === '/articles' && !search}
      />
      <NavItem
        to="/articles?tag=registration"
        icon="clipboard"
        label="Registration"
        active={search === '?tag=registration'}
      />
      <NavItem
        to="/articles?tag=appointments"
        icon="activity"
        label="Appointments"
        active={search === '?tag=appointments'}
      />
      <NavItem
        to="/articles?tag=vitals"
        icon="activity"
        label="Vitals"
        active={search === '?tag=vitals'}
      />
      <NavItem
        to="/articles?tag=consultation"
        icon="clipboard"
        label="Consultation"
        active={search === '?tag=consultation'}
      />
      <NavItem
        to="/articles?tag=lab"
        icon="activity"
        label="Lab"
        active={search === '?tag=lab'}
      />
      <NavItem
        to="/articles?tag=pharmacy"
        icon="dollar"
        label="Pharmacy"
        active={search === '?tag=pharmacy'}
      />
      <NavItem
        to="/articles?tag=admission"
        icon="home"
        label="Admission"
        active={search === '?tag=admission'}
      />
      <NavItem
        to="/articles?tag=referral"
        icon="tag"
        label="Referrals"
        active={search === '?tag=referral'}
      />
    </NavSection>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchInputRef = useRef(null);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setSidebarOpen(false);
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!user) return children;

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="xl:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            aria-label="Open navigation menu"
          >
            <Icon name="menu" className="w-5 h-5" />
          </button>

          <Link to="/articles" className="flex items-center gap-2.5 font-bold text-xl text-slate-900 tracking-tight flex-shrink-0">
            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-extrabold shadow-xs">
              H
            </span>
            <span>HealthTech <span className="text-blue-600">KB</span></span>
          </Link>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg relative mx-6 hidden sm:block">
          <Icon
            name="search"
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
          />
          <input
            ref={searchInputRef}
            id="global-search"
            name="global-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search clinical protocols, SOPs, guidelines… (⌘K)"
            aria-label="Search the knowledge base"
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-16 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="pointer-events-auto text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Clear search"
              >
                <Icon name="close" className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden lg:inline-flex text-[10px] font-semibold text-slate-400 bg-slate-200/80 px-1.5 py-0.5 rounded border border-slate-300">
                ⌘K
              </kbd>
            )}
          </div>
        </form>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider ${
              ROLE_BADGE_STYLES[user.role] || 'bg-slate-100 text-slate-700'
            }`}
          >
            {user.role}
          </span>
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold tracking-wider shadow-xs">
            {initialsFromEmail(user.email)}
          </div>
          <button
            onClick={logout}
            className="text-xs font-semibold text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 hover:bg-red-50/50 rounded-xl px-3 py-2 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 w-72 h-full bg-white border-r border-slate-200 p-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-lg text-slate-900">
                  <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold">H</span>
                  Menu
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-slate-400 hover:text-slate-700 rounded-lg p-1.5 hover:bg-slate-100 transition"
                  aria-label="Close navigation menu"
                >
                  <Icon name="close" className="w-5 h-5" />
                </button>
              </div>
              <SidebarForRole role={user.role} pathname={pathname} search={search} />
            </div>
          </aside>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex flex-1">
        <aside className="hidden xl:block w-72 border-r border-slate-200/90 bg-white px-4 py-6 sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto">
          <SidebarForRole role={user.role} pathname={pathname} search={search} />
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}