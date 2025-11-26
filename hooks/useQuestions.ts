"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  addReaction,
  deleteQuestion,
  fetchQuestions,
  toggleQuestionHighlight,
  updateQuestionStatus,
  watchQuestions
} from "@/lib/questions";
import type { Question, QuestionStatus } from "@/lib/types";

interface UseQuestionsOptions {
  sessionCode: string;
  filter?: QuestionStatus[];
}

const questionsKey = (sessionCode: string) => ["questions", sessionCode] as const;

export function useQuestions({ sessionCode, filter }: UseQuestionsOptions) {
  const queryClient = useQueryClient();

  const { data: questions, isFetching } = useSuspenseQuery<Question[]>({
    queryKey: questionsKey(sessionCode),
    queryFn: () => fetchQuestions(sessionCode)
  });

  useEffect(() => {
    if (!sessionCode) return;
    return watchQuestions(
      items => queryClient.setQueryData(questionsKey(sessionCode), items),
      sessionCode,
      () => queryClient.invalidateQueries({ queryKey: questionsKey(sessionCode) })
    );
  }, [sessionCode, queryClient]);

  const changeStatusMutation = useMutation<
    void,
    unknown,
    { questionId: string; status: QuestionStatus },
    { previous?: Question[] }
  >({
    mutationFn: ({ questionId, status }: { questionId: string; status: QuestionStatus }) =>
      updateQuestionStatus(questionId, status, sessionCode),
    onMutate: async (variables: { questionId: string; status: QuestionStatus }) => {
      await queryClient.cancelQueries({ queryKey: questionsKey(sessionCode) });
      const previous = queryClient.getQueryData<Question[]>(questionsKey(sessionCode));
      if (previous) {
        queryClient.setQueryData<Question[]>(
          questionsKey(sessionCode),
          previous.map((question: Question) =>
            question.id === variables.questionId ? { ...question, status: variables.status } : question
          )
        );
      }
      return { previous };
    },
    onError: (
      _error: unknown,
      _variables: { questionId: string; status: QuestionStatus } | undefined,
      context: { previous?: Question[] } | undefined
    ) => {
      if (context?.previous) {
        queryClient.setQueryData(questionsKey(sessionCode), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: questionsKey(sessionCode) });
    }
  });

  const deleteMutation = useMutation<void, unknown, string, { previous?: Question[] }>({
    mutationFn: (questionId: string) => deleteQuestion(questionId, sessionCode),
    onMutate: async (questionId: string) => {
      await queryClient.cancelQueries({ queryKey: questionsKey(sessionCode) });
      const previous = queryClient.getQueryData<Question[]>(questionsKey(sessionCode));
      if (previous) {
        queryClient.setQueryData<Question[]>(
          questionsKey(sessionCode),
          previous.filter((question: Question) => question.id !== questionId)
        );
      }
      return { previous };
    },
    onError: (
      _error: unknown,
      _questionId: string | undefined,
      context: { previous?: Question[] } | undefined
    ) => {
      if (context?.previous) {
        queryClient.setQueryData(questionsKey(sessionCode), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: questionsKey(sessionCode) });
    }
  });

  const reactionMutation = useMutation<
    void,
    unknown,
    { questionId: string; delta: 1 | -1 },
    { previous?: Question[] }
  >({
    mutationFn: ({
      questionId,
      delta
    }: {
      questionId: string;
      delta: 1 | -1;
    }) => addReaction(questionId, "like", delta, sessionCode),
    onMutate: async (variables: { questionId: string; delta: 1 | -1 }) => {
      await queryClient.cancelQueries({ queryKey: questionsKey(sessionCode) });
      const previous = queryClient.getQueryData<Question[]>(questionsKey(sessionCode));
      if (previous) {
        queryClient.setQueryData<Question[]>(
          questionsKey(sessionCode),
          previous.map((question: Question) =>
            question.id === variables.questionId
              ? {
                  ...question,
                  like: (question.like ?? 0) + variables.delta
                }
              : question
          )
        );
      }
      return { previous };
    },
    onError: (
      _error: unknown,
      _variables: { questionId: string; delta: 1 | -1 } | undefined,
      context: { previous?: Question[] } | undefined
    ) => {
      if (context?.previous) {
        queryClient.setQueryData(questionsKey(sessionCode), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: questionsKey(sessionCode) });
    }
  });

  const filteredQuestions = useMemo(() => {
    if (!filter?.length) return questions;
    return questions.filter(question => filter.includes(question.status));
  }, [filter, questions]);

  const highlightMutation = useMutation<
    void,
    unknown,
    { questionId: string; highlighted: boolean },
    { previous?: Question[] }
  >({
    mutationFn: ({ questionId, highlighted }: { questionId: string; highlighted: boolean }) =>
      toggleQuestionHighlight(questionId, highlighted, sessionCode),
    onMutate: async (variables: { questionId: string; highlighted: boolean }) => {
      await queryClient.cancelQueries({ queryKey: questionsKey(sessionCode) });
      const previous = queryClient.getQueryData<Question[]>(questionsKey(sessionCode));
      if (previous) {
        queryClient.setQueryData<Question[]>(
          questionsKey(sessionCode),
          previous.map((question: Question) => {
            // 하이라이트하려는 경우: 다른 공개된 질문들의 하이라이트 해제
            if (variables.highlighted && question.status === "approved") {
              if (question.id === variables.questionId) {
                return { ...question, highlighted: true };
              } else if (question.highlighted) {
                return { ...question, highlighted: false };
              }
            } else if (question.id === variables.questionId) {
              // 하이라이트 해제
              return { ...question, highlighted: false };
            }
            return question;
          })
        );
      }
      return { previous };
    },
    onError: (
      _error: unknown,
      _variables: { questionId: string; highlighted: boolean } | undefined,
      context: { previous?: Question[] } | undefined
    ) => {
      if (context?.previous) {
        queryClient.setQueryData(questionsKey(sessionCode), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: questionsKey(sessionCode) });
    }
  });

  return {
    questions: filteredQuestions,
    isFetching,
    reaction: (questionId: string, delta: 1 | -1 = 1) =>
      reactionMutation.mutateAsync({ questionId, delta }),
    changeStatus: (questionId: string, status: QuestionStatus) =>
      changeStatusMutation.mutate({ questionId, status }),
    remove: (questionId: string) => deleteMutation.mutate(questionId),
    toggleHighlight: (questionId: string, highlighted: boolean) =>
      highlightMutation.mutate({ questionId, highlighted })
  };
}
