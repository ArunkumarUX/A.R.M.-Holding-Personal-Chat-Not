import '../../styles/auth-gate.css';

const PORTFOLIO = [
  { src: '/portfolio/drec-logo.svg', alt: 'Dubai Real Estate Centre (DREC)' },
  { src: '/portfolio/huna-logo.svg', alt: 'HUNA' },
  { src: '/portfolio/hive-logo.svg', alt: 'HIVE Coliv' },
] as const;

export function AuthPortfolioBand() {
  return (
    <section className="auth-portfolio-band" aria-label="A.R.M. Holding real estate portfolio">
      <p className="auth-portfolio-band__eyebrow">Our Real Estate Portfolio</p>
      <div className="auth-portfolio-band__logos">
        {PORTFOLIO.map((logo) => (
          <img key={logo.src} className="auth-portfolio-band__logo" src={logo.src} alt={logo.alt} />
        ))}
      </div>
    </section>
  );
}
