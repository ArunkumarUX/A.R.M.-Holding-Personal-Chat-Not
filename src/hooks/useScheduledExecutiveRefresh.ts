import { useEffect, useRef } from 'react';
import {
  dataCycleForGstTime,
  formatRefreshSlotToast,
  getPendingRefreshSlots,
  gstNow,
  isExecutiveDataStaleForGstDay,
  loadAutoRefreshSlots,
  markSlotsCompleted,
  saveAutoRefreshSlots,
  type DataRefreshSlotId,
} from '../config/dataRefreshSchedule';

export type ExecutiveRefreshOptions = {
  silent?: boolean;
  cycle?: DataRefreshSlotId;
  scheduledSlot?: DataRefreshSlotId;
};

type RefreshFn = (options?: ExecutiveRefreshOptions) => Promise<void>;

/**
 * Runs Command Centre data refresh at 08:00 & 22:00 GST (checks every minute).
 * Catches up on load if a scheduled refresh was missed.
 */
export function useScheduledExecutiveRefresh(
  refresh: RefreshFn,
  isRefreshing: boolean,
  lastSyncIso: string,
  language: 'en' | 'ar',
) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const runningRef = useRef(false);

  useEffect(() => {
    const run = async (forceCycle?: DataRefreshSlotId) => {
      if (runningRef.current || isRefreshing) return;

      const completed = loadAutoRefreshSlots();
      const pending = getPendingRefreshSlots(completed);
      const staleDay = isExecutiveDataStaleForGstDay(lastSyncIso);
      const cycle = forceCycle ?? pending[pending.length - 1] ?? dataCycleForGstTime();

      if (!forceCycle && pending.length === 0 && !staleDay) return;

      runningRef.current = true;
      try {
        const slot = forceCycle ?? pending[pending.length - 1];
        await refreshRef.current({
          silent: false,
          cycle,
          scheduledSlot: slot,
        });

        const toMark: DataRefreshSlotId[] =
          pending.length > 0 ? pending : staleDay ? [dataCycleForGstTime()] : [];
        if (toMark.length) {
          saveAutoRefreshSlots(markSlotsCompleted(completed, toMark));
        }
      } catch {
        /* refresh fn handles fallback */
      } finally {
        runningRef.current = false;
      }
    };

    void run();

    const tick = () => {
      const now = gstNow();
      const mins = now.getHours() * 60 + now.getMinutes();
      const isMorningWindow = mins >= 8 * 60 && mins < 8 * 60 + 5;
      const isEveningWindow = mins >= 22 * 60 && mins < 22 * 60 + 5;
      if (isMorningWindow) void run('morning');
      else if (isEveningWindow) void run('evening');
      else {
        const pending = getPendingRefreshSlots(loadAutoRefreshSlots());
        if (pending.length) void run();
      }
    };

    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [isRefreshing, lastSyncIso, language]);
}

export { formatRefreshSlotToast };
