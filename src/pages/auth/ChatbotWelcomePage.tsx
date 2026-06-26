import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, MessageSquare, Sparkles } from 'lucide-react';
import {
  EXECUTIVE_USER,
  PRODUCT_AGENT_NAME,
  greetingForTime,
} from '../../config/user';
import { CHAT_PATH, HOME_PATH } from '../../config/auth';
import {
  hasVerifiedToken,
  isFullyAuthenticated,
  markWelcomeComplete,
  needsWelcome,
} from '../../auth/authStorage';
import '../../styles/auth-gate.css';

function useTypewriter(text: string, active: boolean, msPerChar = 24) {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!active) {
      setOut('');
      return;
    }
    setOut('');
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, msPerChar);
    return () => window.clearInterval(id);
  }, [text, active, msPerChar]);
  return out;
}

function WelcomeContent() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0);
  const [exiting, setExiting] = useState(false);

  const agentLine = `${greetingForTime()}, ${EXECUTIVE_USER.firstName}. I'm ${PRODUCT_AGENT_NAME} — your executive copilot at A.R.M. Holding.`;
  const typedLine = useTypewriter(agentLine, phase >= 2);

  useEffect(() => {
    const t0 = window.setTimeout(() => setPhase(1), 280);
    const t1 = window.setTimeout(() => setPhase(2), 850);
    const t2 = window.setTimeout(() => setPhase(3), 2200);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const enterApp = useCallback(() => {
    setExiting(true);
    markWelcomeComplete();
    window.dispatchEvent(new CustomEvent('adgm-tour-start'));
    window.setTimeout(() => {
      navigate(CHAT_PATH, { replace: true });
    }, 360);
  }, [navigate]);

  return (
    <motion.div
      className="auth-welcome auth-welcome--light"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1, scale: exiting ? 0.985 : 1 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="auth-welcome__bg" aria-hidden>
        <div className="auth-welcome__ambient auth-welcome__ambient--light" />
        <div className="auth-welcome__mesh auth-welcome__mesh--light" />
        <div className="auth-welcome__grain" />
        <span className="auth-welcome__float-orb auth-welcome__float-orb--1" />
        <span className="auth-welcome__float-orb auth-welcome__float-orb--2" />
        <span className="auth-welcome__float-orb auth-welcome__float-orb--3" />
        <div className="auth-welcome__accent-bar auth-welcome__accent-bar--light" />
      </div>

      <div className="auth-welcome__content">
      <div className="auth-welcome__progress" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`auth-welcome__dot${phase > i ? ' auth-welcome__dot--on' : ''}`} />
        ))}
      </div>

      <motion.div
        className="auth-welcome__orb"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          className="auth-welcome__orb-ring"
          animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.12, 0.35] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />
        <Sparkles className="h-10 w-10 text-[#242321]" aria-hidden />
      </motion.div>

      <AnimatePresence>
        {phase >= 1 && (
          <motion.div
            key="identity"
            className="auth-welcome__identity"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <p className="auth-welcome__eyebrow">You&apos;re verified</p>
            <h1 className="auth-welcome__headline">
              Welcome, {EXECUTIVE_USER.firstName}
            </h1>
            <p className="auth-welcome__role">
              {EXECUTIVE_USER.title} · A.R.M. Holding
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {phase >= 2 && (
        <motion.div
          className="auth-welcome__bubble"
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          role="status"
          aria-live="polite"
        >
          <span className="auth-welcome__bubble-label">
            <MessageSquare className="h-4 w-4" aria-hidden />
            {PRODUCT_AGENT_NAME}
          </span>
          <p className="auth-welcome__bubble-text">
            {typedLine}
            {typedLine.length < agentLine.length && <span className="auth-welcome__cursor" aria-hidden />}
          </p>
        </motion.div>
      )}

      {phase >= 3 && (
        <motion.div
          className="auth-welcome__actions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button
            type="button"
            className="auth-welcome__cta"
            onClick={enterApp}
            disabled={typedLine.length < agentLine.length}
          >
            Show me around
            <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
        </motion.div>
      )}
      </div>
    </motion.div>
  );
}

export function ChatbotWelcomePage() {
  if (!hasVerifiedToken()) {
    return <Navigate to="/" replace />;
  }
  if (isFullyAuthenticated()) {
    return <Navigate to={HOME_PATH} replace />;
  }
  if (!needsWelcome()) {
    return <Navigate to={CHAT_PATH} replace />;
  }
  return <WelcomeContent />;
}
