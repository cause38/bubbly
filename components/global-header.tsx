"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, LogOut, Menu, PlusCircle, User } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  SessionTitleInput,
  DateRangeInputs,
} from "@/components/session-form-inputs";
import { signInWithGoogle, signOutUser } from "@/lib/firebase";
import { createSession } from "@/lib/questions";
import { useSessionStore } from "@/lib/stores/session-store";
import { toast } from "sonner";
import type { SessionState } from "@/lib/types";

export function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, sessionTitle, isRoomDrawerOpen, setRoomDrawerOpen } =
    useSessionStore((state) => ({
      user: state.user,
      sessionTitle: state.sessionTitle,
      isRoomDrawerOpen: state.isRoomDrawerOpen,
      setRoomDrawerOpen: state.setRoomDrawerOpen,
    }));
  const inRoom = pathname.startsWith("/room/");
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setIsPopoverOpen(false);
      await signInWithGoogle();
      toast.success("로그인 되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      setIsPopoverOpen(false);
      await signOutUser();
      toast.success("로그아웃 되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("로그아웃에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const createSessionMutation = useMutation<SessionState>({
    mutationFn: async () => {
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      if (!title.trim()) {
        throw new Error("세션 제목을 입력해주세요.");
      }
      if (!startDate || !endDate) {
        throw new Error("시작 날짜와 종료 날짜는 필수입니다.");
      }
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      if (start > end) {
        throw new Error("시작 날짜가 종료 날짜보다 늦을 수 없습니다.");
      }
      return createSession(
        {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
        },
        title.trim(),
        undefined,
        start,
        end
      );
    },
    onSuccess: (session: SessionState) => {
      toast.success("새로운 방이 생성되었습니다!");
      setTitle("");
      setStartDate("");
      setEndDate("");
      setIsCreateModalOpen(false);
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

  const handleOpenCreateModal = () => {
    if (!user) {
      toast.error("먼저 로그인해주세요.");
      handleSignIn();
      return;
    }
    setIsPopoverOpen(false);
    setIsCreateModalOpen(true);
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        {inRoom && (
          <button
            type="button"
            aria-label="방 메뉴 토글"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-black/40 text-slate-200 hover:border-white/40 hover:text-white"
            onClick={() => setRoomDrawerOpen(!isRoomDrawerOpen)}
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          Bubbly
        </Link>
        {inRoom && sessionTitle ? (
          <span className="ml-2 max-w-[160px] truncate text-sm text-slate-200/80 sm:max-w-xs">
            {sessionTitle}
          </span>
        ) : null}
      </div>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-9 rounded-full p-0 text-slate-200 hover:text-white"
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="sr-only">사용자 메뉴</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" align="end">
          {user ? (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs text-slate-400">
                {user.displayName ?? user.email ?? "로그인됨"}
              </div>
              <Separator />
              <button
                onClick={() => {
                  handleOpenCreateModal();
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                <PlusCircle className="h-4 w-4" />방 만들기
              </button>
              <button
                onClick={() => {
                  handleSignOut();
                }}
                disabled={loading}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </button>
            </div>
          ) : (
            <div className="p-1">
              <button
                onClick={() => {
                  handleSignIn();
                }}
                disabled={loading}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                로그인
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 방 만들기</DialogTitle>
            <DialogDescription>
              방을 생성한 진행자는 자동으로 방장으로 지정되며, 이후 해당
              계정으로만 질문 승인 및 반려가 가능합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <DateRangeInputs
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              defaultStartDate=""
              required
            />
            <SessionTitleInput
              value={title}
              onChange={setTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter" && title.trim()) {
                  handleCreateSession();
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreateModalOpen(false);
                setTitle("");
                setStartDate("");
                setEndDate("");
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleCreateSession}
              disabled={
                !title.trim() ||
                !startDate ||
                !endDate ||
                createSessionMutation.isPending
              }
            >
              {createSessionMutation.isPending ? "방 생성 중..." : "방 만들기"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
