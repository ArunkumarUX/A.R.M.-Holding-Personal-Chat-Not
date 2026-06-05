import { useEffect, useRef, useState } from 'react';
import { AdgmEmblem } from '../components/brand/AdgmWordmark';

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  dur = 1100,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  dur?: number;
}) {
  const [v, setV] = useState(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const ease = (t: number) => 1 - (1 - t) ** 3;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setV(value * ease(p));
      if (p < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, dur]);

  return (
    <span className="kpi-num">
      {prefix}
      {v.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export function Sparkline({
  data,
  color = 'var(--accent-bright)',
  fill = true,
  height = 38,
}: {
  data: number[];
  color?: string;
  fill?: boolean;
  height?: number;
}) {
  const w = 120;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');
  const area = `M0,${height} L${pts.split(' ').join(' L')} L${w},${height} Z`;
  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${height}`} height={height} aria-hidden>
      {fill && <path d={area} fill={color} opacity={0.12} />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RingGauge({
  value,
  max = 100,
  size = 72,
  stroke = 6,
  color = 'var(--accent-bright)',
  label,
  ariaLabel,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  ariaLabel?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = c * (1 - pct);
  const showLabel = Boolean(label) && size >= 72;
  const valueSize = showLabel ? size * 0.26 : size * 0.32;
  return (
    <div
      className="ring-gauge"
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
      role="img"
      aria-label={ariaLabel ?? (label ? `${value} ${label}` : `${value}`)}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
        }}
      >
        <div className="ring-gauge__inner">
          <div className="kpi-num ring-gauge__value" style={{ fontSize: valueSize, fontWeight: 600 }}>
            {value}
          </div>
          {showLabel && (
            <div className="ring-gauge__label">{label}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/** ADGM mark — crisp inline (chat empty state, headers) */
export function Emblem({ size = 34 }: { size?: number }) {
  return <AdgmEmblem size={size} decorative display="inline" />;
}

export const RAG_MAP = {
  good: { c: 'good', t: 'On track', tAr: 'على المسار' },
  warn: { c: 'warn', t: 'Watch', tAr: 'مراقبة' },
  risk: { c: 'risk', t: 'Action needed', tAr: 'يتطلب إجراء' },
} as const;

export function RagPill({ rag, lang }: { rag: keyof typeof RAG_MAP; lang: string }) {
  const ar = lang === 'ar';
  const m = RAG_MAP[rag];
  return (
    <span className={`pill ${m.c}`}>
      <span
        className={`dot ${m.c}${rag === 'risk' ? ' pulse' : ''}`}
        style={{ color: 'currentColor', background: 'currentColor' }}
      />
      {ar ? m.tAr : m.t}
    </span>
  );
}
