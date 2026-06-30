import { APPAREL_GROUP_FACTS } from '../../config/apparelGroupGuidelines';
import '../../styles/auth-gate.css';

type Marker = {
  id: string;
  label: string;
  cx: number;
  cy: number;
  color: string;
};

const MARKERS: Marker[] = [
  { id: 'egypt', label: 'Egypt', cx: 49, cy: 41, color: '#d946a8' },
  { id: 'uae', label: 'UAE', cx: 57, cy: 40, color: '#c5d92d' },
  { id: 'ksa', label: 'Saudi Arabia', cx: 54, cy: 42, color: '#22d3ee' },
  { id: 'qatar', label: 'Qatar', cx: 56, cy: 41, color: '#003399' },
  { id: 'bahrain', label: 'Bahrain', cx: 57.5, cy: 41.5, color: '#f97316' },
  { id: 'kuwait', label: 'Kuwait', cx: 56.5, cy: 39.5, color: '#facc15' },
  { id: 'oman', label: 'Oman', cx: 59, cy: 43, color: '#7c2d12' },
  { id: 'india', label: 'India', cx: 64, cy: 44, color: '#ec4899' },
  { id: 'south-africa', label: 'South Africa', cx: 52, cy: 76, color: '#d946a8' },
  { id: 'singapore', label: 'Singapore', cx: 73, cy: 52, color: '#003399' },
  { id: 'malaysia', label: 'Malaysia', cx: 72, cy: 50, color: '#7c3aed' },
  { id: 'indonesia', label: 'Indonesia', cx: 76, cy: 54, color: '#166534' },
  { id: 'thailand', label: 'Thailand', cx: 71, cy: 47, color: '#003399' },
];

export function AuthGlobalNetwork() {
  return (
    <section className="auth-global-network" aria-label="Apparel Group global footprint">
      <div className="auth-global-network__copy">
        <p className="auth-global-network__eyebrow">Apparel Group</p>
        <h2 className="auth-global-network__title">Our Global Network</h2>
        <p className="auth-global-network__hint">
          {APPAREL_GROUP_FACTS.countries} countries · {APPAREL_GROUP_FACTS.brands} brands ·{' '}
          {APPAREL_GROUP_FACTS.employees} team members
        </p>
      </div>

      <div className="auth-global-network__map-wrap">
        <svg
          className="auth-global-network__map"
          viewBox="0 0 100 80"
          role="img"
          aria-label="World map showing Apparel Group store locations across the Middle East, Africa, and Asia"
        >
          <defs>
            <linearGradient id="auth-map-sky" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f4f7f9" />
              <stop offset="100%" stopColor="#eef2f6" />
            </linearGradient>
          </defs>

          <rect width="100" height="80" fill="url(#auth-map-sky)" rx="1.5" />

          <g className="auth-global-network__land">
            <path
              d="M38 18c4-2 9-1 12 2 3 2 5 6 4 10-1 5-6 8-11 7-5-1-9-6-8-11 1-4 2-6 3-8z"
              fill="#e4eaf0"
            />
            <path
              d="M42 30c6-1 12 1 16 5 4 4 6 10 5 16-2 8-10 14-18 15-8 1-16-4-19-12-2-6 0-13 5-18 4-4 8-5 11-6z"
              fill="#dde4ea"
            />
            <path
              d="M48 36c8-2 14 2 18 8 3 5 4 12 2 18-3 9-12 15-21 14-7-1-13-6-16-13-2-5-1-11 2-16 3-5 9-9 15-11z"
              fill="#e8eef4"
            />
            <path
              d="M52 34c5-3 11-2 15 2 5 5 7 12 5 19-2 8-9 14-17 15-6 1-12-3-15-9-2-4-2-9 0-13 2-5 7-10 12-14z"
              fill="#d5dde5"
            />
            <path
              d="M58 35c4-1 8 1 10 5 2 4 2 9-1 13-3 5-9 8-14 7-4-1-8-5-8-10 0-4 2-8 5-11 2-2 5-3 8-4z"
              fill="#cdd6df"
            />
            <path
              d="M61 42c7-1 12 3 14 9 2 5 1 11-3 15-5 5-13 7-19 4-5-2-9-8-8-14 1-5 5-10 10-12 2-1 4-2 6-2z"
              fill="#e0e7ee"
            />
            <path
              d="M66 44c5-1 9 2 11 7 2 4 1 9-2 12-4 4-10 5-14 2-3-2-5-7-4-11 1-4 4-8 9-10z"
              fill="#d8e0e8"
            />
            <path
              d="M69 48c4-1 8 1 10 5 2 3 1 8-2 10-4 3-9 3-12 0-2-2-3-6-1-9 1-3 3-5 5-6z"
              fill="#cfd8e1"
            />
            <path
              d="M72 50c6-1 11 3 12 9 1 5-2 10-7 12-4 2-10 1-13-3-2-3-2-8 1-11 2-4 4-6 7-7z"
              fill="#dce4eb"
            />
            <path
              d="M74 54c5 0 9 3 10 8 1 4-1 8-5 10-3 2-8 2-11-1-2-2-3-6-1-9 1-3 4-6 7-8z"
              fill="#e6ecf2"
            />
            <path
              d="M46 58c5-2 10 0 13 4 3 4 3 10 0 14-3 5-10 7-15 5-4-2-7-7-6-12 1-4 4-8 8-11z"
              fill="#d2dbe3"
            />
            <path
              d="M50 66c4-1 8 1 10 5 2 3 1 7-2 9-3 2-8 2-10-1-2-2-2-6 0-8 1-3 1-4 2-5z"
              fill="#dde5ec"
            />
          </g>

          <g className="auth-global-network__markers">
            {MARKERS.map((marker) => (
              <g key={marker.id} className="auth-global-network__marker">
                <circle
                  className="auth-global-network__marker-pulse"
                  cx={marker.cx}
                  cy={marker.cy}
                  r="2.4"
                  fill={marker.color}
                  opacity="0.22"
                />
                <circle
                  cx={marker.cx}
                  cy={marker.cy}
                  r="1.15"
                  fill={marker.color}
                  stroke="#ffffff"
                  strokeWidth="0.35"
                />
                <title>{marker.label}</title>
              </g>
            ))}
          </g>
        </svg>

        <p className="auth-global-network__map-caption">
          Please click on the country for more information
        </p>
      </div>

      <p className="auth-global-network__stat">
        <span className="auth-global-network__stat-line">FROM 1 STORE IN 1999</span>
        <span className="auth-global-network__stat-line auth-global-network__stat-line--accent">
          TO {APPAREL_GROUP_FACTS.stores} STORES IN 2026
        </span>
      </p>
    </section>
  );
}
