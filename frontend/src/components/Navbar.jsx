import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ConfirmDialog, Icon, Logo } from './ui.jsx';
import { m, AnimatePresence, useIsReducedMotion } from './motion.jsx';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/history', label: 'History', icon: 'history' },
  { to: '/profile', label: 'Profile', icon: 'user' },
];

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutPromptOpen, setLogoutPromptOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const isSession = location.pathname !== '/interview/setup' && /^\/interview\/[^/]+$/.test(location.pathname);
  const reduced = useIsReducedMotion();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } finally {
      setLoggingOut(false);
      setLogoutPromptOpen(false);
    }
  }

  if (isSession && user) {
    return (
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex h-[4.5rem] max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to={`/interview/${location.pathname.split('/')[2]}`} aria-label="Return to interview session">
            <Logo />
          </Link>
          <div className="flex items-center gap-3 text-sm text-ink-700">
            <span className="hidden items-center gap-2 sm:flex"><span className="size-2 rounded-full bg-emerald-500" /> Interview in progress</span>
            <Link to="/history" className="btn-secondary px-3 py-2 text-xs sm:text-sm">Exit session</Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink-100/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to={user ? '/dashboard' : '/'} aria-label="IntervAI home">
          <Logo />
        </Link>

        {loading ? (
          <span className="text-sm text-ink-700" role="status">Checking session…</span>
        ) : user ? (
          <>
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
              {links.map((link) => <NavItem key={link.to} {...link} />)}
              {user.role === 'admin' && <NavItem to="/admin" label="Admin" icon="shield" />}
              <Link to="/interview/setup" className="btn-primary ml-3 px-3.5 py-2.5">
                <Icon name="plus" size={16} /> New interview
              </Link>
              <div className="ml-3 flex items-center gap-2 border-l border-ink-100 pl-4">
                <Avatar name={user.name} />
                <span className="max-w-28 truncate text-sm font-semibold text-ink-800">{user.name}</span>
                <button type="button" onClick={() => setLogoutPromptOpen(true)} className="ml-1 rounded-lg p-2 text-ink-700 transition-all duration-200 hover:bg-ink-50 hover:text-ink-900 active:scale-90" aria-label="Log out">
                  <Icon name="logout" size={17} />
                </button>
              </div>
            </nav>

            <div className="flex items-center gap-2 lg:hidden">
              <Avatar name={user.name} />
              <button type="button" onClick={() => setMenuOpen((open) => !open)} className="rounded-xl border border-ink-200 p-2.5 text-ink-800 transition-all duration-200 active:scale-95" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen}>
                <Icon name={menuOpen ? 'close' : 'menu'} size={19} />
              </button>
            </div>

            {/* Animated mobile drawer */}
            <AnimatePresence>
              {menuOpen && (
                reduced ? (
                  <nav className="absolute inset-x-0 top-[4.5rem] border-b border-ink-100 bg-white px-4 py-3 shadow-panel lg:hidden" aria-label="Mobile navigation">
                    {links.map((link) => <NavItem key={link.to} {...link} mobile />)}
                    {user.role === 'admin' && <NavItem to="/admin" label="Admin" icon="shield" mobile />}
                    <Link to="/interview/setup" className="btn-primary mt-2 w-full"><Icon name="plus" size={16} /> Start new interview</Link>
                    <button type="button" onClick={() => setLogoutPromptOpen(true)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">Log out</button>
                  </nav>
                ) : (
                  <m.nav
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-x-0 top-[4.5rem] overflow-hidden border-b border-ink-100 bg-white px-4 py-3 shadow-panel lg:hidden"
                    aria-label="Mobile navigation"
                  >
                    {links.map((link) => <NavItem key={link.to} {...link} mobile />)}
                    {user.role === 'admin' && <NavItem to="/admin" label="Admin" icon="shield" mobile />}
                    <Link to="/interview/setup" className="btn-primary mt-2 w-full"><Icon name="plus" size={16} /> Start new interview</Link>
                    <button type="button" onClick={() => setLogoutPromptOpen(true)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">Log out</button>
                  </m.nav>
                )
              )}
            </AnimatePresence>
          </>
        ) : (
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Public navigation">
            <NavLink to="/login" className="hidden text-sm font-semibold text-ink-700 transition-all duration-200 hover:text-accent sm:inline">Sign in</NavLink>
            <Link to="/register" className="btn-primary px-3.5 py-2.5">Get started <Icon name="arrow" size={16} /></Link>
          </nav>
        )}
      </div>
      </header>
      <ConfirmDialog
        open={logoutPromptOpen}
        title="Log out of your workspace?"
        description="Your interview progress is saved. You can sign back in whenever you are ready."
        onCancel={() => setLogoutPromptOpen(false)}
        onConfirm={handleLogout}
        busy={loggingOut}
      />
    </>
  );
}

function NavItem({ to, label, icon, mobile = false }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `${mobile ? 'flex w-full items-center gap-3 rounded-xl px-3 py-3' : 'inline-flex items-center gap-2 rounded-xl px-3 py-2.5'} text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${isActive ? 'bg-accent-soft text-accent-dark' : 'text-ink-700 hover:bg-ink-50 hover:text-ink-900'}`}
    >
      <Icon name={icon} size={16} />
      {label}
    </NavLink>
  );
}

function Avatar({ name = '' }) {
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
  return <span className="grid size-9 place-items-center rounded-xl bg-ink-900 text-xs font-bold text-white transition-transform duration-200 hover:scale-105" aria-hidden="true">{initials}</span>;
}
