"use client";

import { useEffect, useMemo, useState } from "react";
import { LogIn, RefreshCw, Share2 } from "lucide-react";
import { QuestionCard } from "@/components/question-card";
import { QuestionForm } from "@/components/question-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuestions } from "@/hooks/useQuestions";
import { useSessionState } from "@/hooks/useSessionState";
import { signInWithGoogle } from "@/lib/firebase";
import { useSessionStore } from "@/lib/stores/session-store";
import { generateNickname } from "@/lib/utils";
import { toast } from "sonner";
import type { Question } from "@/lib/types";

interface RoomViewProps {
  sessionCode: string;
}

const QuestionSkeleton = () => (
  <div className="h-28 w-full animate-pulse rounded-xl border border-slate-800 bg-slate-900/40" />
);

export function RoomView({ sessionCode }: RoomViewProps) {
  const { session } = useSessionState(sessionCode);
  const { questions, isFetching, reaction, comment, changeStatus, remove } =
    useQuestions({
      sessionCode,
    });
  const { user, setSessionCode, nickname, setNickname } = useSessionStore(
    (state) => ({
      user: state.user,
      setSessionCode: state.setSessionCode,
      nickname: state.nickname,
      setNickname: state.setNickname,
    })
  );
  const [shareCopied, setShareCopied] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [nicknameInitialized, setNicknameInitialized] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [reactionMap, setReactionMap] = useState<
    Record<string, "like" | "love">
  >({});
  const bubbleConfig = useMemo(
    () => [
      { size: 220, left: 10, duration: 18, delay: 0, opacity: 0.35 },
      { size: 160, left: 35, duration: 22, delay: 4, opacity: 0.28 },
      { size: 260, left: 60, duration: 26, delay: 2, opacity: 0.3 },
      { size: 180, left: 80, duration: 20, delay: 6, opacity: 0.25 },
      { size: 140, left: 50, duration: 24, delay: 8, opacity: 0.2 },
    ],
    []
  );

  useEffect(() => {
    setSessionCode(sessionCode);
  }, [sessionCode, setSessionCode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `bubbly:nickname:${sessionCode}`;
    const stored = window.localStorage.getItem(key);
    if (stored) {
      setNickname(stored);
      setNicknameInput(stored);
    } else {
      setNickname("");
      const generated = generateNickname();
      setNicknameInput(generated);
    }
    setNicknameInitialized(true);
  }, [sessionCode, setNickname]);

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

  const isHost = Boolean(
    session?.hostUid && user?.uid && session.hostUid === user.uid
  );

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

  const handleNicknameChange = (name: string) => {
    const value = name.slice(0, 24);
    setNickname(value);
    const key = `bubbly:nickname:${sessionCode}`;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
    }
  };

  const handleApprove = (id: string) => changeStatus(id, "approved");
  const handleReject = (id: string) => changeStatus(id, "archived");
  const persistReactions = (next: Record<string, "like" | "love">) => {
    setReactionMap(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        `bubbly:reactions:${sessionCode}`,
        JSON.stringify(next)
      );
    }
  };

  const handleReaction = (questionId: string, emoji: "like" | "love") => {
    if (!user) {
      setShowAuthDialog(true);
      toast.error("리액션을 사용하려면 로그인해주세요.");
      return;
    }
    const previous = reactionMap[questionId];
    if (previous === emoji) {
      toast("이미 선택한 리액션입니다.");
      return;
    }
    if (previous) {
      reaction(questionId, previous, -1);
    }
    reaction(questionId, emoji, 1);
    persistReactions({
      ...reactionMap,
      [questionId]: emoji,
    });
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success("로그인 되었습니다.");
      setShowAuthDialog(false);
    } catch (error) {
      console.error(error);
      toast.error("로그인에 실패했습니다.");
    }
  };

  const handleSaveNickname = () => {
    const value = nicknameInput.trim();
    if (!value) {
      toast.error("닉네임을 입력해주세요.");
      return;
    }
    handleNicknameChange(value);
    setIsNicknameModalOpen(false);
  };

  const regenerateNickname = () => {
    const generated = generateNickname();
    setNicknameInput(generated);
  };

  useEffect(() => {
    if (!nicknameInitialized) return;
    if (!user) {
      setShowAuthDialog(true);
      setIsNicknameModalOpen(false);
      return;
    }
    setShowAuthDialog(false);
    if (!isHost && !nickname.trim()) {
      setIsNicknameModalOpen(true);
    } else {
      setIsNicknameModalOpen(false);
    }
  }, [isHost, nickname, nicknameInitialized, user]);

  const preventModalClose = (open: boolean) => {
    if (!open) {
      if (!nickname.trim()) return;
    }
    setIsNicknameModalOpen(open);
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
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        존재하지 않는 방입니다.
      </div>
    );
  }

  const renderHostPendingSection = () => {
    if (!isHost) return null;
    return (
      <section className="space-y-3 rounded-3xl border border-white/5 bg-white/5 p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">
            승인 대기 질문
          </h2>
          <span className="text-sm text-slate-400">
            {pendingQuestions.length}개
          </span>
        </div>
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
              onReact={(emoji) => handleReaction(question.id, emoji)}
              onComment={(message) =>
                comment(question.id, {
                  author: user?.displayName ?? session.hostDisplayName,
                  content: message,
                })
              }
              onDelete={() => remove(question.id)}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
            대기 중인 질문이 없습니다.
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        {bubbleConfig.map((bubble, index) => (
          <span
            key={index}
            className="bubble"
            style={{
              left: `${bubble.left}%`,
              bottom: `${-bubble.size / 2}px`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              opacity: bubble.opacity,
              animationDuration: `${bubble.duration}s`,
              animationDelay: `${bubble.delay}s`,
            }}
          />
        ))}
      </div>

      <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-lg">
            {session.title || "제목 없는 세션"}
          </h1>
          <p className="text-xs text-slate-200/60">
            진행자 {session.hostDisplayName} ·{" "}
            {new Date(session.createdAt).toLocaleString("ko-KR", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDetailsOpen(true)}
          >
            방 상세보기
          </Button>
        </div>
      </header>

      {!session.isActive ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center text-sm text-slate-400">
          이 방은 현재 비활성화 상태입니다.
        </div>
      ) : null}

      {isHost ? renderHostPendingSection() : null}

      <section className="space-y-3 rounded-3xl border border-white/5 bg-white/5 p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">공개된 질문</h2>
          <span className="text-sm text-slate-400">
            {approvedQuestions.length}개
          </span>
        </div>
        {isFetching && !approvedQuestions.length ? (
          <div className="space-y-3">
            <QuestionSkeleton />
            <QuestionSkeleton />
            <QuestionSkeleton />
          </div>
        ) : approvedQuestions.length ? (
          approvedQuestions.map((question: Question) => (
            <QuestionCard
              key={question.id}
              question={question}
              mode={isHost ? "host" : "viewer"}
              userReaction={reactionMap[question.id] ?? null}
              onStatusChange={(status) => {
                if (!isHost) return;
                if (status === "approved") {
                  handleApprove(question.id);
                } else if (status === "archived") {
                  handleReject(question.id);
                }
              }}
              onReact={(emoji) => handleReaction(question.id, emoji)}
              onComment={
                isHost || nickname
                  ? (message) =>
                      comment(question.id, {
                        author: isHost
                          ? user?.displayName ?? session.hostDisplayName
                          : nickname || "익명",
                        content: message,
                      })
                  : undefined
              }
              onDelete={isHost ? () => remove(question.id) : undefined}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
            아직 공개된 질문이 없습니다.
          </div>
        )}
      </section>

      {isHost && archivedQuestions.length ? (
        <section className="space-y-3 rounded-3xl border border-white/5 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">
              반려된 질문
            </h2>
            <span className="text-sm text-slate-400">
              {archivedQuestions.length}개
            </span>
          </div>
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
                onReact={(emoji) => handleReaction(question.id, emoji)}
                onComment={(message) =>
                  comment(question.id, {
                    author: user?.displayName ?? session.hostDisplayName,
                    content: message,
                  })
                }
                onDelete={() => remove(question.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {!isHost && user && nickname ? (
        <div className="rounded-3xl border border-white/5 bg-white/5 p-5 backdrop-blur-xl">
          <QuestionForm
            sessionCode={sessionCode}
            disabled={!session.isActive}
            nickname={nickname}
          />
        </div>
      ) : null}

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>방 상세 정보</DialogTitle>
            <DialogDescription>
              방 코드와 공유 링크, 진행자 정보를 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm text-slate-300">
            <div>
              <span className="text-xs text-slate-500">방 코드</span>
              <div className="mt-1 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                <span className="font-mono text-base text-white">
                  {sessionCode}
                </span>
                <Button variant="outline" size="sm" onClick={copyShareUrl}>
                  <Share2 className="mr-2 h-4 w-4" />
                  {shareCopied ? "복사됨!" : "주소 복사"}
                </Button>
              </div>
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
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
              <p> • 승인된 질문만 공개 탭에 노출됩니다.</p>
              <p> • 리액션은 좋아요/공감 두 가지만 제공됩니다.</p>
              <p> • 댓글은 간결하게 작성해주세요.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {!isHost && user ? (
        <Dialog open={isNicknameModalOpen} onOpenChange={preventModalClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>닉네임 설정</DialogTitle>
              <DialogDescription>
                질문을 남기기 전에 사용할 닉네임을 입력하세요. 이후에도 수정할
                수 있습니다.
                <br />
                진행자가 질문을 승인하면 모두에게 공개되는 실시간 Q&A
                공간입니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <Input
                value={nicknameInput}
                onChange={(event) => setNicknameInput(event.target.value)}
                maxLength={24}
                placeholder="닉네임을 입력하세요"
              />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>랜덤 닉네임이 마음에 들지 않으면 다시 생성해보세요.</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={regenerateNickname}
                  className="text-brand hover:text-brand-foreground"
                >
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                  다시 생성
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveNickname}>확인</Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>로그인이 필요합니다</DialogTitle>
            <DialogDescription>
              질문을 남기거나 리액션/댓글을 작성하려면 Google 계정으로
              로그인해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 text-sm text-slate-300">
            <p>
              로그인하면 현재 브라우저에서 해당 닉네임과 활동이 유지됩니다.
              방장은 승인/반려 작업을 수행하고, 참가자는 승인 대기 또는 공개
              질문에 리액션과 댓글을 남길 수 있습니다.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAuthDialog(false)}>
              닫기
            </Button>
            <Button onClick={handleSignIn}>
              <LogIn className="mr-2 h-4 w-4" />
              Google로 로그인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
