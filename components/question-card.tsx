"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Heart, MessageCircle, ShieldCheck, ThumbsUp, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Question, QuestionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type Mode = "viewer" | "host";

interface QuestionCardProps {
  question: Question;
  mode: Mode;
  userReaction?: "like" | "love" | null;
  onStatusChange?: (status: QuestionStatus) => void;
  onDelete?: () => void;
  onReact?: (emoji: "like" | "love") => void;
  onComment?: (message: string) => void;
}

const statusClass: Record<QuestionStatus, string> = {
  pending: "border-amber-500/40",
  approved: "border-emerald-500/40",
  answered: "border-blue-500/40",
  archived: "border-rose-500/40"
};

const statusLabel: Record<QuestionStatus, string> = {
  pending: "대기 중",
  approved: "공개됨",
  answered: "답변 완료",
  archived: "반려됨"
};

export function QuestionCard({
  question,
  mode,
  userReaction,
  onStatusChange,
  onDelete,
  onReact,
  onComment
}: QuestionCardProps) {
  const timeAgo = formatDistanceToNow(question.createdAt, { addSuffix: true, locale: ko });
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentValue, setCommentValue] = useState("");

  const canReact = Boolean(onReact);
  const canComment = Boolean(onComment);

  const recentComments = useMemo(() => {
    if (!question.comments?.length) return [];
    return [...question.comments].slice(-3);
  }, [question.comments]);

  const submitComment = () => {
    if (!commentValue.trim()) return;
    onComment?.(commentValue.trim());
    setCommentValue("");
    setIsCommentOpen(false);
  };

  return (
    <Card
      className={cn(
        "space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-brand/10",
        mode === "viewer" && question.status === "approved"
          ? "border-brand/60"
          : statusClass[question.status]
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <User className="h-3.5 w-3.5" />
            <span>{question.authorName || "익명"}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-100">
            {question.content}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{statusLabel[question.status]}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-1 transition hover:scale-105",
              !canReact && "cursor-not-allowed opacity-50",
              userReaction === "like"
                ? "border-brand bg-brand/10 text-brand"
                : "border-white/10 bg-white/10 hover:border-brand hover:text-brand"
            )}
            onClick={() => (canReact ? onReact?.("like") : undefined)}
            disabled={!canReact || userReaction === "like"}
          >
            <ThumbsUp className="h-4 w-4" />
            <span className="text-[10px] font-semibold text-slate-200">
              {question.reaction.like}
            </span>
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-1 transition hover:scale-105",
              !canReact && "cursor-not-allowed opacity-50",
              userReaction === "love"
                ? "border-rose-400 bg-rose-400/10 text-rose-200"
                : "border-white/10 bg-white/10 hover:border-rose-400 hover:text-rose-300"
            )}
            onClick={() => (canReact ? onReact?.("love") : undefined)}
            disabled={!canReact || userReaction === "love"}
          >
            <Heart className="h-4 w-4" />
            <span className="text-[10px] font-semibold text-slate-200">
              {question.reaction.love}
            </span>
          </button>
          <div className="rounded-full border border-white/10 bg-white/10 px-2 py-1 font-mono text-[11px] text-slate-200">
            {question.reaction.like + question.reaction.love}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-slate-500" />
          <span>{question.comments?.length ?? 0}</span>
          <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                disabled={!canComment}
                className={cn("px-2", !canComment && "opacity-60")}
              >
                댓글 작성
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>댓글 남기기</DialogTitle>
                <DialogDescription>
                  추가 의견이나 보충 설명을 남겨 진행자와 참여자에게 공유하세요.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={commentValue}
                onChange={event => setCommentValue(event.target.value)}
                placeholder="댓글 내용을 입력하세요"
                className="min-h-[120px]"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsCommentOpen(false)}>
                  취소
                </Button>
                <Button onClick={submitComment} disabled={!commentValue.trim()}>
                  등록
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {mode === "host" ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange?.("approved")}
            disabled={question.status === "approved"}
          >
            승인
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange?.("archived")}
            disabled={question.status === "archived"}
          >
            반려
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-rose-400 hover:text-rose-300"
          >
            삭제
          </Button>
        </div>
      ) : null}

      {recentComments.length ? (
        <div className="text-xs text-slate-500">
          최근 댓글{" "}
          <span className="text-slate-300">{recentComments[recentComments.length - 1].author}</span>
          :{" "}
          <span className="text-slate-300">
            {recentComments[recentComments.length - 1].content.slice(0, 60)}
            {recentComments[recentComments.length - 1].content.length > 60 ? "…" : ""}
          </span>
        </div>
      ) : null}
    </Card>
  );
}

