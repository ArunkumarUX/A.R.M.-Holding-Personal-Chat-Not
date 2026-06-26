import type { CSSProperties } from 'react';
import { ADGM_PPT_FOOTER } from '../../config/adgmBrandForDeck';
import type { Deck, InsightPanel, Slide, SlideChart, SlideTable } from './slideTypes';
import { resolveSlideStyle } from './slideStyle';

type Props = {
  slide: Slide;
  deckTheme: Deck['theme'];
  index: number;
  total: number;
};

function layoutLabel(layout: Slide['layout']): string {
  return layout.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SlideCanvas({ slide, deckTheme, index, total }: Props) {
  const style = resolveSlideStyle(slide, deckTheme);
  const isTitle = slide.layout === 'title';
  const eyebrow = slide.eyebrow || (isTitle ? slide.subtitle || deckTheme.tagline : undefined);
  const canvasStyle = style.cssVars as CSSProperties;

  if (isTitle) {
    return (
      <article
        className="cc-slideai__canvas cc-slideai__canvas--title"
        style={canvasStyle}
        aria-label={`Slide ${index + 1}: ${slide.title}`}
      >
        <div className="cc-slideai__canvas-glow" aria-hidden />
        <div className="cc-slideai__canvas-title-inner">
          {eyebrow && <p className="cc-slideai__canvas-eyebrow">{eyebrow}</p>}
          <h1 className="cc-slideai__canvas-title" style={{ color: style.titleColor }}>
            {slide.title}
          </h1>
          {slide.body && <p className="cc-slideai__canvas-lede">{slide.body}</p>}
          {slide.callout && <p className="cc-slideai__canvas-callout">{slide.callout}</p>}
        </div>
        <div className="cc-slideai__canvas-title-rule" aria-hidden />
        <SlideCanvasFooter index={index} light deckTheme={deckTheme} />
      </article>
    );
  }

  const canvasClass = [
    'cc-slideai__canvas',
    `cc-slideai__canvas--${slide.layout}`,
    style.isDark ? 'cc-slideai__canvas--dark' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={canvasClass}
      style={canvasStyle}
      aria-label={`Slide ${index + 1}: ${slide.title}`}
    >
      <header className="cc-slideai__canvas-chrome">
        <span className="cc-slideai__canvas-chrome-brand">{deckTheme.tagline || 'Portfolio'}</span>
        <span className="cc-slideai__canvas-chrome-type">{layoutLabel(slide.layout)}</span>
        <span className="cc-slideai__canvas-chrome-num">
          {index + 1} / {total}
        </span>
      </header>

      <div className="cc-slideai__canvas-body">
        <div className="cc-slideai__canvas-main">
          {slide.eyebrow && <p className="cc-slideai__canvas-slide-eyebrow">{slide.eyebrow}</p>}
          <h2 className="cc-slideai__canvas-headline" style={{ color: style.titleColor }}>
            {slide.title}
          </h2>

          {slide.callout && (
            <p className="cc-slideai__canvas-callout cc-slideai__canvas-callout--inline">{slide.callout}</p>
          )}

          {slide.body && slide.layout !== 'quote' && (
            <p className="cc-slideai__canvas-body-text">{slide.body}</p>
          )}

          {slide.layout === 'stat' && slide.stats?.length ? (
            <div className="cc-slideai__canvas-kpis">
              {slide.stats.map((s) => (
                <div key={s.label} className="cc-slideai__canvas-kpi">
                  <span className="cc-slideai__canvas-kpi-val">{s.value}</span>
                  <span className="cc-slideai__canvas-kpi-lbl">{s.label}</span>
                  {s.context && <span className="cc-slideai__canvas-kpi-ctx">{s.context}</span>}
                </div>
              ))}
            </div>
          ) : null}

          {slide.layout === 'two-col' ? (
            <div className={`cc-slideai__canvas-cols${slide.insightPanel ? ' cc-slideai__canvas-cols--exhibit' : ''}`}>
              <div className="cc-slideai__canvas-col cc-slideai__canvas-col--data">
                {slide.leftTitle && <h3 className="cc-slideai__canvas-col-title">{slide.leftTitle}</h3>}
                {slide.chart ? (
                  <div className="cc-slideai__canvas-chart-wrap">
                    <SlideChartComponent chart={slide.chart} />
                  </div>
                ) : slide.table ? (
                  <SlideTable table={slide.table} />
                ) : slide.leftContent ? (
                  <p>{slide.leftContent}</p>
                ) : null}
                {slide.soWhat && <SlideCallout text={slide.soWhat} />}
              </div>
              {slide.insightPanel ? (
                <SlideInsightPanel panel={slide.insightPanel} imagePrompt={slide.imagePrompt} />
              ) : (
                <div className="cc-slideai__canvas-col">
                  {slide.rightTitle && <h3 className="cc-slideai__canvas-col-title">{slide.rightTitle}</h3>}
                  <p>{slide.rightContent}</p>
                </div>
              )}
            </div>
          ) : null}

          {slide.layout === 'quote' && slide.quote ? (
            <blockquote className="cc-slideai__canvas-quote">
              <span className="cc-slideai__canvas-quote-mark" aria-hidden="true">&ldquo;</span>
              <p>{slide.quote}</p>
              {slide.quoteAuthor && <cite>— {slide.quoteAuthor}</cite>}
            </blockquote>
          ) : null}

          {slide.layout === 'timeline' && slide.timelineItems?.length ? (
            <ol className="cc-slideai__canvas-timeline">
              {slide.timelineItems.map((item) => (
                <li key={item.marker}>
                  <span className="cc-slideai__canvas-timeline-marker">{item.marker}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}

          {slide.layout === 'icon-grid' && slide.icons?.length ? (
            <div className="cc-slideai__canvas-icons">
              {slide.icons.map((icon) => (
                <div key={icon.title} className="cc-slideai__canvas-icon">
                  <span className="cc-slideai__canvas-icon-emoji" aria-hidden>{icon.emoji}</span>
                  <strong>{icon.title}</strong>
                  <p>{icon.body}</p>
                </div>
              ))}
            </div>
          ) : null}

          {slide.layout === 'comparison' ? (
            <div className="cc-slideai__canvas-cols cc-slideai__canvas-cols--compare">
              <div className="cc-slideai__canvas-col">
                {slide.leftTitle && <h3 className="cc-slideai__canvas-col-title">{slide.leftTitle}</h3>}
                <p>{slide.leftContent}</p>
              </div>
              <div className="cc-slideai__canvas-col cc-slideai__canvas-col--winner">
                {slide.rightTitle && <h3 className="cc-slideai__canvas-col-title">{slide.rightTitle}</h3>}
                <p>{slide.rightContent}</p>
              </div>
            </div>
          ) : null}

          {slide.layout === 'content' && slide.table ? (
            <SlideTable table={slide.table} />
          ) : null}

          {slide.bullets?.length &&
          !['two-col', 'comparison', 'quote', 'icon-grid', 'timeline'].includes(slide.layout) ? (
            <ul className="cc-slideai__canvas-bullets">
              {slide.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          ) : null}

          {slide.layout !== 'two-col' && slide.soWhat && (
            <SlideCallout text={slide.soWhat} />
          )}
        </div>

        {slide.layout === 'image-left' ? (
          <aside className="cc-slideai__canvas-exhibit">
            {slide.chart ? (
              <div className="cc-slideai__canvas-chart-wrap">
                <SlideChartComponent chart={slide.chart} />
              </div>
            ) : (
              <>
                <span className="cc-slideai__canvas-exhibit-label">Exhibit</span>
                <p>{slide.imagePrompt || slide.leftContent || slide.rightContent}</p>
              </>
            )}
          </aside>
        ) : null}
      </div>

      {slide.sourceNote && (
        <p className="cc-slideai__canvas-source">{slide.sourceNote}</p>
      )}
      <SlideCanvasFooter index={index} light={style.isDark} deckTheme={deckTheme} />
    </article>
  );
}

function SlideTable({ table }: { table: SlideTable }) {
  return (
    <div className="cc-slideai__canvas-table-wrap">
      {table.caption && <p className="cc-slideai__canvas-table-caption">{table.caption}</p>}
      {table.subcaption && <p className="cc-slideai__canvas-table-subcaption">{table.subcaption}</p>}
      <table className="cc-slideai__canvas-table">
        <thead>
          <tr>
            {table.headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr
              key={ri}
              className={[
                row.bold ? 'cc-slideai__canvas-table-row--bold' : '',
                row.highlight ? 'cc-slideai__canvas-table-row--highlight' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {row.cells.map((cell, ci) => (
                <td key={ci}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SlideInsightPanel({ panel, imagePrompt }: { panel: InsightPanel; imagePrompt?: string }) {
  return (
    <div className="cc-slideai__canvas-insight-panel">
      <div className="cc-slideai__canvas-insight-content">
        <h3 className="cc-slideai__canvas-insight-title">{panel.title}</h3>
        <ul className="cc-slideai__canvas-insight-bullets">
          {panel.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
      {imagePrompt && (
        <div className="cc-slideai__canvas-insight-image" title={imagePrompt} aria-label={imagePrompt}>
          <span className="cc-slideai__canvas-insight-image-label">📷</span>
        </div>
      )}
    </div>
  );
}

function SlideCallout({ text }: { text: string }) {
  const [lead, ...rest] = text.split(':');
  const hasLead = rest.length > 0 && lead.length < 30;
  return (
    <div className="cc-slideai__canvas-sowhat">
      {hasLead ? (
        <>
          <strong>{lead}:</strong> {rest.join(':')}
        </>
      ) : (
        text
      )}
    </div>
  );
}

function SlideCanvasFooter({
  index,
  light,
  deckTheme,
}: {
  index: number;
  light?: boolean;
  deckTheme: Deck['theme'];
}) {
  const footer =
    deckTheme.tagline === 'Path to Forward'
      ? ADGM_PPT_FOOTER
      : `${deckTheme.tagline || 'Forward'} · Confidential`;
  return (
    <footer className={`cc-slideai__canvas-foot${light ? ' cc-slideai__canvas-foot--light' : ''}`}>
      <span>{footer}</span>
      <span className="cc-slideai__canvas-foot-num">{index + 1}</span>
    </footer>
  );
}

// ─── SVG Chart Components ────────────────────────────────────────────────────

const CHART_COLORS = ['#0087FF', '#1A2332', '#C9A84C', '#44D7B6', '#9CA3AF'];

function seriesColor(series: SlideChart['series'], i: number): string {
  return series[i]?.color ? `#${series[i].color}` : CHART_COLORS[i % CHART_COLORS.length];
}

function SvgBarChart({ chart }: { chart: SlideChart }) {
  const padL = 34, padB = 30, padT = 14, padR = 10;
  const vbW = 220, vbH = 140;
  const plotW = vbW - padL - padR;
  const plotH = vbH - padT - padB;

  const allVals = chart.series.flatMap((s) => s.values);
  const rawMax = Math.max(...allVals, 0);
  const rawMin = Math.min(...allVals, 0);
  const range = rawMax - rawMin || 1;
  const maxVal = rawMax + range * 0.12;
  const minVal = rawMin - range * 0.06;
  const totalRange = maxVal - minVal || 1;

  const toY = (v: number) => padT + plotH * (1 - (v - minVal) / totalRange);
  const zeroY = toY(0);

  const nLabels = chart.labels.length;
  const nSeries = chart.series.length;
  const groupW = plotW / nLabels;
  const barPad = groupW * 0.18;
  const barW = Math.max(2, (groupW - barPad * 2) / nSeries - 1.5);

  // 4 horizontal gridlines
  const gridVals = [0.25, 0.5, 0.75, 1.0].map((f) => minVal + totalRange * f);

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {/* Y unit label */}
      {chart.yUnit && (
        <text x={padL} y={padT - 4} fontSize="4.5" fill="#9CA3AF" textAnchor="start">{chart.yUnit}</text>
      )}

      {/* Gridlines */}
      {gridVals.map((v, i) => {
        const gy = toY(v);
        return (
          <g key={i}>
            <line x1={padL} y1={gy} x2={padL + plotW} y2={gy} stroke="#E2E8F0" strokeWidth="0.5" />
            <text x={padL - 2} y={gy + 1.5} fontSize="4" fill="#9CA3AF" textAnchor="end">
              {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v >= 100 ? v.toFixed(0) : v.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* Baseline at 0 */}
      <line x1={padL} y1={zeroY} x2={padL + plotW} y2={zeroY} stroke="#1A2332" strokeWidth="0.75" />

      {/* Bars */}
      {chart.labels.map((label, li) => {
        const groupX = padL + li * groupW + barPad;
        return (
          <g key={li}>
            {chart.series.map((s, si) => {
              const v = s.values[li] ?? 0;
              const barX = groupX + si * (barW + 1.5);
              const barTop = toY(Math.max(v, 0));
              const barBot = toY(Math.min(v, 0));
              const bH = Math.max(1, barBot - barTop);
              const color = seriesColor(chart.series, si);
              const labelY = v >= 0 ? barTop - 2 : barBot + 6;
              return (
                <g key={si}>
                  <rect x={barX} y={barTop} width={barW} height={bH} fill={color} rx="1.5" />
                  <text x={barX + barW / 2} y={labelY} fontSize="5.5" fill="#1A2332" textAnchor="middle">
                    {Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v % 1 === 0 ? v : v.toFixed(1)}
                  </text>
                </g>
              );
            })}
            {/* Category label */}
            <text
              x={groupX + (nSeries * (barW + 1.5) - 1.5) / 2}
              y={vbH - padB + 8}
              fontSize="5"
              fill="#5C6B7A"
              textAnchor="middle"
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* Baseline target line */}
      {chart.baseline != null && (
        <g>
          <line
            x1={padL} y1={toY(chart.baseline)}
            x2={padL + plotW} y2={toY(chart.baseline)}
            stroke="#C9A84C" strokeWidth="1" strokeDasharray="3,2"
          />
          <text x={padL + plotW + 1} y={toY(chart.baseline) + 1.5} fontSize="4.5" fill="#C9A84C">Target</text>
        </g>
      )}

      {/* Annotation callout */}
      {chart.annotation != null && chart.annotationIndex != null && (() => {
        const li = chart.annotationIndex;
        const groupX = padL + li * groupW + barPad;
        const cx = groupX + (nSeries * (barW + 1.5) - 1.5) / 2;
        const cy = toY(Math.max(...chart.series.map((s) => s.values[li] ?? 0)));
        const bW = Math.min(chart.annotation.length * 3.4 + 6, 60);
        const bX = Math.min(cx - bW / 2, vbW - bW - padR);
        const bY = Math.max(cy - 16, padT);
        return (
          <g>
            <line x1={cx} y1={cy - 1} x2={cx} y2={bY + 9} stroke="#1A2332" strokeWidth="0.75" strokeDasharray="2,1.5" />
            <rect x={bX} y={bY} width={bW} height={9} fill="#1A2332" rx="1.5" />
            <text x={bX + bW / 2} y={bY + 6} fontSize="4.5" fill="#FFFFFF" textAnchor="middle">{chart.annotation}</text>
          </g>
        );
      })()}

      {/* Legend for multi-series */}
      {nSeries > 1 && (
        <g>
          {chart.series.map((s, si) => (
            <g key={si} transform={`translate(${padL + si * 40}, ${vbH - 6})`}>
              <rect x="0" y="-4" width="6" height="4" fill={seriesColor(chart.series, si)} rx="0.5" />
              <text x="8" y="0" fontSize="4.5" fill="#5C6B7A">{s.name}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

function SvgLineChart({ chart }: { chart: SlideChart }) {
  const padL = 34, padB = 30, padT = 14, padR = 10;
  const vbW = 220, vbH = 140;
  const plotW = vbW - padL - padR;
  const plotH = vbH - padT - padB;

  const allVals = chart.series.flatMap((s) => s.values);
  const rawMax = Math.max(...allVals);
  const rawMin = Math.min(...allVals);
  const range = rawMax - rawMin || 1;
  const maxVal = rawMax + range * 0.15;
  const minVal = rawMin - range * 0.10;
  const totalRange = maxVal - minVal || 1;

  const toY = (v: number) => padT + plotH * (1 - (v - minVal) / totalRange);
  const nLabels = chart.labels.length;
  const toX = (i: number) => padL + (i / Math.max(nLabels - 1, 1)) * plotW;

  const gridVals = [0.25, 0.5, 0.75, 1.0].map((f) => minVal + totalRange * f);

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {chart.yUnit && (
        <text x={padL} y={padT - 4} fontSize="4.5" fill="#9CA3AF" textAnchor="start">{chart.yUnit}</text>
      )}

      {gridVals.map((v, i) => {
        const gy = toY(v);
        return (
          <g key={i}>
            <line x1={padL} y1={gy} x2={padL + plotW} y2={gy} stroke="#E2E8F0" strokeWidth="0.5" />
            <text x={padL - 2} y={gy + 1.5} fontSize="4" fill="#9CA3AF" textAnchor="end">
              {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}
            </text>
          </g>
        );
      })}

      <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#1A2332" strokeWidth="0.75" />

      {chart.series.map((s, si) => {
        const color = seriesColor(chart.series, si);
        const pts = s.values.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
        return (
          <g key={si}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {s.values.map((v, i) => (
              <g key={i}>
                <circle cx={toX(i)} cy={toY(v)} r="2.5" fill={color} />
                <text x={toX(i)} y={toY(v) - 4} fontSize="5" fill="#1A2332" textAnchor="middle">
                  {v % 1 === 0 ? v : v.toFixed(1)}
                </text>
              </g>
            ))}
          </g>
        );
      })}

      {chart.labels.map((label, i) => (
        <text key={i} x={toX(i)} y={vbH - padB + 8} fontSize="5" fill="#5C6B7A" textAnchor="middle">
          {label}
        </text>
      ))}

      {chart.baseline != null && (
        <g>
          <line x1={padL} y1={toY(chart.baseline)} x2={padL + plotW} y2={toY(chart.baseline)}
            stroke="#C9A84C" strokeWidth="1" strokeDasharray="3,2" />
          <text x={padL + plotW + 1} y={toY(chart.baseline) + 1.5} fontSize="4.5" fill="#C9A84C">Target</text>
        </g>
      )}

      {chart.annotation != null && chart.annotationIndex != null && (() => {
        const i = chart.annotationIndex;
        const ax = toX(i);
        const topY = padT;
        const botY = padT + plotH;
        const bW = Math.min(chart.annotation.length * 3.4 + 6, 60);
        const bX = Math.min(ax - bW / 2, vbW - bW - padR);
        return (
          <g>
            <line x1={ax} y1={topY} x2={ax} y2={botY} stroke="#1A2332" strokeWidth="0.75" strokeDasharray="2,1.5" />
            <rect x={bX} y={topY} width={bW} height={9} fill="#1A2332" rx="1.5" />
            <text x={bX + bW / 2} y={topY + 6} fontSize="4.5" fill="#FFFFFF" textAnchor="middle">{chart.annotation}</text>
          </g>
        );
      })()}

      {chart.series.length > 1 && (
        <g>
          {chart.series.map((s, si) => (
            <g key={si} transform={`translate(${padL + si * 42}, ${vbH - 6})`}>
              <line x1="0" y1="-2" x2="8" y2="-2" stroke={seriesColor(chart.series, si)} strokeWidth="2" />
              <circle cx="4" cy="-2" r="2" fill={seriesColor(chart.series, si)} />
              <text x="10" y="0" fontSize="4.5" fill="#5C6B7A">{s.name}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

function SvgWaterfallChart({ chart }: { chart: SlideChart }) {
  const padL = 34, padB = 30, padT = 14, padR = 10;
  const vbW = 220, vbH = 140;
  const plotW = vbW - padL - padR;
  const plotH = vbH - padT - padB;

  const vals = chart.series[0]?.values ?? [];
  const labels = chart.labels;

  // Compute running totals
  type WBar = { base: number; height: number; positive: boolean; total: boolean };
  const bars: WBar[] = [];
  let running = 0;
  vals.forEach((v, i) => {
    const isTotal = /^total$|^net$/i.test(labels[i] ?? '');
    if (isTotal) {
      bars.push({ base: 0, height: running, positive: running >= 0, total: true });
    } else if (v >= 0) {
      bars.push({ base: running, height: v, positive: true, total: false });
      running += v;
    } else {
      bars.push({ base: running + v, height: -v, positive: false, total: false });
      running += v;
    }
  });

  const allEnds = bars.map((b) => b.base + b.height);
  const allBases = bars.map((b) => b.base);
  const rawMax = Math.max(...allEnds, ...allBases, 0);
  const rawMin = Math.min(...allEnds, ...allBases, 0);
  const range = rawMax - rawMin || 1;
  const maxVal = rawMax + range * 0.15;
  const minVal = rawMin - range * 0.08;
  const totalRange = maxVal - minVal || 1;

  const toY = (v: number) => padT + plotH * (1 - (v - minVal) / totalRange);
  const zeroY = toY(0);
  const nBars = labels.length;
  const groupW = plotW / nBars;
  const barPad = groupW * 0.18;
  const barW = groupW - barPad * 2;

  const gridVals = [0.25, 0.5, 0.75, 1.0].map((f) => minVal + totalRange * f);

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {chart.yUnit && (
        <text x={padL} y={padT - 4} fontSize="4.5" fill="#9CA3AF" textAnchor="start">{chart.yUnit}</text>
      )}

      {gridVals.map((v, i) => {
        const gy = toY(v);
        return (
          <g key={i}>
            <line x1={padL} y1={gy} x2={padL + plotW} y2={gy} stroke="#E2E8F0" strokeWidth="0.5" />
            <text x={padL - 2} y={gy + 1.5} fontSize="4" fill="#9CA3AF" textAnchor="end">
              {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}
            </text>
          </g>
        );
      })}

      <line x1={padL} y1={zeroY} x2={padL + plotW} y2={zeroY} stroke="#1A2332" strokeWidth="0.75" />

      {bars.map((bar, i) => {
        const barX = padL + i * groupW + barPad;
        const barTop = toY(bar.base + bar.height);
        const barBot = toY(bar.base);
        const bH = Math.max(1, barBot - barTop);
        const color = bar.total ? '#1A2332' : bar.positive ? '#0087FF' : '#E8A838';
        const v = vals[i] ?? 0;
        const labelText = bar.total
          ? (bar.height % 1 === 0 ? String(bar.height) : bar.height.toFixed(1))
          : (v > 0 ? `+${v}` : String(v));
        const labelY = barTop - 2;

        // Connector line to next bar
        const nextBar = bars[i + 1];
        const connectorY = bar.total ? toY(0) : toY(bar.base + bar.height);
        const nextBarX = padL + (i + 1) * groupW + barPad;

        return (
          <g key={i}>
            <rect x={barX} y={barTop} width={barW} height={bH} fill={color} rx="1.5" />
            <text x={barX + barW / 2} y={labelY} fontSize="5.5" fill="#1A2332" textAnchor="middle">{labelText}</text>
            {nextBar && !bar.total && (
              <line
                x1={barX + barW} y1={connectorY}
                x2={nextBarX} y2={connectorY}
                stroke="#9CA3AF" strokeWidth="0.5" strokeDasharray="2,1.5"
              />
            )}
            <text x={barX + barW / 2} y={vbH - padB + 8} fontSize="5" fill="#5C6B7A" textAnchor="middle">
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SvgHorizontalBarChart({ chart }: { chart: SlideChart }) {
  const padL = 60, padR = 30, padT = 14, padB = 14;
  const vbW = 220, vbH = 140;
  const plotW = vbW - padL - padR;
  const plotH = vbH - padT - padB;

  const allVals = chart.series.flatMap((s) => s.values);
  const rawMax = Math.max(...allVals, 0);
  const maxVal = rawMax * 1.15 || 1;

  const nBars = chart.labels.length;
  const barHeight = Math.min(14, (plotH / nBars) - 4);
  const groupH = plotH / nBars;

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {chart.yUnit && (
        <text x={padL} y={padT - 4} fontSize="4.5" fill="#9CA3AF" textAnchor="start">{chart.yUnit}</text>
      )}

      {/* Vertical axis */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#1A2332" strokeWidth="0.75" />

      {chart.labels.map((label, li) => {
        const barY = padT + li * groupH + (groupH - barHeight) / 2;
        return (
          <g key={li}>
            {/* Category label */}
            <text x={padL - 3} y={barY + barHeight / 2 + 1.8} fontSize="5.5" fill="#1A2332" textAnchor="end">
              {label}
            </text>
            {/* Bars per series */}
            {chart.series.map((s, si) => {
              const v = s.values[li] ?? 0;
              const bW = (v / maxVal) * plotW;
              const color = seriesColor(chart.series, si);
              const seriesOffset = chart.series.length > 1 ? si * (barHeight / chart.series.length + 1) : 0;
              const sH = chart.series.length > 1 ? barHeight / chart.series.length - 1 : barHeight;
              return (
                <g key={si}>
                  <rect x={padL} y={barY + seriesOffset} width={Math.max(1, bW)} height={sH} fill={color} rx="1.5" />
                  <text x={padL + bW + 2} y={barY + seriesOffset + sH / 2 + 1.8} fontSize="5.5" fill="#1A2332">
                    {v % 1 === 0 ? v : v.toFixed(1)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Baseline target */}
      {chart.baseline != null && (
        <g>
          <line
            x1={padL + (chart.baseline / maxVal) * plotW}
            y1={padT}
            x2={padL + (chart.baseline / maxVal) * plotW}
            y2={padT + plotH}
            stroke="#C9A84C" strokeWidth="1" strokeDasharray="3,2"
          />
          <text
            x={padL + (chart.baseline / maxVal) * plotW}
            y={padT - 2}
            fontSize="4.5" fill="#C9A84C" textAnchor="middle"
          >
            Target
          </text>
        </g>
      )}

      {chart.series.length > 1 && (
        <g>
          {chart.series.map((s, si) => (
            <g key={si} transform={`translate(${padL + si * 42}, ${vbH - 5})`}>
              <rect x="0" y="-4" width="6" height="4" fill={seriesColor(chart.series, si)} rx="0.5" />
              <text x="8" y="0" fontSize="4.5" fill="#5C6B7A">{s.name}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

function SvgDonutChart({ chart }: { chart: SlideChart }) {
  const vbW = 160, vbH = 140;
  const cx = 70, cy = 70, outerR = 55, innerR = 35;
  const DONUT_COLORS = ['#0087FF', '#1A2332', '#C9A84C', '#44D7B6', '#9CA3AF'];

  const vals = chart.series[0]?.values ?? [];
  const total = vals.reduce((a, b) => a + b, 0) || 1;

  // Build arc paths
  let startAngle = -Math.PI / 2;
  const arcs = vals.map((v, i) => {
    const angle = (v / total) * Math.PI * 2;
    const endAngle = startAngle + angle;
    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);
    const large = angle > Math.PI ? 1 : 0;
    const d = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');
    const color = chart.series[0]?.color
      ? `#${chart.series[0].color}`
      : DONUT_COLORS[i % DONUT_COLORS.length];
    startAngle = endAngle;
    return { d, color, label: chart.labels[i] ?? '', pct: Math.round((v / total) * 100) };
  });

  const centerLabel = chart.series[0]?.name || chart.yUnit || '';

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {arcs.map((arc, i) => (
        <path key={i} d={arc.d} fill={DONUT_COLORS[i % DONUT_COLORS.length]} stroke="#FFFFFF" strokeWidth="1" />
      ))}

      {/* Center text */}
      <text x={cx} y={cy - 3} fontSize="7" fill="#1A2332" textAnchor="middle" fontWeight="bold">
        {centerLabel}
      </text>
      <text x={cx} y={cy + 7} fontSize="5.5" fill="#5C6B7A" textAnchor="middle">total</text>

      {/* Legend on right */}
      <g transform={`translate(${cx + outerR + 8}, 20)`}>
        {arcs.map((arc, i) => (
          <g key={i} transform={`translate(0, ${i * 16})`}>
            <rect x="0" y="0" width="7" height="7" fill={DONUT_COLORS[i % DONUT_COLORS.length]} rx="1" />
            <text x="10" y="6" fontSize="5" fill="#1A2332">{arc.label}</text>
            <text x="10" y="13" fontSize="4.5" fill="#5C6B7A">{arc.pct}%</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function SlideChartComponent({ chart }: { chart: SlideChart }) {
  if (chart.type === 'waterfall') return <SvgWaterfallChart chart={chart} />;
  if (chart.type === 'line') return <SvgLineChart chart={chart} />;
  if (chart.type === 'bar-horizontal') return <SvgHorizontalBarChart chart={chart} />;
  if (chart.type === 'donut') return <SvgDonutChart chart={chart} />;
  return <SvgBarChart chart={chart} />; // bar and grouped-bar
}

/** Minimal thumbnail for filmstrip */
export function SlideThumb({
  slide,
  isActive,
  isUpdating,
  onClick,
}: {
  slide: Slide;
  deckTheme: Deck['theme'];
  isActive: boolean;
  isUpdating?: boolean;
  onClick: () => void;
}) {
  const isTitle = slide.layout === 'title';
  return (
    <button
      type="button"
      className={`cc-slideai__thumb${isActive ? ' cc-slideai__thumb--on' : ''}${isTitle ? ' cc-slideai__thumb--title' : ''}${isUpdating ? ' cc-slideai__thumb--updating' : ''}`}
      onClick={onClick}
      aria-current={isActive ? 'true' : undefined}
      title={slide.title}
    >
      <span className="cc-slideai__thumb-preview">
        {isTitle ? (
          <span className="cc-slideai__thumb-title-text">{slide.title}</span>
        ) : (
          <>
            <span className="cc-slideai__thumb-bar" aria-hidden />
            <span className="cc-slideai__thumb-headline">{slide.title}</span>
          </>
        )}
      </span>
    </button>
  );
}
