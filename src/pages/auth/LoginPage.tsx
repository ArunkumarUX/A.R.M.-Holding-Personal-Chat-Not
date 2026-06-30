import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Smartphone, Mail, ArrowRight } from 'lucide-react';
import { AdgmLogo } from '../../components/brand/AdgmLogo';
import { loginWithIdentifier } from '../../auth/authApi';
import { WELCOME_PATH, HOME_PATH, CHAT_PATH } from '../../config/auth';
import {
  hasVerifiedToken,
  isFullyAuthenticated,
  needsWelcome,
  saveVerifiedSession,
} from '../../auth/authStorage';
import { PRODUCT_NAME } from '../../config/user';
import { AuthMilestoneTimeline } from '../../components/auth/AuthMilestoneTimeline';
import '../../styles/auth-gate.css';

type Channel = 'mobile' | 'email';

function loginErrorMessage(code: string | undefined): string {
  const en: Record<string, string> = {
    invalid_email: 'Enter a valid email address.',
    invalid_mobile: 'Enter a valid UAE mobile number (e.g. +971 50 123 4567 or 050 123 4567).',
    missing_identifier: 'Enter your mobile number or email.',
    network: 'Cannot reach the server. Check your connection and try again.',
  };
  return en[code || ''] || 'Sign-in failed. Please try again.';
}

export function LoginPage() {
  const navigate = useNavigate();
  const [channel, setChannel] = useState<Channel>('mobile');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (hasVerifiedToken()) {
    if (needsWelcome()) return <Navigate to={WELCOME_PATH} replace />;
    return <Navigate to={isFullyAuthenticated() ? HOME_PATH : CHAT_PATH} replace />;
  }

  const submitLogin = useCallback(async () => {
    const id = identifier.trim();
    if (!id) return;
    setSubmitting(true);
    setError(null);
    const result = await loginWithIdentifier(channel, id);
    if (result.ok && result.clientToken) {
      saveVerifiedSession(result.clientToken);
      navigate(WELCOME_PATH, { replace: true });
      return;
    }
    setError(loginErrorMessage(result.error));
    setSubmitting(false);
  }, [channel, identifier, navigate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submitLogin();
  };

  return (
    <div className="auth-gate auth-gate--login">
      <div className="auth-gate__login-layout">
        <aside className="auth-gate__login-visual">
          <AuthMilestoneTimeline />
        </aside>

        <div className="auth-gate__login-panel">
          <div className="auth-gate__login-card">
            <div className="auth-gate__brand auth-gate__brand--above">
              <AdgmLogo variant="onLight" horizontal size={72} showTagline={false} />
            </div>

            <main className="auth-gate__main">
              <h1 className="auth-gate__title">{PRODUCT_NAME}</h1>
              <p className="auth-gate__subtitle">Secure access · Apparel Group</p>

              <p className="auth-gate__instruction">
                Enter any UAE mobile number or work email, then tap Continue to start your onboarding.
              </p>

              <div className="auth-gate__channel" role="tablist" aria-label="Sign-in method">
                <button
                  type="button"
                  role="tab"
                  aria-selected={channel === 'mobile'}
                  className={channel === 'mobile' ? 'on' : ''}
                  onClick={() => {
                    setChannel('mobile');
                    setError(null);
                  }}
                >
                  <Smartphone size={15} aria-hidden />
                  Mobile
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={channel === 'email'}
                  className={channel === 'email' ? 'on' : ''}
                  onClick={() => {
                    setChannel('email');
                    setError(null);
                  }}
                >
                  <Mail size={15} aria-hidden />
                  Email
                </button>
              </div>

              <form className="auth-gate__login-form" onSubmit={handleSubmit}>
                <label className="auth-gate__field-label" htmlFor="login-identifier">
                  {channel === 'mobile' ? 'UAE mobile number' : 'Email address'}
                </label>
                <input
                  id="login-identifier"
                  className="auth-gate__text-input"
                  type={channel === 'email' ? 'email' : 'tel'}
                  inputMode={channel === 'mobile' ? 'tel' : 'email'}
                  autoComplete={channel === 'email' ? 'email' : 'tel'}
                  placeholder={channel === 'mobile' ? '+971 50 123 4567' : 'you@company.com'}
                  value={identifier}
                  disabled={submitting}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError(null);
                  }}
                />

                {error && (
                  <p className="auth-gate__error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="auth-gate__submit auth-gate__submit--with-icon auth-gate__submit--login"
                  disabled={!identifier.trim() || submitting}
                >
                  {submitting ? 'Continuing…' : 'Continue'}
                  {!submitting && <ArrowRight size={18} aria-hidden />}
                </button>
              </form>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
