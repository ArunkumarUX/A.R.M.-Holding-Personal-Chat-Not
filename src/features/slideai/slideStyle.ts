import type { DeckTheme, Slide } from './slideTypes';

export type ResolvedSlideStyle = {
  cssVars: Record<string, string>;
  titleColor: string;
  isDark: boolean;
};

function hexCss(value?: string, fallback = '#ffffff'): string {
  if (!value?.trim()) return fallback;
  const v = value.trim();
  return v.startsWith('#') ? v : `#${v}`;
}

/** Resolve preview colours from slide + deck theme (chat updates apply here) */
export function resolveSlideStyle(slide: Slide, deckTheme: DeckTheme): ResolvedSlideStyle {
  const isDark = slide.layout === 'title' || slide.useDarkBg === true;
  const bg =
    slide.theme?.bg ??
    (isDark ? deckTheme.darkBg ?? deckTheme.bg : deckTheme.bg);
  const text =
    slide.theme?.text ??
    (isDark ? 'FFFFFF' : deckTheme.text);
  const accent = slide.theme?.accent ?? deckTheme.accent;

  const titleColor = hexCss(
    slide.titleColor ?? slide.theme?.text ?? text,
    isDark ? '#ffffff' : '#152a44',
  );

  return {
    isDark,
    titleColor,
    cssVars: {
      '--slide-bg': hexCss(bg, isDark ? '#1a2332' : '#ffffff'),
      '--slide-text': hexCss(text, isDark ? '#ffffff' : '#1a2332'),
      '--slide-title-text': titleColor,
      '--slide-accent': hexCss(accent, '#0087FF'),
      '--slide-accent-light': hexCss(
        slide.theme?.accent ?? deckTheme.secondaryAccent ?? accent,
        '#33a0ff',
      ),
    },
  };
}

export function mergeSlideTheme(
  existing: Slide['theme'],
  incoming: Slide['theme'] | undefined,
): Slide['theme'] | undefined {
  if (!incoming) return existing;
  if (!existing) return incoming;
  return { ...existing, ...incoming };
}

/** Drop null/undefined so agent patches do not wipe existing slide fields */
function omitEmptyPatchFields(patch: Slide): Partial<Slide> {
  const out: Partial<Slide> = {};
  for (const [key, value] of Object.entries(patch) as [keyof Slide, Slide[keyof Slide]][]) {
    if (value !== null && value !== undefined) {
      (out as Record<string, Slide[keyof Slide]>)[key] = value;
    }
  }
  return out;
}

export function mergeSlidePatch(existing: Slide, patch: Slide): Slide {
  const clean = omitEmptyPatchFields(patch);
  return {
    ...existing,
    ...clean,
    id: existing.id,
    title: clean.title?.trim() ? clean.title.trim() : existing.title,
    titleColor: clean.titleColor ?? existing.titleColor,
    theme: mergeSlideTheme(existing.theme, clean.theme ?? patch.theme ?? undefined),
  };
}

/** Include colour tokens so preview keys change on style-only edits */
export function slideStyleToken(slide: Slide): string {
  return [
    slide.theme?.bg,
    slide.theme?.text,
    slide.theme?.accent,
    slide.titleColor,
    slide.useDarkBg ? 'dark' : 'light',
  ]
    .filter(Boolean)
    .join(':');
}
