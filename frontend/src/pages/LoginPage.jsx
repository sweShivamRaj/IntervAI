import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { Alert, ButtonSpinner, Icon } from '../components/ui.jsx';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (loading) return <AuthLoading />;
  if (user) return <Navigate to={homeFor(user)} replace />;

  function validate() {
    const next = {};
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      const signedIn = await login(form.email.trim(), form.password);
      const fallback = homeFor(signedIn);
      const requested = location.state?.from;
      const next = requested && (signedIn.role === 'admin' || requested !== '/admin') ? requested : fallback;
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your workspace"
      description="Pick up your practice where you left off and keep building interview confidence."
      footer={<>New to AdaptiveInterview? <Link className="font-bold text-accent-dark hover:underline" to="/register">Create an account <Icon name="arrow" size={14} className="inline" /></Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field label="Email address" id="login-email" error={fieldErrors.email}>
          <input id="login-email" className="input-field" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'login-email-error' : undefined} />
        </Field>
        <Field label="Password" id="login-password" error={fieldErrors.password}>
          <div className="relative">
            <input id="login-password" className="input-field pr-12" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'login-password-error' : undefined} />
            <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-xs font-bold text-ink-700 hover:bg-ink-50" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
        </Field>
        {error && <Alert>{error}</Alert>}
        <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
          {busy ? <><ButtonSpinner /> Signing in…</> : <>Sign in <Icon name="arrow" size={16} /></>}
        </button>
      </form>
    </AuthShell>
  );
}

function homeFor(user) {
  return user?.role === 'admin' ? '/admin' : '/dashboard';
}

function Field({ label, id, error, children }) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-bold text-ink-900">{label}</label>{children}{error && <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-red-700" role="alert">{error}</p>}</div>;
}

function AuthLoading() {
  return <div className="mx-auto max-w-5xl rounded-3xl border border-ink-100 bg-white p-10 text-center text-sm text-ink-700 shadow-panel" role="status">Checking your session…</div>;
}
