"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { QuestionCard } from "@/components/question-card";
import { QuestionForm } from "@/components/question-form";
import {
  DateRangeInputs,
  SessionTitleInput,
} from "@/components/session-form-inputs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuestions } from "@/hooks/useQuestions";
import { useSessionState } from "@/hooks/useSessionState";
import {
  deleteSession,
  endSession,
  reactivateSession,
  updateSession,
} from "@/lib/questions";
import { useSessionStore } from "@/lib/stores/session-store";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit2, PlayCircle, Save, Share2, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface RoomViewProps {
  sessionCode: string;
}

const QuestionSkeleton = () => (
  <div className="h-28 w-full animate-pulse rounded-xl border border-slate-800 bg-slate-900/40" />
);

export function RoomView({ sessionCode }: RoomViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useSessionState(sessionCode);
  const {
    questions,
    isFetching,
    reaction,
    changeStatus,
    remove,
    toggleHighlight,
  } = useQuestions({
    sessionCode,
  });
  const {
    user,
    setSessionCode,
    setSessionTitle,
    isRoomDrawerOpen,
    setRoomDrawerOpen,
  } = useSessionStore((state) => ({
    user: state.user,
    setSessionCode: state.setSessionCode,
    setSessionTitle: state.setSessionTitle,
    isRoomDrawerOpen: state.isRoomDrawerOpen,
    setRoomDrawerOpen: state.setRoomDrawerOpen,
  }));
  const [shareCopied, setShareCopied] = useState(false);
  const [reactionMap, setReactionMap] = useState<Record<string, "like">>({});
  const [hostTab, setHostTab] = useState<
    "pending" | "approved" | "archived" | "all"
  >("pending");
  const [viewerSortTab, setViewerSortTab] = useState<"latest" | "popular">(
    "latest"
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  useEffect(() => {
    setSessionCode(sessionCode);
  }, [sessionCode, setSessionCode]);

  useEffect(() => {
    if (session?.title) {
      setSessionTitle(session.title);
    }
    return () => {
      setSessionTitle(null);
    };
  }, [session?.title, setSessionTitle]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `bubbly:reactions:${sessionCode}`;
    const stored = window.localStorage.getItem(key);
    if (stored) {
      try {
        setReactionMap(JSON.parse(stored));
      } catch (error) {
        console.error("리액션 기록을 불러오지 못했습니다.", error);
        setReactionMap({});
      }
    }
  }, [sessionCode]);

  // lg 이상 화면에서는 Drawer를 기본적으로 열어둠
  useEffect(() => {
    const checkScreenSize = () => {
      const isLargeScreen = window.innerWidth >= 1024; // lg breakpoint

      if (isLargeScreen && !isRoomDrawerOpen) {
        setRoomDrawerOpen(true);
      }
      console.log("isLargeScreen", isLargeScreen);
      console.log("isRoomDrawerOpen", isRoomDrawerOpen);

      if (!isLargeScreen && isRoomDrawerOpen) {
        setRoomDrawerOpen(false);
      }
    };

    // 초기 체크
    checkScreenSize();

    // 리사이즈 이벤트 리스너
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const isHost = Boolean(
    session?.hostUid && user?.uid && session.hostUid === user.uid
  );

  const isQuestionSubmissionAllowed = useMemo(() => {
    if (!session?.isActive) return false;
    const now = Date.now();
    if (now < session.startDate) return false;
    if (now > session.endDate) return false;
    return true;
  }, [session?.isActive, session?.startDate, session?.endDate]);

  const isBeforeEndDate = useMemo(() => {
    if (!session) return false;
    const now = Date.now();
    return now < session.endDate;
  }, [session?.endDate]);

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

  const handleOpenEditModal = () => {
    if (session) {
      setEditTitle(session.title);
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      const startDate = new Date(session.startDate);
      const startStr = `${startDate.getFullYear()}-${String(
        startDate.getMonth() + 1
      ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
      setEditStartDate(startStr);

      const endDate = new Date(session.endDate);
      const endStr = `${endDate.getFullYear()}-${String(
        endDate.getMonth() + 1
      ).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
      setEditEndDate(endStr);
    }
    setIsEditModalOpen(true);
  };

  const updateSessionMutation = useMutation({
    mutationFn: async () => {
      const start = editStartDate
        ? new Date(editStartDate).setHours(0, 0, 0, 0)
        : undefined;
      const end = editEndDate
        ? new Date(editEndDate).setHours(23, 59, 59, 999)
        : undefined;
      if (start && end && start > end) {
        throw new Error("시작 날짜가 종료 날짜보다 늦을 수 없습니다.");
      }
      return updateSession(sessionCode, {
        title: editTitle.trim(),
        startDate: start,
        endDate: end,
      });
    },
    onSuccess: (updatedSession: { title?: string } | undefined) => {
      toast.success("방 정보가 수정되었습니다.");
      setIsEditModalOpen(false);
      if (updatedSession?.title) {
        setSessionTitle(updatedSession.title);
      }
      queryClient.invalidateQueries({ queryKey: ["session", sessionCode] });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("방 정보 수정에 실패했습니다.");
      }
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: () => {
      if (!session?.hostUid) {
        throw new Error("방 정보를 찾을 수 없습니다.");
      }
      return deleteSession(sessionCode, session.hostUid);
    },
    onSuccess: () => {
      toast.success("방이 삭제되었습니다.");
      setIsDeleteConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["session", sessionCode] });
      router.push("/");
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("방 삭제에 실패했습니다.");
      }
    },
  });

  const pendingQuestions = useMemo(
    () => questions.filter((question) => question.status === "pending"),
    [questions]
  );
  const approvedQuestions = useMemo(
    () => questions.filter((question) => question.status === "approved"),
    [questions]
  );
  const archivedQuestions = useMemo(
    () => questions.filter((question) => question.status === "archived"),
    [questions]
  );

  const sortedApprovedQuestions = useMemo(() => {
    const sorted = [...approvedQuestions];

    if (viewerSortTab === "latest") {
      // 최신순: 생성일자만 기준으로 정렬
      sorted.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      // 좋아요순: 하이라이트된 질문을 최상단에 배치
      const highlightedQuestion = sorted.find((q) => q.highlighted);

      if (!highlightedQuestion) {
        // 하이라이트된 질문이 없으면 좋아요순으로 정렬
        sorted.sort((a, b) => b.like - a.like);
        return sorted;
      }

      // 하이라이트된 질문의 등록 시간 이후에 등록된 질문들
      const afterHighlighted = sorted.filter(
        (q) => !q.highlighted && q.createdAt > highlightedQuestion.createdAt
      );

      // 하이라이트된 질문 이전에 등록된 질문들
      const beforeHighlighted = sorted.filter(
        (q) => !q.highlighted && q.createdAt <= highlightedQuestion.createdAt
      );

      // 좋아요순으로 정렬
      afterHighlighted.sort((a, b) => b.like - a.like);
      beforeHighlighted.sort((a, b) => b.like - a.like);

      // 하이라이트 이후 등록된 질문 → 하이라이트된 질문 → 나머지 순서로 배치
      return [...afterHighlighted, highlightedQuestion, ...beforeHighlighted];
    }

    return sorted;
  }, [approvedQuestions, viewerSortTab]);

  const handleApprove = (id: string) => changeStatus(id, "approved");
  const handleReject = (id: string) => changeStatus(id, "archived");
  const handleHighlight = (questionId: string, currentHighlighted: boolean) => {
    toggleHighlight(questionId, !currentHighlighted);
  };
  const persistReactions = (next: Record<string, "like">) => {
    setReactionMap(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        `bubbly:reactions:${sessionCode}`,
        JSON.stringify(next)
      );
    }
  };

  const handleReaction = (questionId: string) => {
    const previous = reactionMap[questionId];
    if (previous === "like") {
      // 좋아요 취소
      reaction(questionId, -1);
      const { [questionId]: _removed, ...rest } = reactionMap;
      persistReactions(rest);
    } else {
      // 좋아요 추가
      reaction(questionId, 1);
      persistReactions({
        ...reactionMap,
        [questionId]: "like",
      });
    }
  };

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${sessionCode}`
      : `/room/${sessionCode}`;

  const copyShareUrl = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
      toast.success("방 주소가 복사되었습니다!");
    }
  };

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        존재하지 않는 방입니다.
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full min-h-full max-w-5xl flex-col gap-6 px-4 lg:ml-80">
      {isQuestionSubmissionAllowed && session.isActive && (
        <QuestionForm sessionCode={sessionCode} />
      )}

      {isHost ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Tabs
              value={hostTab}
              onValueChange={(value) =>
                setHostTab(value as "pending" | "approved" | "archived" | "all")
              }
            >
              <TabsList>
                <TabsTrigger value="all" className="relative">
                  전체
                  <span className="ml-2 rounded-full bg-slate-500/20 px-2 py-0.5 text-xs text-slate-300">
                    {questions.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="pending" className="relative">
                  대기
                  <span
                    className={cn(
                      "ml-2 rounded-full px-2 py-0.5 text-xs",
                      pendingQuestions.length > 0
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-slate-500/20 text-slate-300"
                    )}
                  >
                    {pendingQuestions.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="approved" className="relative">
                  승인
                  <span className="ml-2 rounded-full bg-slate-500/20 px-2 py-0.5 text-xs text-slate-300">
                    {approvedQuestions.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="archived" className="relative">
                  반려
                  <span className="ml-2 rounded-full bg-slate-500/20 px-2 py-0.5 text-xs text-slate-300">
                    {archivedQuestions.length}
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {hostTab !== "all" && (
              <span className="text-sm text-slate-400">
                {questions.length}개
              </span>
            )}
          </div>

          <Tabs value={hostTab}>
            <TabsContent value="all">
              {isFetching && !questions.length ? (
                <div className="space-y-3">
                  <QuestionSkeleton />
                  <QuestionSkeleton />
                  <QuestionSkeleton />
                </div>
              ) : questions.length ? (
                <div className="space-y-3">
                  {questions.map((question: Question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      mode="host"
                      userReaction={reactionMap[question.id] ?? null}
                      onStatusChange={(status) => {
                        if (status === "approved") {
                          handleApprove(question.id);
                        } else if (status === "archived") {
                          handleReject(question.id);
                        }
                      }}
                      onReact={() => handleReaction(question.id)}
                      onDelete={() => remove(question.id)}
                      onHighlight={() =>
                        handleHighlight(
                          question.id,
                          question.highlighted ?? false
                        )
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
                  질문이 없습니다.
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending">
              {isFetching && !pendingQuestions.length ? (
                <div className="space-y-3">
                  <QuestionSkeleton />
                  <QuestionSkeleton />
                </div>
              ) : pendingQuestions.length ? (
                pendingQuestions.map((question: Question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    mode="host"
                    userReaction={reactionMap[question.id] ?? null}
                    onStatusChange={(status) => {
                      if (status === "approved") {
                        handleApprove(question.id);
                      } else if (status === "archived") {
                        handleReject(question.id);
                      }
                    }}
                    onReact={() => handleReaction(question.id)}
                    onDelete={() => remove(question.id)}
                    onHighlight={() =>
                      handleHighlight(
                        question.id,
                        question.highlighted ?? false
                      )
                    }
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
                  대기 중인 질문이 없습니다.
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved">
              {isFetching && !approvedQuestions.length ? (
                <>
                  <QuestionSkeleton />
                  <QuestionSkeleton />
                  <QuestionSkeleton />
                </>
              ) : approvedQuestions.length ? (
                approvedQuestions.map((question: Question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    mode="host"
                    userReaction={reactionMap[question.id] ?? null}
                    onStatusChange={(status) => {
                      if (status === "approved") {
                        handleApprove(question.id);
                      } else if (status === "archived") {
                        handleReject(question.id);
                      }
                    }}
                    onReact={() => handleReaction(question.id)}
                    onDelete={() => remove(question.id)}
                    onHighlight={() =>
                      handleHighlight(
                        question.id,
                        question.highlighted ?? false
                      )
                    }
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
                  아직 공개된 질문이 없습니다.
                </div>
              )}
            </TabsContent>

            <TabsContent value="archived">
              {archivedQuestions.length ? (
                <div className="space-y-3">
                  {archivedQuestions.map((question: Question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      mode="host"
                      userReaction={reactionMap[question.id] ?? null}
                      onStatusChange={(status) => {
                        if (status === "approved") {
                          handleApprove(question.id);
                        }
                      }}
                      onReact={() => handleReaction(question.id)}
                      onDelete={() => remove(question.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
                  반려된 질문이 없습니다.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Tabs
              value={viewerSortTab}
              onValueChange={(value) =>
                setViewerSortTab(value as "latest" | "popular")
              }
            >
              <TabsList>
                <TabsTrigger value="latest">최신순</TabsTrigger>
                <TabsTrigger value="popular">좋아요순</TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-sm text-slate-400">
              {approvedQuestions.length}개
            </span>
          </div>

          <Tabs value={viewerSortTab}>
            <TabsContent value="latest">
              {isFetching && !sortedApprovedQuestions.length ? (
                <div className="space-y-3">
                  <QuestionSkeleton />
                  <QuestionSkeleton />
                  <QuestionSkeleton />
                </div>
              ) : sortedApprovedQuestions.length ? (
                <div className="space-y-3">
                  {sortedApprovedQuestions.map((question: Question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      mode="viewer"
                      userReaction={reactionMap[question.id] ?? null}
                      onReact={() => handleReaction(question.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
                  아직 공개된 질문이 없습니다.
                </div>
              )}
            </TabsContent>
            <TabsContent value="popular">
              {isFetching && !sortedApprovedQuestions.length ? (
                <div className="space-y-3">
                  <QuestionSkeleton />
                  <QuestionSkeleton />
                  <QuestionSkeleton />
                </div>
              ) : sortedApprovedQuestions.length ? (
                <div className="space-y-3">
                  {sortedApprovedQuestions.map((question: Question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      mode="viewer"
                      userReaction={reactionMap[question.id] ?? null}
                      onReact={() => handleReaction(question.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
                  아직 공개된 질문이 없습니다.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      )}

      <>
        {isRoomDrawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 transition-opacity animate-in fade-in duration-200 lg:hidden"
            onClick={() => setRoomDrawerOpen(false)}
          />
        )}
        <aside
          className={cn(
            "max-h-[calc(100vh-61px)] overflow-y-auto fixed left-0 top-[61px] bottom-0 z-50 w-80 max-w-[80%] border-r border-white/10 bg-slate-950/95 px-4 py-6 shadow-xl backdrop-blur-xl transition-transform duration-300",
            isRoomDrawerOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">
              방 상세 정보
            </h2>
            <div className="flex items-center gap-2">
              {isHost && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-slate-400 hover:text-slate-100"
                  onClick={handleOpenEditModal}
                >
                  <Edit2 className="mr-1 h-3 w-3" />
                  수정
                </Button>
              )}
            </div>
          </div>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <div>
              <span className="text-xs text-slate-500">방 코드</span>
              <div className="mt-1 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                <span className="font-mono text-base text-white">
                  {sessionCode}
                </span>
                <Button variant="outline" size="sm" onClick={copyShareUrl}>
                  <Share2 className="mr-2 h-4 w-4" />
                  {shareCopied ? "복사됨!" : "복사"}
                </Button>
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-500">방 이름</span>
              <div className="mt-1 text-sm text-white">{session.title}</div>
            </div>
            <div>
              <span className="text-xs text-slate-500">진행자</span>
              <div className="mt-1 flex items-center gap-2 text-white">
                {session.hostDisplayName}
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
            <div>
              <span className="text-xs text-slate-500">질문 등록 기간</span>
              <div className="mt-1 space-y-1 text-sm text-white">
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
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
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
              <div className="space-y-3 border-t border-slate-800 pt-4">
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
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  disabled={deleteSessionMutation.isPending}
                  className="w-full gap-2 text-red-400 hover:text-red-300 hover:border-red-500"
                >
                  <Trash2 className="h-4 w-4" />방 삭제
                </Button>
              </div>
            ) : null}
          </div>
        </aside>
      </>

      {isHost && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>방 정보 수정</DialogTitle>
              <DialogDescription>
                방 이름만 수정할 수 있습니다. 질문 등록 기간은 변경할 수
                없습니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <SessionTitleInput
                value={editTitle}
                onChange={setEditTitle}
                placeholder="방 이름을 입력하세요"
              />
              <DateRangeInputs
                startDate={editStartDate}
                endDate={editEndDate}
                onStartDateChange={setEditStartDate}
                onEndDateChange={setEditEndDate}
                readOnly
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                취소
              </Button>
              <Button
                onClick={() => updateSessionMutation.mutate()}
                disabled={!editTitle.trim() || updateSessionMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                저장
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isHost && (
        <ConfirmDialog
          open={isDeleteConfirmOpen}
          onOpenChange={setIsDeleteConfirmOpen}
          title="방 삭제 확인"
          description="방을 삭제하면 모든 질문이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다. 정말로 이 방을 삭제하시겠습니까?"
          confirmText="삭제"
          cancelText="취소"
          variant="destructive"
          onConfirm={() => deleteSessionMutation.mutate()}
          isLoading={deleteSessionMutation.isPending}
        />
      )}
    </div>
  );
}
