import { useState } from 'react';
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

function NavItem({ to, icon, label, active }) {
  const base = 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[15px] transition-colors';
  const activeCls = active
    ? 'bg-blue-50 text-blue-700 font-medium'
    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
  const inertCls = 'text-slate-400 cursor-not-allowed';

  const inner = (
    <>
      <Icon name={icon} className="w-[18px] h-[18px] flex-shrink-0" />
      <span>{label}</span>
    </>
  );

  if (!to) {
    return <span className={`${base} ${inertCls}`}>{inner}</span>;
  }

  return (
    <Link to={to} className={`${base} ${activeCls}`}>
      {inner}
    </Link>
  );
}

function NavSection({ title, children }) {
  return (
    <div className="mb-5">
      {title && (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-3">
          {title}
        </p>
      )}
      <nav className="flex flex-col gap-0.5">{children}</nav>
    </div>
  );
}

function SidebarForRole({ role, pathname }) {
  if (role === 'admin') {
    return (
      <>
        <NavSection>
          <NavItem to="/articles" icon="articles" label="Articles" active={pathname.startsWith('/articles')} />
        </NavSection>
        <NavSection title="Admin">
          <NavItem icon="inbox" label="Review queue" />
          <NavItem icon="chart" label="Analytics" />
          <NavItem to="/users" icon="users" label="Users & roles" active={pathname.startsWith('/users')} />
          <NavItem icon="shield" label="Audit log" />
          <NavItem icon="message" label="Assistant logs" />
        </NavSection>
      </>
    );
  }

  if (role === 'editor') {
    return (
      <NavSection title="My work">
        <NavItem to="/articles" icon="clipboard" label="Drafts" active={pathname === '/articles'} />
        <NavItem icon="inbox" label="In review" />
        <NavItem icon="articles" label="Published" />
        <NavItem icon="alertTriangle" label="Low-rated" />
      </NavSection>
    );
  }

  return (
    <NavSection title="Categories">
      <NavItem to="/articles" icon="home" label="All articles" active={pathname === '/articles'} />
      <NavItem icon="home" label="Getting started" />
      <NavItem icon="activity" label="Patient management" />
      <NavItem icon="activity" label="Clinical modules" />
      <NavItem icon="dollar" label="Billing & finance" />
      <NavItem icon="settings" label="System admin" />
      <NavItem icon="alertTriangle" label="Troubleshooting" />
      <NavItem icon="tag" label="Release notes" />
    </NavSection>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');

  if (!user) return children;

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 gap-6">
        <Link to="/articles" className="flex items-center gap-2 font-bold text-xl text-slate-900 flex-shrink-0">
          <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">
            H
          </span>
          HealthTech KB
        </Link>

        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl relative">
          <Icon
            name="search"
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search the knowledge base…"
            className="w-full bg-slate-100 border border-transparent rounded-lg pl-10 pr-4 py-2.5 text-base text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </form>

        <div className="flex items-center gap-3 flex-shrink-0">
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

      <div className="flex">
        <aside className="w-64 border-r border-slate-200 bg-white px-4 py-6 flex-shrink-0 min-h-[calc(100vh-73px)]">
          <SidebarForRole role={user.role} pathname={pathname} />
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}