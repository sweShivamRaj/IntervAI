import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { Alert, ButtonSpinner, Icon } from '../components/ui.jsx';
import { FadeIn, AnimatedPresenceWrapper } from '../components/motion.jsx';

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (loading) return <AuthLoading />;
  if (user) return <Navigate to="/dashboard" replace />;

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters.';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Start practicing"
      title="Build your interview edge"
      description="Create your candidate workspace and turn preparation into a clear, repeatable routine."
      footer={<>Already have an account? <Link className="font-bold text-accent-dark hover:underline transition-all active:scale-[0.97]" to="/login">Sign in <Icon name="arrow" size={14} className="inline" /></Link></>}
    >
      <FadeIn delay={0.1}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Full name" id="register-name" error={fieldErrors.name}>
            <input id="register-name" className="input-field" autoComplete="name" placeholder="Your name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? 'register-name-error' : undefined} />
          </Field>
          <Field label="Email address" id="register-email" error={fieldErrors.email}>
            <input id="register-email" className="input-field" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'register-email-error' : undefined} />
          </Field>
          <Field label="Password" id="register-password" error={fieldErrors.password}>
            <PasswordInput id="register-password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} error={fieldErrors.password} visible={showPassword} onToggle={() => setShowPassword((visible) => !visible)} autoComplete="new-password" placeholder="At least 6 characters" />
          </Field>
          <Field label="Confirm password" id="register-confirm" error={fieldErrors.confirm}>
            <PasswordInput id="register-confirm" value={form.confirm} onChange={(value) => setForm({ ...form, confirm: value })} error={fieldErrors.confirm} visible={showConfirm} onToggle={() => setShowConfirm((visible) => !visible)} autoComplete="new-password" placeholder="Repeat your password" />
          </Field>
          <AnimatedPresenceWrapper show={!!error}>
            <Alert>{error}</Alert>
          </AnimatedPresenceWrapper>
          <button type="submit" className="btn-primary mt-2 w-full py-3 transition-all active:scale-[0.97]" disabled={busy}>
            {busy ? <><ButtonSpinner /> Creating workspace…</> : <>Create account <Icon name="arrow" size={16} /></>}
          </button>
        </form>
      </FadeIn>
    </AuthShell>
  );
}

function PasswordInput({ id, value, onChange, error, visible, onToggle, autoComplete, placeholder }) {
  return <div className="relative"><input id={id} className="input-field pr-12" type={visible ? 'text' : 'password'} autoComplete={autoComplete} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} /><button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-xs font-bold text-ink-700 hover:bg-ink-50 transition-all active:scale-[0.97]" onClick={onToggle} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? 'Hide' : 'Show'}</button></div>;
}

function Field({ label, id, error, children }) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-bold text-ink-900">{label}</label>{children}{error && <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-red-700" role="alert">{error}</p>}</div>;
}

function AuthLoading() {
  return <div className="mx-auto max-w-5xl rounded-3xl border border-ink-100 bg-white p-10 text-center text-sm text-ink-700 shadow-panel" role="status">Checking your session…</div>;
}
