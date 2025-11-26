"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Question, QuestionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Star, ThumbsUp, User } from "lucide-react";
import { useMemo } from "react";

type Mode = "viewer" | "host";

interface QuestionCardProps {
  question: Question;
  mode: Mode;
  userReaction?: "like" | null;
  onStatusChange?: (status: QuestionStatus) => void;
  onDelete?: () => void;
  onReact?: () => void;
  onHighlight?: () => void;
}

export function QuestionCard({
  question,
  mode,
  userReaction,
  onStatusChange,
  onDelete,
  onReact,
  onHighlight,
}: QuestionCardProps) {
  const timeAgo = formatDistanceToNow(question.createdAt, {
    addSuffix: true,
    locale: ko,
  });
  const canReact = Boolean(onReact);

  const recentComments = useMemo(() => {
    if (!question.comments?.length) return [];
    return [...question.comments].slice(-3);
  }, [question.comments]);

  return (
    <Card
      className={cn(
        "space-y-3 rounded-2xl border bg-white p-4 shadow-lg backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-brand/10 dark:bg-white/5",
        question.highlighted
          ? "border-brand shadow-brand/20 ring-2 ring-brand/30"
          : "border-slate-200 hover:border-brand/40 dark:border-white/10"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <User className="h-3.5 w-3.5" />
            <span>{question.authorName || "익명"}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-900 dark:text-slate-100">
            {question.content}
          </p>
        </div>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-1 transition hover:scale-105",
            !canReact && "cursor-not-allowed opacity-50",
            userReaction === "like"
              ? "border-brand bg-brand/10 text-brand"
              : "border-slate-300 bg-slate-50 hover:border-brand hover:text-brand dark:border-white/10 dark:bg-white/10"
          )}
          onClick={() => (canReact ? onReact?.() : undefined)}
          disabled={!canReact}
        >
          <ThumbsUp className="h-4 w-4" />
          <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">
            {question.like}
          </span>
        </button>
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
          {question.status === "approved" ? (
            <Button
              size="sm"
              variant={question.highlighted ? "default" : "outline"}
              onClick={onHighlight}
              className={cn(
                question.highlighted
                  ? "bg-brand text-white hover:bg-brand/90"
                  : "hover:border-brand"
              )}
            >
              <Star
                className={cn(
                  "mr-1 h-3.5 w-3.5",
                  question.highlighted && "fill-current"
                )}
              />
              하이라이트
            </Button>
          ) : null}
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
        <div className="text-[10px] text-slate-600 dark:text-slate-500">
          최근 반응이 많은 질문입니다.
        </div>
      ) : null}
    </Card>
  );
}
