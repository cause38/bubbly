"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitQuestion } from "@/lib/questions";
import type { Question } from "@/lib/types";

interface QuestionFormProps {
  sessionCode: string;
  disabled?: boolean;
  nickname: string;
}

interface QuestionFormMutationVariables {
  content: string;
  nickname: string;
}

const questionsKey = (sessionCode: string) =>
  ["questions", sessionCode] as const;

export function QuestionForm({
  sessionCode,
  disabled,
  nickname,
}: QuestionFormProps) {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation<
    Question,
    unknown,
    QuestionFormMutationVariables,
    { previous?: Question[] }
  >({
    mutationFn: async ({ content, nickname }: QuestionFormMutationVariables) =>
      submitQuestion(
        {
          content,
          authorName: nickname,
        },
        sessionCode
      ),
    onMutate: async (variables: QuestionFormMutationVariables) => {
      await queryClient.cancelQueries({ queryKey: questionsKey(sessionCode) });
      const previous = queryClient.getQueryData<Question[]>(
        questionsKey(sessionCode)
      );
      const optimisticQuestion: Question = {
        id: `temp-${Date.now()}`,
        content: variables.content,
        authorName: variables.nickname,
        status: "pending",
        reaction: { like: 0, love: 0 },
        comments: [],
        createdAt: Date.now(),
      };
      if (previous) {
        queryClient.setQueryData<Question[]>(questionsKey(sessionCode), [
          optimisticQuestion,
          ...previous,
        ]);
      } else {
        queryClient.setQueryData<Question[]>(questionsKey(sessionCode), [
          optimisticQuestion,
        ]);
      }
      return { previous };
    },
    onError: (
      _error: unknown,
      _variables: QuestionFormMutationVariables | undefined,
      context: { previous?: Question[] } | undefined
    ) => {
      if (context?.previous) {
        queryClient.setQueryData(questionsKey(sessionCode), context.previous);
      }
      toast.error("질문 전송에 실패했습니다.");
    },
    onSuccess: () => {
      toast.success("질문이 전송되었습니다. 진행자 컨펌을 기다려주세요!");
      setContent("");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: questionsKey(sessionCode) });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedNickname = nickname.trim();
    const trimmedContent = content.trim();
    if (!trimmedNickname) {
      toast.error("닉네임을 먼저 설정해주세요.");
      return;
    }
    if (!trimmedContent) {
      toast.error("질문 내용을 입력해주세요.");
      return;
    }
    mutation.mutate({ content: trimmedContent, nickname: trimmedNickname });
  };

  const isPending = mutation.isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl"
    >
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-200">질문 내용</label>
        <Textarea
          placeholder="진행자에게 궁금한 점을 입력하세요"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={disabled || isPending}
          className="min-h-[140px]"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={disabled || isPending}>
          {isPending ? "전송 중..." : "질문 전송"}
        </Button>
      </div>
    </form>
  );
}
