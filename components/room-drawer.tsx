"use client";

import { Button } from "@/components/ui/button";
import { endSession, reactivateSession } from "@/lib/questions";
import { useSessionStore } from "@/lib/stores/session-store";
import type { SessionState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit2, PlayCircle, Share2, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface RoomDrawerProps {
  session: SessionState;
  sessionCode: string;
  isOpen: boolean;
  onClose: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  shareCopied: boolean;
  onShareClick: () => void;
}

export function RoomDrawer({
  session,
  sessionCode,
  isOpen,
  onClose,
  onEditClick,
  onDeleteClick,
  shareCopied,
  onShareClick,
}: RoomDrawerProps) {
  const { user } = useSessionStore((state) => ({
    user: state.user,
  }));
  const queryClient = useQueryClient();

  const isHost = Boolean(
    session?.hostUid && user?.uid && session.hostUid === user.uid
  );

  const isBeforeEndDate = (() => {
    if (!session) return false;
    const now = Date.now();
    return now < session.endDate;
  })();

  const endSessionMutation = useMutation({
    mutationFn: () => endSession(sessionCode),
    onSuccess: () => {
      toast.success("방이 종료되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["session", sessionCode] });
    },
    onError: () => {
      toast.error("방 종료에 실패했습니다.");
    },
  });

  const reactivateSessionMutation = useMutation({
    mutationFn: () => reactivateSession(sessionCode),
    onSuccess: () => {
      toast.success("방이 다시 활성화되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["session", sessionCode] });
    },
    onError: () => {
      toast.error("방 재활성화에 실패했습니다.");
    },
  });

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity animate-in fade-in duration-200 lg:hidden dark:bg-black/40"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "max-h-[calc(100vh-61px)] overflow-y-auto fixed left-0 top-[61px] bottom-0 z-50 w-80 max-w-[80%] border-r border-slate-200 bg-white/95 px-4 py-6 shadow-xl backdrop-blur-xl transition-transform duration-300 dark:border-white/10 dark:bg-slate-950/95",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            방 상세 정보
          </h2>
          <div className="flex items-center gap-2">
            {isHost && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                onClick={onEditClick}
              >
                <Edit2 className="mr-1 h-3 w-3" />
                수정
              </Button>
            )}
          </div>
        </div>
        <div className="mt-4 space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <div>
            <span className="text-xs text-slate-600 dark:text-slate-500">
              방 코드
            </span>
            <div className="mt-1 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
              <span className="font-mono text-base text-slate-900 dark:text-white">
                {sessionCode}
              </span>
              <Button variant="outline" size="sm" onClick={onShareClick}>
                <Share2 className="mr-2 h-4 w-4" />
                {shareCopied ? "복사됨!" : "복사"}
              </Button>
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-600 dark:text-slate-500">
              방 이름
            </span>
            <div className="mt-1 text-sm text-slate-900 dark:text-white">
              {session.title}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-600 dark:text-slate-500">
              진행자
            </span>
            <div className="mt-1 flex items-center gap-2 text-slate-900 dark:text-white">
              {session.hostDisplayName}
              {session.isActive ? (
                <span className="rounded-full border border-emerald-500 px-2 py-0.5 text-xs text-emerald-300">
                  진행 중
                </span>
              ) : (
                <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">
                  종료됨
                </span>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-600 dark:text-slate-500">
              질문 등록 기간
            </span>
            <div className="mt-1 space-y-1 text-sm text-slate-900 dark:text-white">
              <div>
                시작:{" "}
                {new Date(session.startDate).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div>
                종료:{" "}
                {new Date(session.endDate).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
            <p> • 진행자에게 승인된 질문만 공개됩니다.</p>
            <p>• 종료 기한 이후엔 질문을 등록할 수 없습니다.</p>
            {isHost ? (
              <>
                <p>• 방 종료는 종료 기한 전에만 가능합니다.</p>
                <p>• 종료된 방도 종료 기한 전까지는 재개할 수 있습니다.</p>
              </>
            ) : null}
          </div>
          {isHost ? (
            <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              {session.isActive && isBeforeEndDate ? (
                <Button
                  variant="outline"
                  onClick={() => endSessionMutation.mutate()}
                  disabled={endSessionMutation.isPending}
                  className="w-full gap-2 text-red-400 hover:text-red-300 hover:border-red-500"
                >
                  <XCircle className="h-4 w-4" />방 종료
                </Button>
              ) : null}
              {!session.isActive && isBeforeEndDate ? (
                <Button
                  variant="outline"
                  onClick={() => reactivateSessionMutation.mutate()}
                  disabled={reactivateSessionMutation.isPending}
                  className="w-full gap-2 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500"
                >
                  <PlayCircle className="h-4 w-4" />방 재개
                </Button>
              ) : null}
              <Button
                variant="outline"
                onClick={onDeleteClick}
                disabled={
                  endSessionMutation.isPending ||
                  reactivateSessionMutation.isPending
                }
                className="w-full gap-2 text-red-400 hover:text-red-300 hover:border-red-500"
              >
                <Trash2 className="h-4 w-4" />방 삭제
              </Button>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
