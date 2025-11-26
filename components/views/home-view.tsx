"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHostSessions } from "@/hooks/useHostSessions";
import { useSessionStore } from "@/lib/stores/session-store";
import { ArrowRight, CalendarClock, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

export function HomeView() {
  const router = useRouter();
  const { user } = useSessionStore((state) => ({
    user: state.user,
  }));
  const [joinCode, setJoinCode] = useState("");

  const handleJoin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      toast.error("참여할 방 코드를 입력해주세요.");
      return;
    }
    router.push(`/room/${code}`);
  };

  return (
    <div className="mx-auto flex h-full overflow-y-auto items-center justify-center w-full max-w-lg flex-col gap-10 px-4">
      <section className="grid gap-6 w-full">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-200">
            <KeyRound className="h-5 w-5 text-brand" />
            <h2 className="text-xl font-semibold">방 코드로 참여하기</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            공유받은 방 주소 또는 방 코드를 입력하면 바로 참여할 수 있습니다.
          </p>
          <form className="space-y-3" onSubmit={handleJoin}>
            <Input
              value={joinCode}
              onChange={(event) =>
                setJoinCode(event.target.value.toUpperCase())
              }
              placeholder="방 코드를 입력하세요 (예: ABC123)"
              className="text-base"
              maxLength={12}
            />
            <Button type="submit" className="w-full" variant="secondary">
              <ArrowRight className="mr-2 h-4 w-4" />
              참여하기
            </Button>
          </form>
        </div>
      </section>

      {user ? (
        <section className="space-y-4 w-full">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white pl-2">
            내가 만든 방
          </h2>
          <Suspense fallback={<HostSessionsSkeleton />}>
            <HostSessionsList hostUid={user.uid} />
          </Suspense>
        </section>
      ) : null}
    </div>
  );
}

function HostSessionsList({ hostUid }: { hostUid: string }) {
  const router = useRouter();
  const { sessions, isFetching } = useHostSessions(hostUid);

  if (!sessions.length && !isFetching) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
        아직 만든 방이 없습니다. 새로운 Q&A 방을 만들어보세요!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isFetching && !sessions.length ? (
        <HostSessionsSkeleton />
      ) : (
        sessions.map((session) => (
          <div
            key={session.code}
            className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-950/60"
          >
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white">
                {session.title}
              </div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-500">
                코드: {session.code}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CalendarClock className="h-4 w-4" />
                <span>
                  {new Date(session.createdAt).toLocaleString("ko-KR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                {session.isActive ? (
                  <span className="rounded-full border border-emerald-500 px-2 py-0.5 text-xs text-emerald-300">
                    진행 중
                  </span>
                ) : (
                  <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-400">
                    종료됨
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/room/${session.code}`)}
            >
              방으로 이동
            </Button>
          </div>
        ))
      )}
    </div>
  );
}

function HostSessionsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/40"
        />
      ))}
    </div>
  );
}
