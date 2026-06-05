import { useEffect, useMemo, useState } from 'react';
import { GST_TIMEZONE } from '../config/dataRefreshSchedule';

export type GreetingLang = 'en' | 'ar';
export type GreetingPeriod = 'morning' | 'afternoon' | 'evening';

/** Hour boundaries in GST (Asia/Dubai) — production clock */
const MORNING_END = 12;
const AFTERNOON_END = 17;

/** Current hour 0–23 in Abu Dhabi, independent of device timezone */
export function gstHour(at: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: GST_TIMEZONE,
      hour: 'numeric',
      hour12: false,
    }).format(at),
  );
}

export function greetingPeriodForGst(at: Date = new Date()): GreetingPeriod {
  const h = gstHour(at);
  if (h < MORNING_END) return 'morning';
  if (h < AFTERNOON_END) return 'afternoon';
  return 'evening';
}

export function greetingForGstTime(lang: GreetingLang = 'en', at: Date = new Date()): string {
  const period = greetingPeriodForGst(at);
  if (lang === 'ar') {
    if (period === 'morning') return 'صباح الخير';
    if (period === 'afternoon') return 'مساء الخير';
    return 'مساء الخير';
  }
  if (period === 'morning') return 'Good morning';
  if (period === 'afternoon') return 'Good afternoon';
  return 'Good evening';
}

/** @deprecated Use greetingForGstTime — kept for imports; always uses GST */
export function greetingForTime(_date = new Date(), lang: GreetingLang = 'en'): string {
  return greetingForGstTime(lang);
}

export function formatGstClock(at: Date = new Date(), lang: GreetingLang = 'en'): string {
  return at.toLocaleTimeString(lang === 'ar' ? 'ar-AE' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: GST_TIMEZONE,
  });
}

export function formatGstDate(at: Date = new Date(), lang: GreetingLang = 'en'): string {
  return at.toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: GST_TIMEZONE,
  });
}

export function briefingLabelForGst(lang: GreetingLang = 'en', at: Date = new Date()): string {
  const period = greetingPeriodForGst(at);
  if (lang === 'ar') {
    if (period === 'morning') return 'إحاطة الصباح';
    if (period === 'afternoon') return 'إحاطة بعد الظهر';
    return 'إحاطة المساء';
  }
  if (period === 'morning') return 'Open morning briefing';
  if (period === 'afternoon') return 'Open afternoon briefing';
  return 'Open evening briefing';
}

/** Chat seed / quick prompt — time-aware in GST */
export function todayCatchUpPrompt(lang: GreetingLang = 'en', at: Date = new Date()): string {
  const g = greetingForGstTime(lang, at);
  if (lang === 'ar') return `${g} — ما الذي حدث اليوم؟`;
  return `${g} — what's happened today?`;
}

/** First chip in chat suggestions — updates with GST time of day */
export function getTimeBasedChatSuggestions(
  lang: GreetingLang = 'en',
  at: Date = new Date(),
): { q: string; agents: string[] }[] {
  const ar = lang === 'ar';
  return [
    { q: todayCatchUpPrompt(lang, at), agents: ['cos'] },
    {
      q: ar
        ? 'قارن إطار الأصول الرقمية في سوق أبوظبي العالمي مع سنغافورة'
        : "Compare ADGM's digital assets framework against Singapore MAS.",
      agents: ['strategy', 'policy'],
    },
    {
      q: ar ? 'أحضّرني لاجتماع الغد الساعة 3' : 'Brief me on my 3pm meeting tomorrow.',
      agents: ['cos', 'relationship'],
    },
  ];
}

/** Live GST clock + greeting — re-renders every second (hero, chat chips) */
export function useGstLive(lang: GreetingLang = 'en') {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return useMemo(
    () => ({
      now,
      greeting: greetingForGstTime(lang, now),
      period: greetingPeriodForGst(now),
      briefingLabel: briefingLabelForGst(lang, now),
      todayPrompt: todayCatchUpPrompt(lang, now),
      suggestions: getTimeBasedChatSuggestions(lang, now),
      dateStr: formatGstDate(now, lang),
      timeStr: formatGstClock(now, lang),
    }),
    [lang, now],
  );
}
