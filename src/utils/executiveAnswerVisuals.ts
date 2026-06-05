/**
 * Visual, layman-friendly answer blocks — numbers must come from ExecutiveState only.
 */

export function scoreBar(score: number, max = 100, width = 10): string {
  const pct = Math.min(1, Math.max(0, score / max));
  const filled = Math.round(pct * width);
  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)} **${score}/${max}**`;
}

export function signalEmoji(level: 'good' | 'watch' | 'risk'): string {
  if (level === 'good') return '🟢';
  if (level === 'watch') return '🟡';
  return '🔴';
}

/** One-line plain-English summary (blockquote) */
export function plainTerms(line: string): string {
  return `> **In plain terms:** ${line}\n`;
}

/** Short “what to do” callout */
export function actionNow(line: string): string {
  return `${signalEmoji('risk')} **Do this:** ${line}\n`;
}

export function metricTable(headers: [string, string, string], rows: [string, string, string][]): string {
  const esc = (s: string) => s.replace(/\|/g, '/');
  let out = `| ${headers.map(esc).join(' | ')} |\n|${headers.map(() => '---').join('|')}|\n`;
  for (const row of rows) {
    out += `| ${row.map(esc).join(' | ')} |\n`;
  }
  return out;
}

export function vizMetrics(lines: { label: string; bar?: string; note?: string }[]): string {
  return lines
    .map((l) => {
      const bar = l.bar ? `\n${l.bar}` : '';
      const note = l.note ? ` — ${l.note}` : '';
      return `**${l.label}**${bar}${note}`;
    })
    .join('\n\n');
}

export function agentTag(agents: string[]): string {
  return `\n*Agents: ${agents.join(' · ')} · Sources: approved institutional records*`;
}
