import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Icon from './icons';



const ROLE_BADGE_STYLES = {
  admin: 'bg-purple-100 text-purple-800 ring-1 ring-purple-200',
  editor: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  viewer: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
};

function initialsFromEmail(email) {
  if (!email) return '?';
  return email.split('@')[0].slice(0, 2).toUpperCase();
}

function NavItem({ to, icon, label, active, title }) {
  const base = 'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-lg transition-colors';
  const activeCls = active
    ? 'bg-blue-50 text-blue-700 font-medium'
    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
  const inertCls = 'text-slate-400 cursor-not-allowed';

  const inner = (
    <>
      <Icon name={icon} className="w-5 h-5 flex-shrink-0" />
      <span>{label}</span>
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
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-3">
          {title}
        </p>
      )}
      <nav className="flex flex-col gap-0.5">{children}</nav>
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
        <NavSection title="Admin">
          <NavItem to="/review" icon="inbox" label="Review queue" active={pathname === '/review'} />
          <NavItem to="/articles/low-rated" icon="alertTriangle" label="Low-rated" active={pathname === '/articles/low-rated'} />
          <NavItem to="/analytics" icon="chart" label="Analytics" active={pathname === '/analytics'} />
          <NavItem to="/users" icon="users" label="Users & roles" active={pathname.startsWith('/users')} />
          <NavItem to="/admin" icon="shield" label="Audit & Assistant Logs" active={pathname === '/admin'} />
        </NavSection>
      </>
    );
  }

  if (role === 'editor') {
    return (
      <NavSection title="My work">
        <NavItem
          to="/articles"
          icon="clipboard"
          label="Drafts"
          active={pathname === '/articles' && !search}
        />
        <NavItem
          to="/articles?status=under_review"
          icon="inbox"
          label="In review"
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
    <NavSection title="Topics">
      <NavItem
        to="/articles"
        icon="home"
        label="All articles"
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

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!user) return children;

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
  }

  return (
    <div className="min-h-screen bg-slate-200">
      <header className="bg-slate-300 border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="xl:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            aria-label="Open navigation menu"
          >
            <Icon name="menu" className="w-5 h-5" />
          </button>

          <Link to="/articles" className="flex items-center gap-2 font-bold text-xl text-slate-900 flex-shrink-0">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">
              H
            </span>
            HealthTech KB
          </Link>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl relative mx-auto w-full">
          <Icon
            name="search"
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
          />
          <input
            id="global-search"
            name="global-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search the knowledge base…"
            aria-label="Search the knowledge base"
            className="w-full bg-slate-100 border border-transparent rounded-xl pl-10 pr-4 py-3 text-base text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-100 transition-colors"
          />
        </form>

        <div className="flex items-center gap-4 flex-shrink-0">
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wide ${
              ROLE_BADGE_STYLES[user.role] || 'bg-slate-100 text-slate-700'
            }`}
          >
            {user.role}
          </span>
          <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-semibold">
            {initialsFromEmail(user.email)}
          </div>
          <button
            onClick={logout}
            className="text-sm font-medium text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg px-3.5 py-2 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-20 xl:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 w-72 h-full bg-slate-300 border-r border-slate-200 p-6 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="text-lg font-semibold text-slate-900">Menu</div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-500 hover:text-slate-900 rounded-lg p-2"
                aria-label="Close navigation menu"
              >
                ×
              </button>
            </div>
            <SidebarForRole role={user.role} pathname={pathname} search={search} />
          </aside>
        </div>
      )}

      <div className="flex">
        <aside className="hidden xl:block w-72 border-r border-slate-200 bg-slate-300 px-4 py-6 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
          <SidebarForRole role={user.role} pathname={pathname} search={search} />
        </aside>

        <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}