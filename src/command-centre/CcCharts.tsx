import { useId } from 'react';
import { motion } from 'framer-motion';
import { AnimatedNumber } from './CcPrimitives';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { easeOut } from '../lib/motion';

const chartEase = easeOut;

export function RadarChart({
  dims,
  a,
  b,
  size = 320,
  animKey = 0,
}: {
  dims: string[];
  a: { values: number[] };
  b?: { values: number[] };
  size?: number;
  animKey?: number | string;
}) {
  const reduced = usePrefersReducedMotion();
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 58;
  const N = dims.length;
  const ang = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2;
  const pt = (i: number, val: number) => [
    cx + Math.cos(ang(i)) * R * (val / 100),
    cy + Math.sin(ang(i)) * R * (val / 100),
  ];
  const poly = (vals: number[]) => vals.map((val, i) => pt(i, val).join(',')).join(' ');
  const gid = useId().replace(/:/g, '');
  const labelPt = (i: number) => {
    const a = ang(i);
    const dist = R + 42;
    return [cx + Math.cos(a) * dist, cy + Math.sin(a) * dist] as const;
  };
  const labelAnchor = (x: number): 'start' | 'middle' | 'end' => {
    if (Math.abs(x - cx) < 10) return 'middle';
    return x > cx ? 'start' : 'end';
  };
  const splitLabel = (label: string) => {
    const words = label.split(' ');
    if (words.length <= 2) return [label];
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  };
  const polyMotion = reduced
    ? {}
    : {
        initial: { opacity: 0, scale: 0.88 },
        animate: { opacity: 1, scale: 1 },
        style: { transformOrigin: `${cx}px ${cy}px` as const },
      };

  return (
    <svg
      className={`cc-chart cc-chart--radar${reduced ? ' cc-chart--static' : ''}`}
      viewBox={`-8 -8 ${size + 16} ${size + 16}`}
      style={{ width: '100%', maxWidth: size, height: 'auto', overflow: 'visible' }}
    >
      <defs>
        <radialGradient id={`rg${gid}`}>
          <stop offset="0%" stopColor="var(--accent-bright)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent-bright)" stopOpacity="0.06" />
        </radialGradient>
      </defs>
      {[25, 50, 75, 100].map((r, ri) => (
        <motion.polygon
          key={r}
          points={dims.map((_, i) => pt(i, r).join(',')).join(' ')}
          fill="none"
          stroke="var(--line)"
          strokeWidth="1"
          {...(reduced
            ? {}
            : {
                initial: { opacity: 0, scale: 0.7 },
                animate: { opacity: 1, scale: 1 },
                transition: { duration: 0.5, ease: chartEase, delay: ri * 0.05 },
                style: { transformOrigin: `${cx}px ${cy}px` },
              })}
        />
      ))}
      {dims.map((_, i) => {
        const [x, y] = pt(i, 100);
        return (
          <motion.line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="var(--line)"
            strokeWidth="1"
            {...(reduced
              ? {}
              : {
                  initial: { pathLength: 0, opacity: 0 },
                  animate: { pathLength: 1, opacity: 1 },
                  transition: { duration: 0.45, ease: chartEase, delay: 0.08 + i * 0.03 },
                })}
          />
        );
      })}
      {b && (
        <motion.polygon
          key={`b-${animKey}`}
          points={poly(b.values)}
          fill="var(--line-strong)"
          fillOpacity="0.18"
          stroke="var(--ink-3)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          {...polyMotion}
          transition={{ duration: 0.65, ease: chartEase, delay: 0.22 }}
        />
      )}
      <motion.polygon
        key={`a-${animKey}`}
        points={poly(a.values)}
        fill={`url(#rg${gid})`}
        stroke="var(--accent-bright)"
        strokeWidth="2.5"
        {...polyMotion}
        transition={{ duration: 0.75, ease: chartEase, delay: 0.1 }}
      />
      {a.values.map((val, i) => {
        const [x, y] = pt(i, val);
        return (
          <motion.circle
            key={`${animKey}-${i}`}
            cx={x}
            cy={y}
            r="3.2"
            fill="var(--accent-bright)"
            {...(reduced
              ? {}
              : {
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  transition: { duration: 0.3, delay: 0.4 + i * 0.04 },
                })}
          />
        );
      })}
      {dims.map((d, i) => {
        const [x, y] = labelPt(i);
        const anchor = labelAnchor(x);
        const lines = splitLabel(d);
        return (
          <text
            key={d}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="9"
            fontWeight="600"
            fill="var(--ink-2)"
            className={reduced ? '' : 'cc-radar-label'}
            style={{ animationDelay: `${0.45 + i * 0.05}s` }}
          >
            {lines.map((line, li) => (
              <tspan key={li} x={x} dy={li === 0 ? (lines.length > 1 ? '-0.6em' : '0') : '1.2em'}>
                {line}
              </tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}

export function Donut({
  segments,
  size = 132,
  thickness = 16,
  centerTop,
  centerBot,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  thickness?: number;
  centerTop?: React.ReactNode;
  centerBot?: string;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg className="cc-chart" width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--line)" strokeWidth={thickness} opacity="0.5" />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cx}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-acc}
            />
          );
          acc += len;
          return el;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div className="kpi-num" style={{ fontSize: size * 0.27, fontWeight: 700, lineHeight: 1 }}>
            {centerTop}
          </div>
          {centerBot && (
            <div className="muted-3" style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 3 }}>
              {centerBot}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MomentumChart({
  data,
  labels,
  color = 'var(--accent-bright)',
  height = 168,
}: {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
}) {
  const w = 640;
  const h = height;
  const padB = 22;
  const padT = 12;
  const min = Math.min(...data) * 0.96;
  const max = Math.max(...data) * 1.02;
  const rng = max - min || 1;
  const x = (i: number) => (i / (data.length - 1)) * w;
  const y = (d: number) => padT + (1 - (d - min) / rng) * (h - padB - padT);
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d).toFixed(1)}`).join(' ');
  const area = `${line} L${w} ${h - padB} L0 ${h - padB} Z`;
  const gid = useId().replace(/:/g, '');

  return (
    <svg className="cc-chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={`mg${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#mg${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle
        cx={x(data.length - 1)}
        cy={y(data[data.length - 1])}
        r="4"
        fill={color}
        stroke="var(--surface)"
        strokeWidth="2"
      />
      {labels?.map((l, i) => (
        <text key={l} x={x(i)} y={h - 6} fontSize="9" fill="var(--ink-3)">
          {l}
        </text>
      ))}
    </svg>
  );
}

function flowNodePos(i: number, n: number, cx: number, cy: number, r: number) {
  const a = (Math.PI * 2 * i) / n - Math.PI / 2;
  const x = cx + Math.cos(a) * r;
  const y = cy + Math.sin(a) * r;
  const lx = x + Math.cos(a) * 26;
  const ly = y + Math.sin(a) * 26;
  const anchor: 'start' | 'middle' | 'end' = Math.abs(x - cx) < 8 ? 'middle' : x > cx ? 'start' : 'end';
  return { x, y, a, lx, ly, anchor };
}

export function CapitalFlow({
  regions,
  lang,
}: {
  regions: { k: string; kAr: string; flow: number; v: string }[];
  lang: string;
}) {
  const ar = lang === 'ar';
  const reduced = usePrefersReducedMotion();
  const gid = useId().replace(/:/g, '');
  const w = 340;
  const h = 240;
  const cx = w / 2;
  const cy = h / 2;
  const orbitR = 108;

  return (
    <svg
      className="cf-flow__svg cc-chart cc-chart--flow"
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: '100%', maxWidth: 420, height: 'auto', overflow: 'visible' }}
      role="img"
      aria-label={ar ? 'تدفقات رأس المال نحو دبي' : 'Capital flows toward Dubai'}
    >
        <defs>
          <radialGradient id={`cfCore${gid}`} cx="42%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#4a4a4a" />
            <stop offset="55%" stopColor="var(--arm-ink, #242321)" />
            <stop offset="100%" stopColor="var(--arm-black, #000000)" />
          </radialGradient>
        </defs>

        {regions.map((rg, i) => {
          const { x, y, lx, ly, anchor } = flowNodePos(i, regions.length, cx, cy, orbitR);
          const mx = (cx + x) / 2;
          const my = (cy + y) / 2 - 14;
          const pathD = `M${x} ${y} Q${mx} ${my} ${cx} ${cy}`;
          const name = ar ? rg.kAr : rg.k;
          return (
            <g key={rg.k}>
              <path
                d={pathD}
                fill="none"
                stroke="var(--accent-bright)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="3 6"
                opacity="0.72"
                className={reduced ? '' : 'cf-flow__arc'}
                style={{ animationDelay: `${i * 0.14}s` }}
              />
              <circle cx={x} cy={y} r="5.5" fill="var(--surface)" stroke="var(--accent-bright)" strokeWidth="2" />
              <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" fontSize="10.5" fontWeight="600" fill="var(--ink-2)">
                <tspan>{name}</tspan>
                <tspan fill="var(--status-good)" fontWeight="700">{` ${rg.v}`}</tspan>
              </text>
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r="32" fill={`url(#cfCore${gid})`} />
        <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#fff">
          {ar ? 'دبي' : 'Dubai'}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="middle" fontSize="7.5" fontWeight="600" fill="rgba(255,255,255,0.88)" letterSpacing="0.08em">
          A.R.M.
        </text>
    </svg>
  );
}

export { AnimatedNumber };
