/** GST time-of-day greetings (mirrors src/utils/gstGreeting.ts) */
export const GST_TIMEZONE = 'Asia/Dubai';
const MORNING_END = 12;
const AFTERNOON_END = 17;

export function gstHour(at = new Date()) {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: GST_TIMEZONE,
      hour: 'numeric',
      hour12: false,
    }).format(at),
  );
}

export function greetingPeriodForGst(at = new Date()) {
  const h = gstHour(at);
  if (h < MORNING_END) return 'morning';
  if (h < AFTERNOON_END) return 'afternoon';
  return 'evening';
}

export function greetingForGstTime(lang = 'en', at = new Date()) {
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

export function formatGstClock(at = new Date()) {
  return at.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: GST_TIMEZONE,
  });
}
