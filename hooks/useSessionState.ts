"use client";

import { useEffect } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { fetchSession, watchSessionState } from "@/lib/questions";
import type { SessionState } from "@/lib/types";

const sessionKey = (sessionCode: string) => ["session", sessionCode] as const;

export function useSessionState(sessionCode: string) {
  const queryClient = useQueryClient();

  const { data: session } = useSuspenseQuery<SessionState | null>({
    queryKey: sessionKey(sessionCode),
    queryFn: () => fetchSession(sessionCode)
  });

  useEffect(() => {
    if (!sessionCode) return;
    return watchSessionState(
      value => queryClient.setQueryData(sessionKey(sessionCode), value),
      sessionCode,
      () => queryClient.invalidateQueries({ queryKey: sessionKey(sessionCode) })
    );
  }, [sessionCode, queryClient]);

  return {
    session
  };
}

