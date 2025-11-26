"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { EditSessionModal } from "@/components/edit-session-modal";
import { QuestionCard } from "@/components/question-card";
import { QuestionForm } from "@/components/question-form";
import { RoomDrawer } from "@/components/room-drawer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomViewSkeleton } from "@/components/views/room-view-skeleton";
import { useQuestions } from "@/hooks/useQuestions";
import { useSessionState } from "@/hooks/useSessionState";
import { deleteSession } from "@/lib/questions";
import { useSessionStore } from "@/lib/stores/session-store";
import type { Question } from "@/lib/types";
import { addVisitedSession, cn, copyToClipboard } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface RoomViewProps {
  sessionCode: string;
}

const QuestionSkeleton = () => (
  <div className="h-28 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/40" />
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

  const [isStoreReady, setIsStoreReady] = useState(false);
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
  const [isDeleteQuestionConfirmOpen, setIsDeleteQuestionConfirmOpen] =
    useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  useEffect(() => {
    setIsStoreReady(true);
  }, []);

  useEffect(() => {
    setSessionCode(sessionCode);
  }, [sessionCode, setSessionCode]);

  useEffect(() => {
    if (session?.title) {
      setSessionTitle(session.title);
      // 방문한 방 정보를 localStorage에 저장
      if (session.code && session.title) {
        addVisitedSession({
          code: session.code,
          title: session.title,
          createdAt: session.createdAt,
          isActive: session.isActive,
        });
      }
    }
    return () => {
      setSessionTitle(null);
    };
  }, [
    session?.title,
    session?.code,
    session?.createdAt,
    session?.isActive,
    setSessionTitle,
  ]);

  useEffect(() => {
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

  useEffect(() => {
    const checkScreenSize = () => {
      const isLargeScreen = window.innerWidth >= 1366;

      if (isLargeScreen && !isRoomDrawerOpen) {
        setRoomDrawerOpen(true);
      }

      if (!isLargeScreen && isRoomDrawerOpen) {
        setRoomDrawerOpen(false);
      }
    };

    checkScreenSize();

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

  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
  };

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

  // 날짜 문자열 추출 헬퍼 함수 (YYYY-MM-DD 형식)
  const getDateString = (timestamp: number): string => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 하이라이트 기반 정렬 함수
  const sortQuestionsWithHighlight = (
    questions: Question[],
    sortType: "latest" | "popular"
  ): Question[] => {
    const highlightedQuestion = questions.find((q) => q.highlighted);

    if (!highlightedQuestion) {
      // 하이라이트된 질문이 없으면 일반 정렬
      if (sortType === "latest") {
        return [...questions].sort((a, b) => b.createdAt - a.createdAt);
      } else {
        return [...questions].sort((a, b) => b.like - a.like);
      }
    }

    const highlightedDate = getDateString(highlightedQuestion.createdAt);

    // 같은 날짜에 생성된 질문들
    const sameDateQuestions = questions.filter(
      (q) => getDateString(q.createdAt) === highlightedDate
    );

    // 그 날짜 이후에 생성된 질문들 (하이라이트 여부와 관계없이)
    const afterDateQuestions = questions.filter(
      (q) => getDateString(q.createdAt) > highlightedDate
    );

    // 그 날짜 이전에 생성된 질문들
    const beforeDateQuestions = questions.filter(
      (q) => getDateString(q.createdAt) < highlightedDate
    );

    // 같은 날짜 내에서 정렬: 하이라이트된 질문이 맨 위, 나머지는 정렬 기준에 따라
    const sortedSameDate = [...sameDateQuestions].sort((a, b) => {
      if (a.highlighted) return -1;
      if (b.highlighted) return 1;
      if (sortType === "latest") {
        return b.createdAt - a.createdAt;
      } else {
        return b.like - a.like;
      }
    });

    // 이후 날짜 질문들 정렬
    if (sortType === "latest") {
      afterDateQuestions.sort((a, b) => b.createdAt - a.createdAt);
      beforeDateQuestions.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      afterDateQuestions.sort((a, b) => b.like - a.like);
      beforeDateQuestions.sort((a, b) => b.like - a.like);
    }

    // 같은 날짜 질문들 → 이전 날짜 질문들 → 이후 날짜 질문들 순서
    return [...sortedSameDate, ...beforeDateQuestions, ...afterDateQuestions];
  };

  const sortedApprovedQuestions = useMemo(() => {
    return sortQuestionsWithHighlight(
      approvedQuestions,
      viewerSortTab === "latest" ? "latest" : "popular"
    );
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
    if (!isQuestionSubmissionAllowed) {
      toast.error("종료된 방은 좋아요를 누를 수 없습니다.");
      return;
    }
    const wasLiked = reactionMap[questionId] === "like";
    const previousState = reactionMap;
    let nextState: Record<string, "like">;
    let delta: 1 | -1;

    if (wasLiked) {
      const { [questionId]: _removed, ...rest } = reactionMap;
      nextState = rest;
      delta = -1;
    } else {
      nextState = {
        ...reactionMap,
        [questionId]: "like",
      };
      delta = 1;
    }

    persistReactions(nextState);
    reaction(questionId, delta).catch(() => {
      persistReactions(previousState);
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestionToDelete(questionId);
    setIsDeleteQuestionConfirmOpen(true);
  };

  const confirmDeleteQuestion = () => {
    if (questionToDelete) {
      remove(questionToDelete);
      setIsDeleteQuestionConfirmOpen(false);
      setQuestionToDelete(null);
    }
  };

  if (!isStoreReady) {
    return <RoomViewSkeleton />;
  }

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${sessionCode}`
      : `/room/${sessionCode}`;

  const copyShareUrl = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
      toast.success("방 주소가 복사되었습니다!");
    } else {
      toast.error("복사에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const copySessionCode = async () => {
    const success = await copyToClipboard(sessionCode);
    if (success) {
      toast.success("방 코드가 복사되었습니다!");
    } else {
      toast.error("복사에 실패했습니다. 다시 시도해주세요.");
    }
  };

  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-slate-600 dark:text-slate-400">
        <p>존재하지 않는 방입니다.</p>
        <Button onClick={() => router.push("/")} theme="slate">
          홈으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full min-h-full max-w-2xl flex-col gap-6 px-4">
      {isQuestionSubmissionAllowed && session.isActive && (
        <QuestionForm sessionCode={sessionCode} />
      )}

      {isHost ? (
        <section className="space-y-4">
          <Tabs
            value={hostTab}
            onValueChange={(value) =>
              setHostTab(value as "pending" | "approved" | "archived" | "all")
            }
          >
            <TabsList>
              <TabsTrigger value="all" className="relative">
                전체
                <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-500/20 dark:text-slate-300">
                  {questions.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="relative">
                대기
                <span
                  className={cn(
                    "ml-2 rounded-full px-2 py-0.5 text-xs",
                    pendingQuestions.length > 0
                      ? "bg-amber-500/20 text-amber-600"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300"
                  )}
                >
                  {pendingQuestions.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="approved" className="relative">
                승인
                <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-500/20 dark:text-slate-300">
                  {approvedQuestions.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="archived" className="relative">
                반려
                <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-500/20 dark:text-slate-300">
                  {archivedQuestions.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

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
                  {sortQuestionsWithHighlight(questions, "latest").map(
                    (question: Question, index) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        mode="host"
                        index={index}
                        userReaction={reactionMap[question.id] ?? null}
                        onStatusChange={(status) => {
                          if (status === "approved") {
                            handleApprove(question.id);
                          } else if (status === "archived") {
                            handleReject(question.id);
                          }
                        }}
                        onReact={() => handleReaction(question.id)}
                        onDelete={() => handleDeleteQuestion(question.id)}
                        onHighlight={() =>
                          handleHighlight(
                            question.id,
                            question.highlighted ?? false
                          )
                        }
                      />
                    )
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
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
                pendingQuestions.map((question: Question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    mode="host"
                    index={index}
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
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
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
                sortQuestionsWithHighlight(approvedQuestions, "latest").map(
                  (question: Question, index) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      mode="host"
                      index={index}
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
                  )
                )
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
                  아직 공개된 질문이 없습니다.
                </div>
              )}
            </TabsContent>

            <TabsContent value="archived">
              {archivedQuestions.length ? (
                <div className="space-y-3">
                  {archivedQuestions.map((question: Question, index) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      mode="host"
                      index={index}
                      userReaction={reactionMap[question.id] ?? null}
                      onStatusChange={(status) => {
                        if (status === "approved") {
                          handleApprove(question.id);
                        }
                      }}
                      onReact={() => handleReaction(question.id)}
                      onDelete={() => handleDeleteQuestion(question.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
                  반려된 질문이 없습니다.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
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
            <span className="text-sm text-slate-600 dark:text-slate-400">
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
                  {sortedApprovedQuestions.map((question: Question, index) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      mode="viewer"
                      index={index}
                      userReaction={reactionMap[question.id] ?? null}
                      onReact={() => handleReaction(question.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
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
                  {sortedApprovedQuestions.map((question: Question, index) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      mode="viewer"
                      index={index}
                      userReaction={reactionMap[question.id] ?? null}
                      onReact={() => handleReaction(question.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
                  아직 공개된 질문이 없습니다.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      )}

      {session && (
        <RoomDrawer
          session={session}
          sessionCode={sessionCode}
          isOpen={isRoomDrawerOpen}
          onClose={() => setRoomDrawerOpen(false)}
          onEditClick={handleOpenEditModal}
          onDeleteClick={() => setIsDeleteConfirmOpen(true)}
          shareCopied={shareCopied}
          onShareClick={copyShareUrl}
          onCodeClick={copySessionCode}
        />
      )}

      {isHost && session && (
        <EditSessionModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          sessionCode={sessionCode}
          sessionTitle={session.title}
          sessionStartDate={session.startDate}
          sessionEndDate={session.endDate}
        />
      )}

      {isHost && (
        <>
          <ConfirmDialog
            open={isDeleteConfirmOpen}
            onOpenChange={setIsDeleteConfirmOpen}
            title="방 삭제 확인"
            description="방을 삭제하면 모든 질문이 영구적으로 삭제됩니다.<br/>정말로 이 방을 삭제하시겠습니까?"
            confirmText="삭제"
            cancelText="취소"
            variant="destructive"
            onConfirm={() => deleteSessionMutation.mutate()}
            isLoading={deleteSessionMutation.isPending}
          />
          <ConfirmDialog
            open={isDeleteQuestionConfirmOpen}
            onOpenChange={(open) => {
              setIsDeleteQuestionConfirmOpen(open);
              if (!open) {
                setQuestionToDelete(null);
              }
            }}
            title="질문 삭제 확인"
            description="이 질문을 삭제하면 다시 되돌릴 수 없습니다.<br/>정말로 이 질문을 삭제하시겠습니까?"
            confirmText="삭제"
            cancelText="취소"
            variant="destructive"
            onConfirm={confirmDeleteQuestion}
          />
        </>
      )}
    </div>
  );
}
