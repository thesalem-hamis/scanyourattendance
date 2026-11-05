import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { attendanceKeys, useAttendanceByDate } from '@/features/attendance';
import { todayInLagos } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

/**
 * Today's check-ins, kept live. Supabase Realtime tells us when anyone checks in
 * (on any phone) and we refetch; a slow poll is the safety net if the live
 * connection drops. Rolls over by itself if the page stays open past midnight.
 */
export function useTodayFeed() {
  const queryClient = useQueryClient();
  const [today, setToday] = useState(() => todayInLagos());

  useEffect(() => {
    const timer = setInterval(() => setToday(todayInLagos()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const query = useAttendanceByDate(today, { refetchIntervalMs: 20_000 });

  useEffect(() => {
    const channel = supabase
      .channel('attendance-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        void queryClient.invalidateQueries({ queryKey: attendanceKeys.byDate(today) });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, today]);

  return { ...query, today };
}