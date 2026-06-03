import type { PresentationDeck, PresentationOutline } from '../api/presentationBuilder';
import { PPT_MASTER_CURSOR_PROMPT } from './exportDeckSource';

export function buildPresentationMarkdown(
  deck: PresentationDeck,
  outline?: PresentationOutline | null,
  options?: { includeSpeakerNotes?: boolean },
): string {
  const notes = options?.includeSpeakerNotes !== false;
  const lines: string[] = [
    `# ${deck.title}`,
    ``,
    `**Theme:** ${deck.theme} · **ADGM executive / McKinsey-style** · 16:9`,
    ``,
  ];

  if (outline?.storyline) {
    lines.push(`**Storyline:** ${outline.storyline}`, ``);
  }

  if (deck.brandCheck?.length) {
    lines.push(`## Brand consistency`, ...deck.brandCheck.map((b) => `- ${b}`), ``);
  }

  deck.slides.forEach((s, i) => {
    lines.push(`## Slide ${i + 1}: ${s.title}`, `*Type: ${s.type}*`, ``);
    if (s.bullets?.length) {
      lines.push(...s.bullets.map((b) => `- ${b}`), ``);
    }
    if (s.metrics?.length) {
      lines.push(`| Metric | Value |`, `|--------|-------|`, ...s.metrics.map((m) => `| ${m.label} | ${m.value} |`), ``);
    }
    if (s.visualHint) lines.push(`**Visual:** ${s.visualHint}`, ``);
    if (notes && s.speakerNotes) lines.push(`**Speaker notes:** ${s.speakerNotes}`, ``);
  });

  lines.push(
    `---`,
    `Generate native editable PPTX via PPT Master. Navy #00092a, accent #0087ff.`,
    ``,
  );
  return lines.join('\n');
}

export function downloadTextFile(content: string, filename: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadDeckJson(deck: PresentationDeck) {
  downloadTextFile(JSON.stringify(deck, null, 2), 'adgm-presentation-deck.json', 'application/json');
}

export function downloadDeckMarkdown(deck: PresentationDeck, outline?: PresentationOutline | null, speakerNotes = true) {
  downloadTextFile(
    buildPresentationMarkdown(deck, outline, { includeSpeakerNotes: speakerNotes }),
    'adgm-presentation-deck.md',
    'text/markdown;charset=utf-8',
  );
}

export function printDeckPdfPreview() {
  window.print();
}

export { PPT_MASTER_CURSOR_PROMPT };
