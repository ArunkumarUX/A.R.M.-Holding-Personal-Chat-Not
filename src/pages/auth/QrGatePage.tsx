import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2 } from 'lucide-react';
import { AdgmLogo } from '../../components/brand/AdgmLogo';
import { createAuthSession, getSessionStatus } from '../../auth/authApi';
import { CHAT_PATH, HOME_PATH, WELCOME_PATH } from '../../config/auth';
import {
  hasVerifiedToken,
  isFullyAuthenticated,
  needsWelcome,
  saveVerifiedSession,
} from '../../auth/authStorage';
import { resolvePublicOrigin } from '../../auth/publicOrigin';
import '../../styles/auth-gate.css';

export function QrGatePage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [publicOrigin, setPublicOrigin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [booting, setBooting] = useState(true);
  const sessionStarted = useRef(false);

  const verifyUrl = useMemo(() => {
    if (!sessionId || !publicOrigin) return '';
    return `${publicOrigin}/verify/${sessionId}`;
  }, [sessionId, publicOrigin]);

  const startSession = useCallback(async () => {
    setError(null);
    setBooting(true);
    try {
      const origin = await resolvePublicOrigin();
      setPublicOrigin(origin);
      const { sessionId: id } = await createAuthSession();
      setSessionId(id);
    } catch {
      setError(
        'Could not start secure session. Check your connection and refresh. For local dev, run: npm run dev',
      );
      setSessionId(null);
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    if (hasVerifiedToken()) {
      setBooting(false);
      return;
    }
    if (sessionStarted.current) return;
    sessionStarted.current = true;
    void startSession();
  }, [startSession]);

  useEffect(() => {
    if (!sessionId || verified || hasVerifiedToken()) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const { status, clientToken } = await getSessionStatus(sessionId);
        if (cancelled) return;
        if (status === 'verified' && clientToken) {
          saveVerifiedSession(clientToken);
          setVerified(true);
        }
        if (status === 'expired' || status === 'not_found') {
          setError('Session expired. Refresh this page to get a new QR code.');
        }
      } catch {
        /* API may be starting */
      }
    };

    poll();
    const id = window.setInterval(poll, 1200);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [sessionId, verified]);

  if (hasVerifiedToken() && !verified) {
    if (needsWelcome()) {
      return <Navigate to={WELCOME_PATH} replace />;
    }
    return <Navigate to={isFullyAuthenticated() ? HOME_PATH : CHAT_PATH} replace />;
  }

  if (isFullyAuthenticated() && verified) {
    return <Navigate to={HOME_PATH} replace />;
  }

  if ((hasVerifiedToken() && verified) || verified) {
    if (needsWelcome()) {
      return <Navigate to={WELCOME_PATH} replace />;
    }
    return <Navigate to={isFullyAuthenticated() ? HOME_PATH : CHAT_PATH} replace />;
  }

  const qrUsesLocalhost = verifyUrl.includes('localhost') || verifyUrl.includes('127.0.0.1');

  return (
    <div className="auth-gate">
      <header className="auth-gate__brand">
        <AdgmLogo variant="onLight" showTagline={false} />
      </header>

      <main className="auth-gate__main">
        <h1 className="auth-gate__title">Personal AI for Rajiv Sehgal</h1>
        <p className="auth-gate__subtitle">Secure access · ADGM</p>

        <div className="auth-gate__qr-wrap" aria-label="QR code for mobile verification">
          {verifyUrl ? (
            <QRCodeSVG value={verifyUrl} size={220} level="M" includeMargin className="auth-gate__qr" />
          ) : (
            <div className="auth-gate__qr-placeholder">
              {booting && !error ? (
                <>
                  <Loader2 className="auth-gate__spinner" aria-hidden />
                  <p className="auth-gate__hint" style={{ marginTop: 12 }}>
                    Generating secure QR…
                  </p>
                </>
              ) : null}
            </div>
          )}
        </div>

        <p className="auth-gate__instruction">
          {qrUsesLocalhost
            ? 'Scan this QR code with your phone (same Wi‑Fi as this computer), then enter your 4-digit PIN.'
            : 'Scan this QR code with your phone, then enter your 4-digit PIN.'}
        </p>

        {qrUsesLocalhost && (
          <p className="auth-gate__error" role="alert">
            QR uses localhost — your phone cannot reach this. Run npm run dev and refresh.
          </p>
        )}

        <p className="auth-gate__dev-pin" aria-label="Demo PIN hint">
          Demo PIN: <strong>9898</strong>
        </p>

        {sessionId && verifyUrl && (
          <p className="auth-gate__waiting">
            <Loader2 className="auth-gate__spinner auth-gate__spinner--inline" aria-hidden />
            Waiting for verification on your phone…
          </p>
        )}

        {sessionId && (
          <p className="auth-gate__fallback">
            On this device?{' '}
            <a href={`/verify/${sessionId}`} className="auth-gate__link">
              Open verification page
            </a>
          </p>
        )}

        {error && (
          <p className="auth-gate__error" role="alert">
            {error}{' '}
            <button type="button" className="auth-gate__link auth-gate__link-btn" onClick={() => {
              sessionStarted.current = false;
              void startSession();
            }}>
              Try again
            </button>
          </p>
        )}
      </main>
    </div>
  );
}
