import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getHealth } from '../services/api.js';
import { Alert, Icon, Logo } from '../components/ui.jsx';
import { FadeIn, StaggerList, StaggerItem, ScrollReveal } from '../components/motion.jsx';

const steps = [
  { number: '01', title: 'Set your focus', text: 'Choose a role, interview style, skills, and starting level.' },
  { number: '02', title: 'Think out loud', text: 'Work through realistic questions in a calm, distraction-free space.' },
  { number: '03', title: 'Improve with insight', text: 'Review scores, patterns, and your next best areas to practice.' },
];

export default function HomePage() {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setError('The API is not reachable right now. You can still explore the platform.'));
  }, []);

  return (
    <FadeIn>
      <div className="space-y-20 pb-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-ink-900 px-6 py-12 text-white shadow-panel sm:px-12 sm:py-16 lg:px-16 lg:py-20">
          <div className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-accent/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 left-1/3 size-96 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <StaggerList staggerSpeed="slow">
                <StaggerItem>
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-accent-soft">
                    <span className="size-1.5 rounded-full bg-accent-soft" /> Structured practice for ambitious candidates
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                    Practice with <span className="text-accent-soft">purpose.</span>
                  </h1>
                </StaggerItem>
                <StaggerItem>
                  <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                    A focused interview workspace that adapts to your performance and turns every answer into a clearer next step.
                  </p>
                </StaggerItem>
                <StaggerItem>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link to={user ? '/interview/setup' : '/register'} className="btn-primary bg-accent-soft text-ink-900 transition-all hover:bg-white active:scale-[0.97]">
                      {user ? 'Start an interview' : 'Create free account'} <Icon name="arrow" size={17} />
                    </Link>
                    <Link to={user ? '/dashboard' : '/login'} className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-[0.97]">
                      {user ? 'View dashboard' : 'Sign in'}
                    </Link>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-2"><Icon name="target" size={17} className="text-accent-soft" /> Adaptive difficulty</span>
                    <span className="inline-flex items-center gap-2"><Icon name="chart" size={17} className="text-accent-soft" /> Actionable analytics</span>
                  </div>
                </StaggerItem>
              </StaggerList>
            </div>

            <div className="relative lg:pl-8">
              <div className="animate-float rounded-3xl border border-white/15 bg-white/[0.08] p-4 shadow-2xl backdrop-blur sm:p-5">
                <div className="rounded-2xl bg-white p-5 text-ink-900 sm:p-6">
                  <div className="flex items-center justify-between border-b border-ink-100 pb-5">
                    <div className="flex items-center gap-3"><Logo compact /><div><p className="text-sm font-bold">Interview session</p><p className="text-xs text-ink-700">Frontend Developer</p></div></div>
                    <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-dark">Q 04 / 10</span>
                  </div>
                  <div className="mt-6 flex gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">React</span><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">Medium</span></div>
                  <h2 className="mt-5 font-display text-2xl font-semibold leading-snug">How would you manage shared state in a growing React application?</h2>
                  <div className="mt-6 rounded-xl border border-ink-200 bg-ink-50 p-4 text-sm text-ink-700">Explain your approach, trade-offs, and when you would choose each option.</div>
                  <div className="mt-5 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100"><div className="h-full w-[40%] rounded-full bg-accent" /></div><span className="text-xs font-bold text-ink-700">40%</span></div>
                </div>
              </div>
              <FadeIn delay={0.8}>
                <div className="absolute -bottom-5 -left-1 hidden items-center gap-3 rounded-2xl border border-white/20 bg-ink-800 p-3 shadow-xl sm:flex">
                  <span className="grid size-9 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300"><Icon name="check" size={18} /></span>
                  <div><p className="text-xs text-slate-400">Latest insight</p><p className="text-sm font-semibold">Strong technical clarity</p></div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        <ScrollReveal>
          <section>
            <div className="mb-8 max-w-2xl"><p className="eyebrow">A better practice loop</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-ink-900 sm:text-4xl">From first attempt to confident answer.</h2><p className="mt-3 leading-7 text-ink-700">Everything you need to make interview preparation deliberate, measurable, and repeatable.</p></div>
            <StaggerList className="grid gap-4 md:grid-cols-3">
              {steps.map((step) => (
                <StaggerItem key={step.number}>
                  <div className="card-panel-interactive group relative overflow-hidden">
                    <span className="font-display text-5xl font-semibold text-accent/20">{step.number}</span>
                    <h3 className="mt-5 text-lg font-bold text-ink-900">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink-700">{step.text}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <section className="grid items-center gap-8 rounded-3xl border border-accent/20 bg-accent-soft/45 p-7 sm:p-10 lg:grid-cols-[1fr_auto]">
            <div><p className="eyebrow">Built for consistent growth</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-ink-900">Your preparation should show its progress.</h2><p className="mt-3 max-w-2xl leading-7 text-ink-700">See where you are improving, which skills need more attention, and how your performance changes across sessions.</p></div>
            <Link to={user ? '/analytics' : '/register'} className="btn-secondary whitespace-nowrap transition-all active:scale-[0.97]">Explore analytics <Icon name="arrow" size={16} /></Link>
          </section>
        </ScrollReveal>

        <FadeIn delay={0.3}>
          <div className="flex justify-center">
            {health ? <div className="inline-flex items-center gap-2 text-xs font-semibold text-ink-700"><span className="size-2 rounded-full bg-emerald-500" /> Platform services operational</div> : error ? <Alert tone="warning">{error}</Alert> : <span className="text-xs text-ink-700" role="status">Checking platform status…</span>}
          </div>
        </FadeIn>
      </div>
    </FadeIn>
  );
}
