"use client";

import { useEffect } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { fetchHostSessions, watchHostSessions } from "@/lib/questions";
import type { SessionState } from "@/lib/types";

const hostSessionsKey = (hostUid: string) => ["hostSessions", hostUid] as const;

export function useHostSessions(hostUid: string) {
  const queryClient = useQueryClient();

  const { data: sessions, isFetching } = useSuspenseQuery<SessionState[]>({
    queryKey: hostSessionsKey(hostUid),
    queryFn: () => fetchHostSessions(hostUid)
  });

  useEffect(() => {
    if (!hostUid) return;
    return watchHostSessions(
      value => queryClient.setQueryData(hostSessionsKey(hostUid), value),
      hostUid,
      () => queryClient.invalidateQueries({ queryKey: hostSessionsKey(hostUid) })
    );
  }, [hostUid, queryClient]);

  return {
    sessions,
    isFetching
  };
}

