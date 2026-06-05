/** Command Centre data refresh — 08:00 & 22:00 GST (Asia/Dubai, UTC+4) */
export const GST_TIMEZONE = 'Asia/Dubai';
export const GST_UTC_OFFSET_MINUTES = 240;

export const DATA_REFRESH_SLOTS = [
  { id: 'morning' as const, hour: 8, minute: 0 },
  { id: 'evening' as const, hour: 22, minute: 0 },
] as const;

export type DataRefreshSlotId = (typeof DATA_REFRESH_SLOTS)[number]['id'];

export const DATA_REFRESH_SCHEDULE_LABEL = {
  en: 'Refreshes daily at 08:00 & 22:00 GST',
  ar: 'يُحدَّث يومياً الساعة 08:00 و22:00 بتوقيت الإمارات',
};

export const AUTO_REFRESH_STORAGE_KEY = 'adgm-executive-auto-refresh-slots';

export function gstNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + (now.getTimezoneOffset() + GST_UTC_OFFSET_MINUTES) * 60_000);
}

export function gstDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function slotStorageKey(dateKey: string, slot: DataRefreshSlotId): string {
  return `${dateKey}-${slot}`;
}

/** Active data cycle between scheduled refreshes */
export function dataCycleForGstTime(now = gstNow()): DataRefreshSlotId {
  const h = now.getHours();
  if (h >= 22 || h < 8) return 'evening';
  return 'morning';
}

export function minutesSinceMidnightGst(now = gstNow()): number {
  return now.getHours() * 60 + now.getMinutes();
}

export function loadAutoRefreshSlots(): Record<string, string> {
  try {
    const raw = localStorage.getItem(AUTO_REFRESH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function saveAutoRefreshSlots(slots: Record<string, string>) {
  localStorage.setItem(AUTO_REFRESH_STORAGE_KEY, JSON.stringify(slots));
}

/** Slots at or before current GST time that have not been refreshed today */
export function getPendingRefreshSlots(
  completed: Record<string, string>,
  now = gstNow(),
): DataRefreshSlotId[] {
  const dateKey = gstDateKey(now);
  const mins = minutesSinceMidnightGst(now);
  const pending: DataRefreshSlotId[] = [];

  for (const slot of DATA_REFRESH_SLOTS) {
    const threshold = slot.hour * 60 + slot.minute;
    if (mins >= threshold) {
      const key = slotStorageKey(dateKey, slot.id);
      if (!completed[key]) pending.push(slot.id);
    }
  }
  return pending;
}

export function markSlotsCompleted(
  completed: Record<string, string>,
  slotIds: DataRefreshSlotId[],
  now = gstNow(),
): Record<string, string> {
  const dateKey = gstDateKey(now);
  const next = { ...completed };
  const stamp = new Date().toISOString();
  for (const id of slotIds) {
    next[slotStorageKey(dateKey, id)] = stamp;
  }
  return next;
}

export function isExecutiveDataStaleForGstDay(lastSyncIso: string, now = gstNow()): boolean {
  try {
    const last = new Date(lastSyncIso);
    const lastGst = new Date(last.getTime() + (last.getTimezoneOffset() + GST_UTC_OFFSET_MINUTES) * 60_000);
    return gstDateKey(lastGst) !== gstDateKey(now);
  } catch {
    return true;
  }
}

export function formatRefreshSlotToast(slot: DataRefreshSlotId, ar: boolean): string {
  if (slot === 'morning') {
    return ar ? 'تم تحديث البيانات · 08:00 بتوقيت الإمارات' : 'Data updated · scheduled 08:00 GST refresh';
  }
  return ar ? 'تم تحديث البيانات · 22:00 بتوقيت الإمارات' : 'Data updated · scheduled 22:00 GST refresh';
}
