/** Parse user text into deck creation parameters */

export type ParsedDeckRequest = {
  topic: string;
  slideCount: number;
  audience: string | null;
  deckKind: 'board' | 'investor' | 'strategy' | 'regulatory' | 'general';
};

const SLIDE_COUNT_RE = /(\d+)\s*[-\s]?(?:slide|page|شرائح?)/i;
const AUDIENCE_RE = /(?:for|to)\s+(?:the\s+)?([^.,\n]{4,60})/i;

export function userRequestsNewDeck(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (/^(create|build|make|generate|draft|design)\b/.test(t)) return true;
  if (/\bnew\s+deck\b|\bfrom\s+scratch\b|\bstart\s+over\b|\brebuild\b/.test(t)) return true;
  if (SLIDE_COUNT_RE.test(t) && /\b(create|build|make|generate)\b/.test(t)) return true;
  return false;
}

function inferDeckKind(text: string): ParsedDeckRequest['deckKind'] {
  const lower = text.toLowerCase();
  if (/investor|fund|vc|capital\s*raise/.test(lower)) return 'investor';
  if (/fsra|regulat|compliance|legal/.test(lower)) return 'regulatory';
  if (/board|csO|executive\s+committee/.test(lower)) return 'board';
  if (/strategy|roadmap|falcon|digital\s*asset/.test(lower)) return 'strategy';
  return 'general';
}

function stripPromptBoilerplate(text: string): string {
  return text
    .replace(
      /^(please\s+)?(create|build|make|generate|draft|design)\s+(a|an|me\s+)?/i,
      '',
    )
    .replace(/\b(use\s+command\s+centre\s+context|with\s+claude\s+design|mckinsey[- ]style|adgm\s+brand)\b/gi, '')
    .replace(SLIDE_COUNT_RE, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseDeckRequest(text: string): ParsedDeckRequest {
  const slideMatch = text.match(SLIDE_COUNT_RE);
  const slideCount = slideMatch
    ? Math.min(20, Math.max(4, parseInt(slideMatch[1], 10)))
    : 8;
  const audienceMatch = text.match(AUDIENCE_RE);
  const topic = stripPromptBoilerplate(text).slice(0, 120) || 'Executive briefing';
  return {
    topic,
    slideCount,
    audience: audienceMatch?.[1]?.trim() ?? null,
    deckKind: inferDeckKind(text),
  };
}
