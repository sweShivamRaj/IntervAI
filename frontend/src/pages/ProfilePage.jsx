import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getProfile, updateProfile } from '../services/api.js';
import { Alert, ButtonSpinner, Icon, PageHeader, Skeleton } from '../components/ui.jsx';
import { FadeIn, StaggerList, StaggerItem, AnimatedPresenceWrapper } from '../components/motion.jsx';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: '', education: '', experience: '', skills: '', resume: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingProfile(true);
      setError('');
      try {
        const data = await getProfile();
        if (cancelled) return;
        const profile = data.user;
        setForm({ name: profile.name || '', education: profile.education || '', experience: profile.experience || '', skills: (profile.skills || []).join(', '), resume: profile.resume || '' });
        setUser(profile);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load profile.');
          if (user) setForm({ name: user.name || '', education: user.education || '', experience: user.experience || '', skills: (user.skills || []).join(', '), resume: user.resume || '' });
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      const data = await updateProfile({ name: form.name.trim(), education: form.education.trim(), experience: form.experience.trim(), resume: form.resume.trim(), skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean) });
      setUser(data.user);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (loadingProfile) return <ProfileSkeleton />;

  return (
    <div className="space-y-8">
      <FadeIn>
        <PageHeader eyebrow="Your workspace" title="Candidate profile" description="Keep your profile current so every practice session starts with the right context." />
      </FadeIn>
      <StaggerList className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <StaggerItem>
          <aside className="card-panel h-fit bg-ink-900 text-white">
            <div className="flex items-center gap-3"><span className="grid size-14 place-items-center rounded-2xl bg-accent text-xl font-bold">{getInitials(user?.name)}</span><div className="min-w-0"><h2 className="truncate font-display text-2xl font-semibold">{user?.name}</h2><p className="mt-1 truncate text-sm text-slate-300">{user?.email}</p></div></div>
            <div className="mt-8 space-y-5 border-t border-white/10 pt-6"><ProfileMeta icon="shield" label="Account type" value={user?.role || 'candidate'} /><ProfileMeta icon="lock" label="Account email" value="Protected and verified" /></div>
            <FadeIn delay={0.15}>
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.07] p-4"><p className="text-sm font-semibold">Why this matters</p><p className="mt-2 text-sm leading-6 text-slate-300">Your skills and experience help you choose more relevant interview practice.</p></div>
            </FadeIn>
          </aside>
        </StaggerItem>

        <StaggerItem>
          <section className="card-panel">
            <div className="mb-7 border-b border-ink-100 pb-5"><h2 className="section-title">Personal details</h2><p className="mt-1 text-sm text-ink-700">Only your name and professional context can be updated here.</p></div>
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              <div className="grid gap-5 sm:grid-cols-2"><Field label="Full name" id="profile-name" error={fieldErrors.name}><input id="profile-name" className="input-field transition-all focus:scale-[1.01]" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? 'profile-name-error' : undefined} /></Field><Field label="Education" id="profile-education"><input id="profile-education" className="input-field transition-all focus:scale-[1.01]" placeholder="e.g. BCA, MCA" value={form.education} onChange={(event) => setForm({ ...form, education: event.target.value })} /></Field></div>
              <Field label="Experience" id="profile-experience" hint="A short summary is enough."><textarea id="profile-experience" className="input-field min-h-32 resize-y transition-all focus:scale-[1.01]" placeholder="Work, internships, projects, or areas of experience" value={form.experience} onChange={(event) => setForm({ ...form, experience: event.target.value })} /></Field>
              <Field label="Skills" id="profile-skills" hint="Separate multiple skills with commas."><input id="profile-skills" className="input-field transition-all focus:scale-[1.01]" placeholder="JavaScript, React, Node.js" value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} /></Field>
              <Field label="Resume or portfolio" id="profile-resume" hint="Add a link or a short summary."><textarea id="profile-resume" className="input-field min-h-24 resize-y transition-all focus:scale-[1.01]" placeholder="https://… or a short professional summary" value={form.resume} onChange={(event) => setForm({ ...form, resume: event.target.value })} /></Field>
              <AnimatedPresenceWrapper show={!!error}>
                {error && <Alert>{error}</Alert>}
              </AnimatedPresenceWrapper>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-5"><p className="text-xs text-ink-700"><Icon name="lock" size={13} className="mr-1 inline" /> Your information is only used inside your workspace.</p><button type="submit" className="btn-primary transition-all active:scale-[0.97]" disabled={busy}>{busy ? <><ButtonSpinner /> Saving…</> : <>Save changes <Icon name="check" size={16} /></>}</button></div>
            </form>
          </section>
        </StaggerItem>
      </StaggerList>
      <AnimatedPresenceWrapper show={!!message}>
        {message && <div className="fixed bottom-5 right-5 z-50 max-w-sm" role="status"><Alert tone="success">{message}</Alert></div>}
      </AnimatedPresenceWrapper>
    </div>
  );
}

function Field({ label, id, error, hint, children }) {
  return <div><div className="flex items-baseline justify-between gap-2"><label htmlFor={id} className="mb-2 block text-sm font-bold text-ink-900">{label}</label>{hint && <span className="text-xs text-ink-700">{hint}</span>}</div>{children}{error && <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-red-700" role="alert">{error}</p>}</div>;
}

function ProfileMeta({ icon, label, value }) {
  return <div className="flex items-center gap-3"><span className="text-accent-soft"><Icon name={icon} size={18} /></span><div><p className="text-xs text-slate-400">{label}</p><p className="mt-0.5 text-sm font-semibold capitalize">{value}</p></div></div>;
}

function getInitials(name = '') {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
}

function ProfileSkeleton() {
  return <div className="space-y-8" role="status"><div><Skeleton className="h-3 w-32" /><Skeleton className="mt-4 h-10 w-64" /><Skeleton className="mt-3 h-5 w-96 max-w-full" /></div><div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]"><Skeleton className="h-80" /><Skeleton className="h-[34rem]" /></div></div>;
}
