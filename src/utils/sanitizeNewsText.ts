/** Strip RSS/HTML noise and redirect URLs from news excerpts for plain-text UI. */
export function sanitizeNewsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<a[^>]*>/gi, ' ')
    .replace(/<\/a>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/<[^>]*$/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isUsableExcerpt(excerpt: string, title: string): boolean {
  if (!excerpt || excerpt.length < 12) return false;
  if (excerpt === title) return false;
  if (/^href=/i.test(excerpt)) return false;
  if (/news\.google\.com/i.test(excerpt)) return false;
  if (/^<a\b/i.test(excerpt)) return false;
  return true;
}

/** Prefer a readable excerpt; fall back to title when RSS HTML leaked through. */
export function plainNewsText(excerpt: string | undefined, title: string, fallback = ''): string {
  const cleanTitle = sanitizeNewsText(title);
  const cleanExcerpt = sanitizeNewsText(excerpt ?? '');
  const text = isUsableExcerpt(cleanExcerpt, cleanTitle) ? cleanExcerpt : cleanTitle || fallback;
  return text.length > 220 ? `${text.slice(0, 217).trim()}…` : text;
}
