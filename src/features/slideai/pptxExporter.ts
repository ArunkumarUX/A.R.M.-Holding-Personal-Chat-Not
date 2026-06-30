/**
 * Apparel Group SlideAI — PPTX Exporter
 * Consulting-grade output matching Perceptis / McKinsey standard.
 * Pixel-perfect alignment grid — all positions derived from layout constants.
 */
// @ts-nocheck
import pptxgen from 'pptxgenjs';
import { ADGM_PPT_COLORS } from '../../config/adgmBrandForDeck';
import type { Deck, Slide, SlideChart, SlideTable } from './slideTypes';

// ─── Apparel Group Design Tokens (from brand guidelines) ─────────────────────
const C = {
  navy:           ADGM_PPT_COLORS.navy,
  navyMid:        ADGM_PPT_COLORS.navyMid,
  clearsky:       ADGM_PPT_COLORS.accent,
  clearskyLight:  ADGM_PPT_COLORS.accentSoft,
  white:          ADGM_PPT_COLORS.white,
  ink:            ADGM_PPT_COLORS.ink,
  inkMuted:       ADGM_PPT_COLORS.inkMuted,
  inkLight:       ADGM_PPT_COLORS.slate,
  paper:          ADGM_PPT_COLORS.paper,
  paperSoft:      ADGM_PPT_COLORS.paperSoft,
  line:           ADGM_PPT_COLORS.line,
  gold:           'C5D92D',
  mint:           ADGM_PPT_COLORS.mint,
  tableHead:      ADGM_PPT_COLORS.tableHead,
  tableEven:      ADGM_PPT_COLORS.paperSoft,
  highlightFill:  ADGM_PPT_COLORS.kpiFill,
  highlightText:  ADGM_PPT_COLORS.navyMid,
  highCell:       ADGM_PPT_COLORS.navy,
  highCellText:   ADGM_PPT_COLORS.white,
  medCell:        'C5D92D',
  medCellText:    ADGM_PPT_COLORS.ink,
  lowCell:        ADGM_PPT_COLORS.line,
  lowCellText:    ADGM_PPT_COLORS.inkMuted,
  soWhatBg:       ADGM_PPT_COLORS.accentSoft,
  soWhatBorder:   ADGM_PPT_COLORS.accent,
} as const;

const FONT_DISPLAY = 'Gotham';
const FONT_BODY    = 'Aptos';
const FONT_MONO    = 'Consolas';

// ─── Pixel-perfect layout grid (all positions derived from these constants) ───
//
//  ┌──────────────────────────── 10.00" ────────────────────────────┐
//  │ M=0.45"  [EYEBROW y=0.38, h=0.24]                    M=0.45" │
//  │          [TITLE   y=0.38 or 0.66, h=0.84]                     │
//  │          [BODY starts at 1.30 or 1.58]                         │
//  │                 ··· content area ···                           │
//  │          [SOWHAT  y=soWhatY(), h=0.44]                         │
//  │          [SOURCE  y=5.08, h=0.19]                              │
//  │          [FOOTER  y=5.34, h=0.18]                              │
//  └────────────────────────────────────────────────────────────────┘

const W  = 10.0;
const H  = 5.625;
const ML = 0.45;   // left margin
const MR = 0.45;   // right margin
const CW = W - ML - MR;  // content width = 9.10"

// Eyebrow strip
const EYEBROW_Y   = 0.38;
const EYEBROW_H   = 0.24;

// Title block
const TITLE_Y_PLAIN = 0.38;                            // no eyebrow
const TITLE_Y_EYE   = EYEBROW_Y + EYEBROW_H + 0.04;  // = 0.66, with eyebrow
const TITLE_H       = 0.84;

// Body content start (4px gap below title bounding box)
const BODY_Y_PLAIN = TITLE_Y_PLAIN + TITLE_H + 0.08;  // = 1.30
const BODY_Y_EYE   = TITLE_Y_EYE   + TITLE_H + 0.08;  // = 1.58

// Footer zone — absolute from slide bottom
const FOOTER_H   = 0.18;
const FOOTER_Y   = H - FOOTER_H - 0.09;               // = 5.355 → use 5.34
const SOURCE_H   = 0.19;
const SOURCE_Y   = FOOTER_Y - SOURCE_H - 0.05;        // = 5.10
const SOWHAT_H   = 0.44;

/** Where body content must end (top of soWhat/source/footer zone) */
function safeBottom(hasSoWhat: boolean, hasSource: boolean): number {
  if (hasSoWhat && hasSource) return SOURCE_Y - SOWHAT_H - 0.06;
  if (hasSoWhat)              return FOOTER_Y - SOWHAT_H - 0.06;
  if (hasSource)              return SOURCE_Y - 0.05;
  return FOOTER_Y - 0.08;
}

/** Y coordinate of the soWhat callout */
function soWhatY(hasSource: boolean): number {
  return (hasSource ? SOURCE_Y : FOOTER_Y) - SOWHAT_H - 0.05;
}

/** Body content Y given whether an eyebrow was rendered */
function bodyY(hasEyebrow: boolean): number {
  return hasEyebrow ? BODY_Y_EYE : BODY_Y_PLAIN;
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

function hex(c?: string, fallback = C.ink): string {
  if (!c?.trim()) return fallback;
  return c.replace('#', '');
}

function safeFilename(title: string): string {
  const base = title.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 64);
  return `${base || 'arm-deck'}.pptx`;
}

function deckFooter(deck: Deck): string {
  const tag = deck.theme.tagline || 'Images RetailME Awards';
  return `Apparel Group · ${tag} · Confidential`;
}

// ─── Common atoms ─────────────────────────────────────────────────────────────

function addFooter(sl: pptxgen.Slide, deck: Deck, index: number, _total: number) {
  // Left: company tagline
  sl.addText(deckFooter(deck), {
    x: ML, y: FOOTER_Y, w: CW - 0.70, h: FOOTER_H,
    fontFace: FONT_BODY, fontSize: 7.5, color: C.inkLight,
    valign: 'middle', margin: 0,
  });
  // Right: page number
  sl.addText(`${index + 1}`, {
    x: W - MR - 0.55, y: FOOTER_Y, w: 0.55, h: FOOTER_H,
    fontFace: FONT_MONO, fontSize: 8, color: C.inkLight,
    align: 'right', valign: 'middle', margin: 0,
  });
}

function addSourceNote(sl: pptxgen.Slide, sourceNote: string) {
  sl.addText(sourceNote, {
    x: ML, y: SOURCE_Y, w: CW, h: SOURCE_H,
    fontFace: FONT_BODY, fontSize: 7, color: C.inkLight,
    italic: true, valign: 'middle', margin: 0,
  });
}

/**
 * Render eyebrow + title. Returns the Y where body content should start.
 */
function addActionTitle(
  sl: pptxgen.Slide,
  title: string,
  eyebrow?: string | null,
  displayFont = FONT_DISPLAY,
): number {
  if (eyebrow) {
    sl.addText(eyebrow.toUpperCase(), {
      x: ML, y: EYEBROW_Y, w: CW, h: EYEBROW_H,
      fontFace: FONT_BODY, fontSize: 8.5, bold: true,
      color: C.clearsky, charSpacing: 1.5,
      valign: 'middle', margin: 0,
    });
    sl.addText(title, {
      x: ML, y: TITLE_Y_EYE, w: CW, h: TITLE_H,
      fontFace: displayFont, fontSize: 21, bold: true,
      color: C.navy, valign: 'middle', margin: 0,
      shrinkText: true,
    });
    return BODY_Y_EYE;
  }

  sl.addText(title, {
    x: ML, y: TITLE_Y_PLAIN, w: CW, h: TITLE_H,
    fontFace: displayFont, fontSize: 22, bold: true,
    color: C.navy, valign: 'middle', margin: 0,
    shrinkText: true,
  });
  return BODY_Y_PLAIN;
}

// ─── Insight Panel (dark right sidebar) ──────────────────────────────────────

function addInsightPanel(
  sl: pptxgen.Slide,
  pres: pptxgen,
  panelTitle: string,
  bullets: string[],
  x: number,
  y: number,
  w: number,
  h: number,
) {
  // Background
  sl.addShape(pres.ShapeType.rect, {
    x, y, w, h,
    fill: { color: C.navy },
    line: { color: C.navy, width: 0 },
  });

  // Panel title
  sl.addText(panelTitle.toUpperCase(), {
    x: x + 0.18, y: y + 0.16, w: w - 0.36, h: 0.28,
    fontFace: FONT_BODY, fontSize: 8.5, bold: true,
    color: C.white, charSpacing: 1, valign: 'middle', margin: 0,
  });

  // Divider
  sl.addShape(pres.ShapeType.rect, {
    x: x + 0.18, y: y + 0.48, w: w - 0.36, h: 0.012,
    fill: { color: 'FFFFFF', transparency: 75 },
    line: { color: C.navy, width: 0 },
  });

  // Bullets — strip ** markdown, add • marker
  const cleanBullets = bullets.map((b) => b.replace(/\*\*/g, ''));
  const bulletItems = cleanBullets.map((b, idx) => ({
    text: `• ${b}`,
    options: {
      breakLine: idx < cleanBullets.length - 1,
      fontSize: 9.5,
      color: 'FFFFFFCC' as string,
      fontFace: FONT_BODY,
      paraSpaceAfter: 5,
    },
  }));
  sl.addText(bulletItems, {
    x: x + 0.18, y: y + 0.58, w: w - 0.36, h: h - 0.76,
    margin: 0, valign: 'top',
  });
}

// ─── Consulting table ─────────────────────────────────────────────────────────

function addConsultingTable(
  sl: pptxgen.Slide,
  table: SlideTable,
  x: number,
  y: number,
  w: number,
  maxH: number,
  accent: string = C.clearsky,
) {
  const colCount = table.headers.length;
  if (!colCount) return;

  let curY = y;

  if (table.caption) {
    sl.addText(table.caption, {
      x, y: curY, w, h: 0.22,
      fontFace: FONT_BODY, fontSize: 9.5, bold: true, color: C.ink,
      valign: 'middle', margin: 0,
    });
    curY += 0.26;
  }
  if (table.subcaption) {
    sl.addText(table.subcaption, {
      x, y: curY, w, h: 0.18,
      fontFace: FONT_BODY, fontSize: 8, color: C.inkMuted, italic: true,
      valign: 'middle', margin: 0,
    });
    curY += 0.22;
  }

  // Column widths: first col is wider (dimension column)
  const firstColW = w * 0.30;
  const restColW  = colCount > 1 ? (w - firstColW) / (colCount - 1) : w;
  const colW = colCount > 1
    ? [firstColW, ...Array(colCount - 1).fill(restColW)]
    : [w];

  // Header row
  const headerRow = table.headers.map((hdr, ci) => ({
    text: hdr,
    options: {
      fill: C.tableHead,
      color: C.white,
      bold: true,
      fontSize: 9,
      fontFace: FONT_BODY,
      valign: 'middle' as pptxgen.VAlignType,
      align: (ci === 0 ? 'left' : 'center') as pptxgen.HAlignType,
      margin: [4, 6, 4, 6] as [number, number, number, number],
    },
  }));

  // Data rows
  const dataRows = table.rows.map((row, ri) => {
    const isEven   = ri % 2 === 1;
    const rowFill  = row.highlight ? C.highlightFill : isEven ? C.tableEven : C.white;
    const rowColor = row.highlight ? C.highlightText : C.ink;

    return row.cells.map((cell, ci) => {
      const upper = cell.trim().toLowerCase();
      let cellFill  = rowFill;
      let cellColor = row.bold ? C.ink : rowColor;
      let cellBold  = row.bold || false;

      if (upper === 'high' || upper === 'h') {
        cellFill = C.highCell; cellColor = C.highCellText; cellBold = true;
      } else if (upper === 'medium' || upper === 'm') {
        cellFill = C.medCell; cellColor = C.medCellText;
      } else if (upper === 'low' || upper === 'l') {
        cellFill = C.lowCell; cellColor = C.lowCellText;
      }

      return {
        text: cell,
        options: {
          fill: cellFill,
          color: cellColor,
          bold: cellBold,
          fontSize: 9,
          fontFace: FONT_BODY,
          valign: 'middle'  as pptxgen.VAlignType,
          align: (ci === 0 ? 'left' : 'center') as pptxgen.HAlignType,
          margin: [3, 5, 3, 5] as [number, number, number, number],
        },
      };
    });
  });

  const tableH = maxH - (curY - y);
  const rowH   = Math.min(0.33, tableH / (table.rows.length + 1));

  sl.addTable([headerRow, ...dataRows], {
    x, y: curY, w,
    colW,
    rowH,
    border: { type: 'solid', color: C.line, pt: 0.5 },
    fontSize: 9,
    fontFace: FONT_BODY,
    color: C.ink,
  });
}

// ─── "So what" callout ────────────────────────────────────────────────────────

function addSoWhatCallout(
  sl: pptxgen.Slide,
  pres: pptxgen,
  text: string,
  x: number,
  y: number,
  w: number,
) {
  // Background
  sl.addShape(pres.ShapeType.rect, {
    x, y, w, h: SOWHAT_H,
    fill: { color: C.soWhatBg },
    line: { color: C.soWhatBorder, width: 1.5, dashType: 'solid' },
  });
  // Left accent bar
  sl.addShape(pres.ShapeType.rect, {
    x, y, w: 0.055, h: SOWHAT_H,
    fill: { color: C.clearsky },
    line: { color: C.clearsky, width: 0 },
  });

  const [lead, ...rest] = text.split(':');
  const hasLead = rest.length > 0 && lead.length < 35;
  const parts = hasLead
    ? [
        { text: `${lead}: `, options: { bold: true,  color: C.navyMid } },
        { text: rest.join(':').trim(), options: { bold: false, color: C.ink  } },
      ]
    : [{ text, options: { bold: false, color: C.ink } }];

  sl.addText(parts, {
    x: x + 0.14, y, w: w - 0.18, h: SOWHAT_H,
    fontFace: FONT_BODY, fontSize: 9.5,
    valign: 'middle', margin: 0,
  });
}

// ─── Native chart renderer ────────────────────────────────────────────────────

function addNativeChart(
  sl: pptxgen.Slide,
  pres: pptxgen,
  chart: SlideChart,
  x: number,
  y: number,
  w: number,
  h: number,
  accent = C.clearsky,
) {
  const CHART_COLORS = [accent, C.navy, C.gold, C.mint, C.inkLight];

  const chartData = chart.series.map((s) => ({
    name: s.name,
    labels: chart.labels,
    values: s.values,
  }));

  const baseOpts: pptxgen.IChartOpts = {
    x, y, w, h,
    chartColors: chart.series.map((s, i) => s.color || CHART_COLORS[i % CHART_COLORS.length]),
    showTitle: false,
    showLegend: chart.series.length > 1,
    legendPos: 'b' as pptxgen.ChartLegendPos,
    legendFontSize: 7.5,
    showValue: true,
    dataLabelFontSize: 7.5,
    valAxisLineColor: C.line,
    catAxisLineColor: C.ink,
    valAxisLabelColor: C.inkLight,
    catAxisLabelColor: C.inkMuted,
    valAxisLabelFontSize: 7.5,
    catAxisLabelFontSize: 7.5,
    plotAreaBorderColor: C.white,
    plotAreaFillColor: C.white,
    chartAreaFillColor: C.white,
    valGridLine: { style: 'solid', color: C.line, size: 0.5 },
  };

  if (chart.type === 'bar' || chart.type === 'grouped-bar') {
    sl.addChart(pres.ChartType.bar, chartData, {
      ...baseOpts,
      barDir: 'col',
      barGrouping: 'clustered',
      dataLabelColor: C.white,
    });
  } else if (chart.type === 'bar-horizontal') {
    sl.addChart(pres.ChartType.bar, chartData, {
      ...baseOpts,
      barDir: 'bar',
      barGrouping: 'clustered',
      dataLabelColor: C.white,
    });
  } else if (chart.type === 'line') {
    sl.addChart(pres.ChartType.line, chartData, {
      ...baseOpts,
      dataLabelColor: C.ink,
      lineSize: 2,
    });
  } else if (chart.type === 'donut') {
    sl.addChart(pres.ChartType.doughnut, [chartData[0]], {
      ...baseOpts,
      holeSize: 55,
    });
  } else if (chart.type === 'waterfall') {
    // Simulate waterfall with stacked bar: transparent base + visible positive/negative bars
    const baseVals: number[] = [];
    const posVals: number[] = [];
    const negVals: number[] = [];
    let running = 0;
    (chart.series[0]?.values ?? []).forEach((v, i) => {
      const isTotal = /^total$|^net$/i.test(chart.labels[i] ?? '');
      if (isTotal) {
        baseVals.push(0);
        posVals.push(running);
        negVals.push(0);
      } else if (v >= 0) {
        baseVals.push(running);
        posVals.push(v);
        negVals.push(0);
        running += v;
      } else {
        baseVals.push(running + v);
        posVals.push(0);
        negVals.push(-v);
        running += v;
      }
    });
    const waterfallData = [
      { name: 'Base',     labels: chart.labels, values: baseVals },
      { name: 'Increase', labels: chart.labels, values: posVals  },
      { name: 'Decrease', labels: chart.labels, values: negVals  },
    ];
    sl.addChart(pres.ChartType.bar, waterfallData, {
      ...baseOpts,
      barDir: 'col',
      barGrouping: 'stacked',
      chartColors: [C.white, accent, 'E8A838'],
      dataLabelColor: C.white,
    });
  } else {
    sl.addChart(pres.ChartType.bar, chartData, {
      ...baseOpts,
      barDir: 'col',
      dataLabelColor: C.white,
    });
  }

  // Annotation text overlay
  if (chart.annotation) {
    sl.addText(chart.annotation, {
      x: x + w * 0.02, y: y + h - 0.28, w: w - 0.04, h: 0.22,
      fontFace: FONT_BODY, fontSize: 7.5, color: C.inkMuted,
      italic: true, valign: 'middle', margin: 0,
    });
  }
}

// ─── Slide builder ────────────────────────────────────────────────────────────

function addSlide(pres: pptxgen, slide: Slide, deck: Deck, index: number, total: number) {
  const sl      = pres.addSlide();
  const accent  = hex(slide.theme?.accent ?? deck.theme.accent, C.clearsky);
  const dispFnt = deck.theme.font || FONT_DISPLAY;

  const hasSource = Boolean(slide.sourceNote);
  const hasSoWhat = Boolean(slide.soWhat);

  // ── TITLE / COVER ──────────────────────────────────────────────────────────
  if (slide.layout === 'title') {
    const bg = hex(slide.theme?.bg ?? deck.theme.darkBg ?? deck.theme.bg, C.navy);
    sl.background = { color: bg };

    // Decorative arcs
    sl.addShape(pres.ShapeType.ellipse, {
      x: 6.2, y: -1.2, w: 5.5, h: 5.5,
      fill: { color: C.navyMid, transparency: 60 },
      line: { color: C.navy, width: 0 },
    });
    sl.addShape(pres.ShapeType.ellipse, {
      x: 7.0, y: 1.8, w: 4.0, h: 4.0,
      fill: { color: C.navyMid, transparency: 70 },
      line: { color: C.navy, width: 0 },
    });

    // Eyebrow label
    if (slide.eyebrow) {
      sl.addText(slide.eyebrow.toUpperCase(), {
        x: ML, y: 0.52, w: 7.0, h: 0.26,
        fontFace: FONT_BODY, fontSize: 9, bold: true,
        color: hex(accent, C.clearsky) + '99', charSpacing: 2,
        valign: 'middle', margin: 0,
      });
    }

    // Large title
    sl.addText(slide.title, {
      x: ML, y: 1.00, w: 6.8, h: 2.0,
      fontFace: dispFnt, fontSize: 34, bold: true,
      color: C.white, margin: 0, valign: 'middle',
      shrinkText: true,
    });

    // Lede / subtitle
    if (slide.body || slide.subtitle) {
      sl.addText((slide.body ?? slide.subtitle) || '', {
        x: ML, y: 3.10, w: 6.5, h: 0.70,
        fontFace: FONT_BODY, fontSize: 14, color: 'FFFFFFCC',
        margin: 0, valign: 'middle',
      });
    }

    // Callout (audience / date line)
    if (slide.callout) {
      sl.addText(slide.callout, {
        x: ML, y: 3.90, w: 6.5, h: 0.36,
        fontFace: FONT_BODY, fontSize: 10, color: 'FFFFFF88',
        margin: 0, valign: 'middle',
      });
    }

    // Bottom accent rule
    sl.addShape(pres.ShapeType.rect, {
      x: 0, y: H - 0.12, w: W, h: 0.12,
      fill: { color: accent },
      line: { color: accent, width: 0 },
    });

    addFooter(sl, deck, index, total);

  // ── STAT / KPI ─────────────────────────────────────────────────────────────
  } else if (slide.layout === 'stat') {
    sl.background = { color: C.paper };
    const startY = addActionTitle(sl, slide.title, slide.eyebrow, dispFnt);

    // Safe card zone
    const cardBottom = safeBottom(hasSoWhat, hasSource);
    const stats = slide.stats ?? [];
    const gap   = 0.18;
    const sw    = stats.length
      ? (CW - gap * (stats.length - 1)) / stats.length
      : 2.8;
    const cardH = cardBottom - startY - 0.08;

    stats.forEach((s, i) => {
      const sx = ML + i * (sw + gap);
      const sy = startY + 0.08;

      sl.addShape(pres.ShapeType.rect, {
        x: sx, y: sy, w: sw, h: cardH,
        fill: { color: C.paperSoft },
        line: { color: C.line, width: 0.75 },
      });
      // Top accent bar
      sl.addShape(pres.ShapeType.rect, {
        x: sx, y: sy, w: sw, h: 0.07,
        fill: { color: accent },
        line: { color: accent, width: 0 },
      });
      // Value
      sl.addText(s.value, {
        x: sx, y: sy + 0.18, w: sw, h: 1.20,
        fontFace: dispFnt, fontSize: 44, bold: true,
        color: accent, align: 'center', valign: 'middle', margin: 0,
      });
      // Label
      sl.addText(s.label, {
        x: sx + 0.10, y: sy + 1.45, w: sw - 0.20, h: 0.50,
        fontFace: FONT_BODY, fontSize: 11, bold: true,
        color: C.ink, align: 'center', valign: 'middle', margin: 0,
      });
      // Context
      if (s.context) {
        sl.addText(s.context, {
          x: sx + 0.10, y: sy + 2.00, w: sw - 0.20, h: cardH - 2.10,
          fontFace: FONT_BODY, fontSize: 9, color: C.inkMuted,
          align: 'center', valign: 'top', margin: 0,
        });
      }
    });

    if (hasSoWhat) addSoWhatCallout(sl, pres, slide.soWhat!, ML, soWhatY(hasSource), CW);
    if (hasSource)  addSourceNote(sl, slide.sourceNote!);
    addFooter(sl, deck, index, total);

  // ── TWO-COL (Perceptis exhibit + insight panel) ────────────────────────────
  } else if (slide.layout === 'two-col') {
    sl.background = { color: C.paper };
    const startY = addActionTitle(sl, slide.title, slide.eyebrow, dispFnt);

    const hasPanel = Boolean(slide.insightPanel?.bullets?.length);
    const panelW   = hasPanel ? 3.30 : 0;
    const gutter   = hasPanel ? 0.15 : 0;
    const dataW    = CW - panelW - gutter;
    const dataX    = ML;
    const panelX   = ML + dataW + gutter;
    const dataY    = startY + 0.08;
    const dataH    = safeBottom(hasSoWhat, hasSource) - dataY;

    // Left: chart, table, or text
    if (slide.chart && !slide.table) {
      addNativeChart(sl, pres, slide.chart, dataX, dataY, dataW, dataH, accent);
    } else if (slide.table) {
      addConsultingTable(sl, slide.table, dataX, dataY, dataW, dataH, accent);
    } else {
      if (slide.leftTitle) {
        sl.addText(slide.leftTitle, {
          x: dataX, y: dataY, w: dataW, h: 0.28,
          fontFace: FONT_BODY, fontSize: 10, bold: true, color: C.ink,
          valign: 'middle', margin: 0,
        });
      }
      sl.addText(slide.leftContent || '', {
        x: dataX,
        y: dataY + (slide.leftTitle ? 0.32 : 0),
        w: dataW,
        h: dataH - (slide.leftTitle ? 0.32 : 0),
        fontFace: FONT_BODY, fontSize: 11, color: C.inkMuted,
        valign: 'top', margin: 0,
      });
    }

    // Right: insight panel
    if (hasPanel && slide.insightPanel) {
      addInsightPanel(sl, pres,
        slide.insightPanel.title,
        slide.insightPanel.bullets,
        panelX, dataY, panelW, dataH,
      );
    }

    if (hasSoWhat) addSoWhatCallout(sl, pres, slide.soWhat!, ML, soWhatY(hasSource), CW);
    if (hasSource)  addSourceNote(sl, slide.sourceNote!);
    addFooter(sl, deck, index, total);

  // ── CONTENT / BULLET ──────────────────────────────────────────────────────
  } else if (slide.layout === 'content') {
    sl.background = { color: C.paper };
    let curY = addActionTitle(sl, slide.title, slide.eyebrow, dispFnt);
    curY += 0.10;

    const contentBottom = safeBottom(hasSoWhat, hasSource);

    if (slide.table) {
      const tableH = contentBottom - curY;
      addConsultingTable(sl, slide.table, ML, curY, CW, tableH, accent);
    } else {
      if (slide.body) {
        const bodyH = 0.55;
        sl.addText(slide.body, {
          x: ML, y: curY, w: CW, h: bodyH,
          fontFace: FONT_BODY, fontSize: 13, color: C.inkMuted,
          valign: 'top', margin: 0,
        });
        curY += bodyH + 0.06;
      }
      if (slide.bullets?.length) {
        const bulletH = contentBottom - curY;
        const items = slide.bullets.map((b, idx) => ({
          text: b,
          options: {
            bullet: { code: '2022' },
            breakLine: idx < slide.bullets!.length - 1,
            fontSize: 12,
            color: C.ink,
            fontFace: FONT_BODY,
            indentLevel: 0,
            paraSpaceAfter: 5,
          },
        }));
        sl.addText(items, {
          x: ML + 0.20, y: curY, w: CW - 0.20, h: bulletH,
          margin: 0, valign: 'top',
        });
      }
    }

    if (hasSoWhat) addSoWhatCallout(sl, pres, slide.soWhat!, ML, soWhatY(hasSource), CW);
    if (hasSource)  addSourceNote(sl, slide.sourceNote!);
    addFooter(sl, deck, index, total);

  // ── QUOTE ─────────────────────────────────────────────────────────────────
  } else if (slide.layout === 'quote' && slide.quote) {
    sl.background = { color: C.navy };

    // Large open-quote mark
    sl.addText('“', {
      x: ML, y: 0.50, w: 1.0, h: 1.0,
      fontFace: dispFnt, fontSize: 80, color: accent,
      valign: 'top', margin: 0,
    });
    // Quote text
    sl.addText(slide.quote, {
      x: ML, y: 1.40, w: CW, h: 2.40,
      fontFace: dispFnt, fontSize: 22, italic: true,
      color: C.white, valign: 'middle', margin: 0,
      shrinkText: true,
    });
    // Attribution
    if (slide.quoteAuthor) {
      sl.addText(`— ${slide.quoteAuthor}`, {
        x: ML, y: 3.95, w: CW, h: 0.45,
        fontFace: FONT_BODY, fontSize: 13, color: 'FFFFFFAA',
        valign: 'middle', margin: 0,
      });
    }
    // Bottom accent stripe
    sl.addShape(pres.ShapeType.rect, {
      x: 0, y: H - 0.10, w: W, h: 0.10,
      fill: { color: accent }, line: { color: accent, width: 0 },
    });
    addFooter(sl, deck, index, total);

  // ── TIMELINE / ROADMAP ────────────────────────────────────────────────────
  } else if (slide.layout === 'timeline' && slide.timelineItems?.length) {
    sl.background = { color: C.paper };
    const startY = addActionTitle(sl, slide.title, slide.eyebrow, dispFnt);

    const items    = slide.timelineItems;
    const itemW    = CW / items.length;
    const trackY   = startY + 1.10;  // horizontal track centre

    // Track line
    sl.addShape(pres.ShapeType.rect, {
      x: ML, y: trackY - 0.03, w: CW, h: 0.06,
      fill: { color: C.line }, line: { color: C.line, width: 0 },
    });

    items.forEach((item, i) => {
      const cx = ML + i * itemW + itemW / 2;

      // Phase dot
      sl.addShape(pres.ShapeType.ellipse, {
        x: cx - 0.14, y: trackY - 0.14, w: 0.28, h: 0.28,
        fill: { color: accent }, line: { color: C.white, width: 1.5 },
      });
      // Marker (above track)
      sl.addText(item.marker, {
        x: cx - itemW / 2 + 0.05, y: trackY - 0.70, w: itemW - 0.10, h: 0.28,
        fontFace: FONT_BODY, fontSize: 9, bold: true,
        color: accent, align: 'center', valign: 'middle', margin: 0,
      });
      // Item title (below track)
      sl.addText(item.title, {
        x: cx - itemW / 2 + 0.05, y: trackY + 0.24, w: itemW - 0.10, h: 0.42,
        fontFace: FONT_BODY, fontSize: 10, bold: true,
        color: C.ink, align: 'center', valign: 'middle', margin: 0,
      });
      // Item body
      const bodyBottom = safeBottom(hasSoWhat, hasSource);
      sl.addText(item.body, {
        x: cx - itemW / 2 + 0.05, y: trackY + 0.70, w: itemW - 0.10,
        h: bodyBottom - (trackY + 0.70),
        fontFace: FONT_BODY, fontSize: 9, color: C.inkMuted,
        align: 'center', valign: 'top', margin: 0,
      });
    });

    if (hasSoWhat) addSoWhatCallout(sl, pres, slide.soWhat!, ML, soWhatY(hasSource), CW);
    if (hasSource)  addSourceNote(sl, slide.sourceNote!);
    addFooter(sl, deck, index, total);

  // ── ICON-GRID ─────────────────────────────────────────────────────────────
  } else if (slide.layout === 'icon-grid' && slide.icons?.length) {
    sl.background = { color: C.paper };
    const startY = addActionTitle(sl, slide.title, slide.eyebrow, dispFnt);

    const icons = slide.icons;
    const cols  = icons.length <= 3 ? icons.length : Math.ceil(icons.length / 2);
    const rows  = Math.ceil(icons.length / cols);
    const gap   = 0.14;
    const iw    = (CW - gap * (cols - 1)) / cols;
    const ih    = (safeBottom(false, false) - startY - 0.10 - gap * (rows - 1)) / rows;

    icons.forEach((icon, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ix  = ML + col * (iw + gap);
      const iy  = startY + 0.10 + row * (ih + gap);

      sl.addShape(pres.ShapeType.rect, {
        x: ix, y: iy, w: iw, h: ih,
        fill: { color: C.paperSoft },
        line: { color: C.line, width: 0.5 },
      });
      sl.addText(icon.emoji, {
        x: ix, y: iy + 0.14, w: iw, h: 0.46,
        fontFace: FONT_BODY, fontSize: 22, align: 'center',
        valign: 'middle', margin: 0,
      });
      sl.addText(icon.title, {
        x: ix + 0.10, y: iy + 0.64, w: iw - 0.20, h: 0.34,
        fontFace: FONT_BODY, fontSize: 10, bold: true,
        color: C.ink, align: 'center', valign: 'middle', margin: 0,
      });
      sl.addText(icon.body, {
        x: ix + 0.10, y: iy + 1.02, w: iw - 0.20, h: ih - 1.14,
        fontFace: FONT_BODY, fontSize: 9, color: C.inkMuted,
        align: 'center', valign: 'top', margin: 0,
      });
    });

    addFooter(sl, deck, index, total);

  // ── COMPARISON ────────────────────────────────────────────────────────────
  } else if (slide.layout === 'comparison') {
    sl.background = { color: C.paper };
    const startY = addActionTitle(sl, slide.title, slide.eyebrow, dispFnt);

    const colH = safeBottom(false, false) - startY;
    const cw2  = (CW - 0.18) / 2;

    [
      { x: ML,          title: slide.leftTitle,  content: slide.leftContent,  winner: false },
      { x: ML + cw2 + 0.18, title: slide.rightTitle, content: slide.rightContent, winner: true  },
    ].forEach((col) => {
      // Column background
      sl.addShape(pres.ShapeType.rect, {
        x: col.x, y: startY, w: cw2, h: colH,
        fill: { color: col.winner ? C.highlightFill : C.paperSoft },
        line: { color: col.winner ? accent : C.line, width: col.winner ? 1.5 : 0.5 },
      });
      // Column header bar
      if (col.title) {
        sl.addShape(pres.ShapeType.rect, {
          x: col.x, y: startY, w: cw2, h: 0.36,
          fill: { color: col.winner ? accent : C.navy },
          line: { color: col.winner ? accent : C.navy, width: 0 },
        });
        sl.addText(col.title, {
          x: col.x + 0.12, y: startY + 0.02, w: cw2 - 0.24, h: 0.32,
          fontFace: FONT_BODY, fontSize: 10, bold: true, color: C.white,
          valign: 'middle', margin: 0,
        });
      }
      // Column content
      sl.addText(col.content ?? '', {
        x: col.x + 0.14, y: startY + 0.44, w: cw2 - 0.28, h: colH - 0.52,
        fontFace: FONT_BODY, fontSize: 10, color: C.ink,
        valign: 'top', margin: 0,
      });
    });

    addFooter(sl, deck, index, total);

  // ── IMAGE-LEFT / EXHIBIT ──────────────────────────────────────────────────
  } else if (slide.layout === 'image-left') {
    sl.background = { color: C.paper };
    const startY   = addActionTitle(sl, slide.title, slide.eyebrow, dispFnt);
    const exhW     = 4.80;
    const exhH     = safeBottom(hasSoWhat, hasSource) - startY - 0.08;

    // Exhibit: native chart or placeholder
    if (slide.chart) {
      addNativeChart(sl, pres, slide.chart, ML, startY + 0.08, exhW, exhH, accent);
    } else {
      sl.addShape(pres.ShapeType.rect, {
        x: ML, y: startY + 0.08, w: exhW, h: exhH,
        fill: { color: C.paperSoft },
        line: { color: C.line, width: 0.75 },
      });
      sl.addText(slide.imagePrompt || slide.leftContent || 'Image / chart exhibit', {
        x: ML + 0.18, y: startY + 0.08 + 0.20, w: exhW - 0.36, h: exhH - 0.40,
        fontFace: FONT_BODY, fontSize: 10, color: C.inkMuted,
        italic: true, valign: 'middle', align: 'center',
      });
    }

    // Right content
    const rightX = ML + exhW + 0.18;
    const rightW = W - rightX - MR;
    if (slide.rightContent) {
      sl.addText(slide.rightContent, {
        x: rightX, y: startY + 0.08, w: rightW, h: exhH,
        fontFace: FONT_BODY, fontSize: 11, color: C.ink,
        valign: 'top', margin: 0,
      });
    }

    if (hasSoWhat) addSoWhatCallout(sl, pres, slide.soWhat!, ML, soWhatY(hasSource), CW);
    if (hasSource)  addSourceNote(sl, slide.sourceNote!);
    addFooter(sl, deck, index, total);

  // ── DEFAULT / BLANK ───────────────────────────────────────────────────────
  } else {
    sl.background = { color: slide.useDarkBg ? C.navy : C.paper };
    const textColor = slide.useDarkBg ? C.white : C.ink;
    let curY = addActionTitle(sl, slide.title, slide.eyebrow, dispFnt);
    curY += 0.10;

    const contentBottom = safeBottom(hasSoWhat, hasSource);

    if (slide.body) {
      const bodyH = Math.min(0.70, contentBottom - curY - (slide.bullets?.length ? 1.4 : 0));
      sl.addText(slide.body, {
        x: ML, y: curY, w: CW, h: bodyH,
        fontFace: FONT_BODY, fontSize: 14, color: textColor,
        valign: 'top', margin: 0,
      });
      curY += bodyH + 0.06;
    }

    if (slide.bullets?.length) {
      const bulletH = contentBottom - curY;
      const items = slide.bullets.map((b, idx) => ({
        text: b,
        options: {
          bullet: { code: '2022' },
          breakLine: idx < slide.bullets!.length - 1,
          fontSize: 12, color: textColor, fontFace: FONT_BODY,
          paraSpaceAfter: 5,
        },
      }));
      sl.addText(items, {
        x: ML + 0.20, y: curY, w: CW - 0.20, h: bulletH,
        margin: 0, valign: 'top',
      });
    }

    if (slide.callout) {
      const calloutY = contentBottom - 0.46;
      sl.addShape(pres.ShapeType.rect, {
        x: ML, y: calloutY, w: CW, h: 0.44,
        fill: { color: C.soWhatBg },
        line: { color: C.soWhatBorder, width: 1.5 },
      });
      sl.addText(slide.callout, {
        x: ML + 0.14, y: calloutY + 0.02, w: CW - 0.28, h: 0.40,
        fontFace: FONT_BODY, fontSize: 10, bold: true,
        color: C.highlightText, valign: 'middle', margin: 0,
      });
    }

    if (hasSoWhat) addSoWhatCallout(sl, pres, slide.soWhat!, ML, soWhatY(hasSource), CW);
    if (hasSource)  addSourceNote(sl, slide.sourceNote!);
    addFooter(sl, deck, index, total);
  }

  // Speaker notes
  if (slide.speakerNotes) {
    sl.addNotes(slide.speakerNotes);
  }
}

// ─── Public export ────────────────────────────────────────────────────────────

export async function exportToPptx(deck: Deck, filename?: string) {
  const pres = new pptxgen();
  pres.layout  = 'LAYOUT_16x9';
  pres.title   = deck.title;
  pres.author  = 'SlideAI · Apparel Group';
  pres.company = 'Apparel Group';
  pres.subject = deck.title;

  deck.slides.forEach((slide, i) =>
    addSlide(pres, slide, deck, i, deck.slides.length),
  );

  await pres.writeFile({ fileName: filename ?? safeFilename(deck.title) });
}
