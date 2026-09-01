import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

export default function AppLayout() {
  const { pathname } = useLocation();
  const isInterviewSession = pathname !== '/interview/setup' && /^\/interview\/[^/]+$/.test(pathname);

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:pt-10">
        <Outlet />
      </main>
      {!isInterviewSession && <footer className="border-t border-ink-100 bg-white/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-ink-700 sm:px-6">
          <span>IntervAI · Structured practice for better interviews.</span>
          <span>Built for focused preparation.</span>
        </div>
      </footer>}
    </div>
  );
}
