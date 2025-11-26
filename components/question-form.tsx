"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitQuestion } from "@/lib/questions";
import type { Question } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

interface QuestionFormProps {
  sessionCode: string;
  disabled?: boolean;
}

interface QuestionFormMutationVariables {
  content: string;
}

const questionsKey = (sessionCode: string) =>
  ["questions", sessionCode] as const;

const MAX_LENGTH = 150;

export function QuestionForm({ sessionCode, disabled }: QuestionFormProps) {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation<
    Question,
    unknown,
    QuestionFormMutationVariables,
    { previous?: Question[] }
  >({
    mutationFn: async ({ content }: QuestionFormMutationVariables) =>
      submitQuestion(
        {
          content,
          authorName: "익명",
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
        authorName: "익명",
        status: "pending",
        like: 0,
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

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    if (value.length <= MAX_LENGTH) {
      setContent(value);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast.error("질문 내용을 입력해주세요.");
      return;
    }
    if (trimmedContent.length > MAX_LENGTH) {
      toast.error(`질문은 ${MAX_LENGTH}자까지만 입력 가능합니다.`);
      return;
    }
    mutation.mutate({ content: trimmedContent });
  };

  const isPending = mutation.isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="group space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
    >
      <div className="relative">
        <Textarea
          placeholder="질문 내용을 입력하세요"
          value={content}
          onChange={handleChange}
          disabled={disabled || isPending}
          maxLength={MAX_LENGTH}
          className="min-h-[24px] h-[24px] focus:min-h-[120px] transition-[min-height] text-base pr-12 pb-6"
        />
        <div className="absolute bottom-0 right-0 text-xs text-slate-400 pointer-events-none">
          <span className={content.length >= MAX_LENGTH ? "text-red-400" : ""}>
            {content.length}
          </span>
          <span className="text-slate-500">/{MAX_LENGTH}</span>
        </div>
      </div>
      <div className="justify-end gap-2 hidden group-focus-within:flex">
        <Button
          type="submit"
          disabled={disabled || isPending}
          onMouseDown={(e) => {
            // 버튼 클릭 시 포커스가 벗어나지 않도록 방지
            e.preventDefault();
          }}
        >
          {isPending ? "전송 중..." : "질문 전송"}
        </Button>
      </div>
    </form>
  );
}
