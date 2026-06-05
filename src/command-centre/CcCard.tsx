import type { CSSProperties, ReactNode } from 'react';
import { CcIcon } from './CcIcon';
import type { IntelLaymanBlock } from '../data/intelLaymanCopy';
import { IntelLaymanInfo } from './IntelLaymanInfo';

type IconName = string;

/** Market Intelligence card shell — white surface, 18px radius, optional featured header */
export function IntelCard({
  children,
  className = '',
  featured,
  rise,
  interactive,
  selected,
  accentColor,
  onClick,
  style,
}: {
  children: ReactNode;
  className?: string;
  featured?: boolean;
  rise?: boolean;
  interactive?: boolean;
  selected?: boolean;
  accentColor?: string;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={[
        'card',
        'intel-card',
        featured ? 'intel-card--featured' : '',
        rise ? 'rise' : '',
        interactive || onClick ? 'intel-card--interactive' : '',
        selected ? 'intel-card--selected' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      style={{
        ...(onClick
          ? {
              textAlign: 'start',
              font: 'inherit',
              color: 'inherit',
              width: '100%',
            }
          : {}),
        ...style,
      }}
    >
      {accentColor ? (
        <span className="intel-card__accent" style={{ background: accentColor }} aria-hidden />
      ) : null}
      {children}
    </Tag>
  );
}

export function IntelCardHead({
  icon,
  title,
  subtitle,
  badge,
  compact,
}: {
  icon: IconName;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`intel-card__head${compact ? ' intel-card__head--compact' : ''}`}>
      {icon ? <CcIcon name={icon} size={compact ? 22 : 20} className="intel-card__head-icon" /> : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="intel-card__head-title type-title">{title}</div>
        {subtitle ? <div className="intel-card__head-sub">{subtitle}</div> : null}
      </div>
      {badge}
    </div>
  );
}

export function IntelCardBody({
  children,
  className = '',
  style,
  borderTop,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  borderTop?: boolean;
}) {
  return (
    <div
      className={`card-pad intel-card__body${borderTop ? ' intel-card__body--border-top' : ''} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

/** Section title row inside a card (eyebrow + heading) */
export function IntelSectionHead({
  eyebrow,
  title,
  action,
  laymanInfo,
  titleAs = 'h3',
  style,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  action?: ReactNode;
  /** Plain-language explainer for non-specialist readers */
  laymanInfo?: IntelLaymanBlock;
  titleAs?: 'h2' | 'h3';
  style?: CSSProperties;
}) {
  const Title = titleAs;
  return (
    <div className="section-head intel-section-head" style={style}>
      <div className="intel-section-head__main">
        {eyebrow || laymanInfo ? (
          <div className="intel-section-head__eyebrow-row">
            {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
            {laymanInfo ? <IntelLaymanInfo copy={laymanInfo} /> : null}
          </div>
        ) : null}
        <Title className="intel-section-head__title">{title}</Title>
      </div>
      {action}
    </div>
  );
}

export function IntelIconBox({
  icon,
  color,
  background,
  size = 'md',
  className = '',
}: {
  icon: IconName;
  color?: string;
  background?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div
      className={`intel-icon-box intel-icon-box--${size} ${className}`.trim()}
      style={{ color, background }}
    >
      <CcIcon name={icon} size={size === 'lg' ? 20 : size === 'sm' ? 16 : 18} />
    </div>
  );
}

export function IntelList({ children }: { children: ReactNode }) {
  return <ul className="intel-list">{children}</ul>;
}

export function IntelListItem({
  index,
  children,
}: {
  index?: number;
  children: ReactNode;
}) {
  return (
    <li className="intel-list__item">
      {index != null ? (
        <span className="kpi-num intel-list__index">{String(index).padStart(2, '0')}</span>
      ) : null}
      <span>{children}</span>
    </li>
  );
}

export function IntelRows({ children }: { children: ReactNode }) {
  return <div className="intel-rows">{children}</div>;
}

export function IntelRow({ children }: { children: ReactNode }) {
  return <div className="intel-row">{children}</div>;
}
