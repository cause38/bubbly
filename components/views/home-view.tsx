"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarClock,
  KeyRound,
  Link2,
  LogIn,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSession } from "@/lib/questions";
import { signInWithGoogle, signOutUser } from "@/lib/firebase";
import { useSessionStore } from "@/lib/stores/session-store";
import { toast } from "sonner";
import type { SessionState } from "@/lib/types";
import { useHostSessions } from "@/hooks/useHostSessions";

export function HomeView() {
  const router = useRouter();
  const { user } = useSessionStore((state) => ({
    user: state.user,
  }));
  const [joinCode, setJoinCode] = useState("");
  const [title, setTitle] = useState("");

  const createSessionMutation = useMutation<SessionState>({
    mutationFn: async () => {
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      if (!title.trim()) {
        throw new Error("세션 제목을 입력해주세요.");
      }
      return createSession(
        {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
        },
        title.trim()
      );
    },
    onSuccess: (session: SessionState) => {
      toast.success("새로운 방이 생성되었습니다!");
      setTitle("");
      router.push(`/room/${session.code}`);
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("방 생성에 실패했습니다.");
      }
    },
  });

  const handleCreateSession = () => {
    if (!user) {
      toast.error("먼저 진행자 계정으로 로그인해주세요.");
      return;
    }
    if (!title.trim()) {
      toast.error("세션 제목을 입력해주세요.");
      return;
    }
    createSessionMutation.mutate();
  };

  const handleJoin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      toast.error("참여할 방 코드를 입력해주세요.");
      return;
    }
    router.push(`/room/${code}`);
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success("로그인 되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("로그인에 실패했습니다.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      toast.success("로그아웃 되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("로그아웃에 실패했습니다.");
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 px-4 py-16">
      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <div className="flex items-center gap-2 text-slate-200">
            <PlusCircle className="h-5 w-5 text-brand" />
            <h2 className="text-xl font-semibold">새 방 만들기</h2>
          </div>
          <p className="text-sm text-slate-400">
            진행자는 Google 계정으로 로그인 후 새로운 Q&A 방을 만들고, 링크를
            참가자와 공유할 수 있습니다.
          </p>

          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400">
                세션 제목
              </span>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="예: 3월 전체 미팅 Q&A"
              />
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
              <p className="font-medium">진행자 로그인</p>
              {user ? (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400">
                    {user.displayName ?? user.email ?? "로그인됨"}
                  </span>
                  <Button size="sm" variant="ghost" onClick={handleSignOut}>
                    로그아웃
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSignIn}
                  className="mt-3"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Google로 로그인
                </Button>
              )}
            </div>
          </div>

          <Button
            disabled={!user || !title.trim() || createSessionMutation.isPending}
            onClick={handleCreateSession}
            className="w-full"
          >
            {createSessionMutation.isPending
              ? "방 생성 중..."
              : "새 Q&A 방 만들기"}
          </Button>

          <p className="text-xs text-slate-500">
            방을 생성한 진행자는 자동으로 방장으로 지정되며, 이후 해당
            계정으로만 질문 승인 및 반려가 가능합니다.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <div className="flex items-center gap-2 text-slate-200">
            <KeyRound className="h-5 w-5 text-brand" />
            <h2 className="text-xl font-semibold">방 코드로 참여하기</h2>
          </div>
          <p className="text-sm text-slate-400">
            공유받은 방 주소 또는 방 코드를 입력하면 바로 참여할 수 있습니다.
          </p>
          <form className="space-y-3" onSubmit={handleJoin}>
            <Input
              value={joinCode}
              onChange={(event) =>
                setJoinCode(event.target.value.toUpperCase())
              }
              placeholder="방 코드를 입력하세요 (예: ABC123)"
              maxLength={12}
            />
            <Button type="submit" className="w-full" variant="secondary">
              <ArrowRight className="mr-2 h-4 w-4" />
              참여하기
            </Button>
          </form>
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-300">
              <Link2 className="h-4 w-4 text-brand" />방 링크 예시
            </div>
            <p className="mt-2 break-all font-mono text-slate-500">
              https://your-site.com/room/ABC123
            </p>
          </div>
        </div>
      </section>

      {user ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">내가 만든 방</h2>
          <Suspense fallback={<HostSessionsSkeleton />}>
            <HostSessionsList hostUid={user.uid} />
          </Suspense>
        </section>
      ) : null}
    </div>
  );
}

function HostSessionsList({ hostUid }: { hostUid: string }) {
  const { sessions, isFetching } = useHostSessions(hostUid);

  if (!sessions.length && !isFetching) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-300">
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
            className="flex flex-col justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:flex-row sm:items-center"
          >
            <div>
              <div className="text-lg font-semibold text-white">
                {session.title}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                코드: {session.code}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
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
              onClick={() => window.open(`/room/${session.code}`, "_blank")}
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
          className="h-20 animate-pulse rounded-xl border border-slate-800 bg-slate-900/40"
        />
      ))}
    </div>
  );
}
