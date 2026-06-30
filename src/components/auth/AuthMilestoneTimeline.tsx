import { APPAREL_GROUP_BRAND, APPAREL_GROUP_FACTS } from '../../config/apparelGroupGuidelines';
import { MILESTONE_END_YEAR, MILESTONE_START_YEAR } from '../../data/apparelGroupMilestones';
import '../../styles/auth-gate.css';

export function AuthMilestoneTimeline() {
  return (
    <section className="auth-milestone auth-milestone--simple" aria-label="Apparel Group journey">
      <div className="auth-milestone__hero">
        <p className="auth-milestone__eyebrow">Our journey</p>
        <h2 className="auth-milestone__title">
          {MILESTONE_START_YEAR} — {MILESTONE_END_YEAR}
        </h2>
        <p className="auth-milestone__lead">
          Apparel Group begins its journey towards success — from one store to a global retail house.
        </p>
      </div>

      <div className="auth-milestone__stats">
        <div className="auth-milestone__stat">
          <span className="auth-milestone__stat-value">{APPAREL_GROUP_FACTS.stores}</span>
          <span className="auth-milestone__stat-label">stores</span>
        </div>
        <div className="auth-milestone__stat">
          <span className="auth-milestone__stat-value">{APPAREL_GROUP_FACTS.brands}</span>
          <span className="auth-milestone__stat-label">brands</span>
        </div>
        <div className="auth-milestone__stat">
          <span className="auth-milestone__stat-value">{APPAREL_GROUP_FACTS.countries}</span>
          <span className="auth-milestone__stat-label">countries</span>
        </div>
      </div>

      <div className="auth-milestone__track" aria-hidden>
        <span className="auth-milestone__track-year">{MILESTONE_START_YEAR}</span>
        <div className="auth-milestone__track-bar">
          <span className="auth-milestone__track-fill" />
          <span className="auth-milestone__track-dot" />
        </div>
        <span className="auth-milestone__track-year">{MILESTONE_END_YEAR}</span>
      </div>

      <p className="auth-milestone__tagline">{APPAREL_GROUP_BRAND.tagline}</p>
    </section>
  );
}
