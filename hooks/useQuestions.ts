"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  addComment,
  addReaction,
  deleteQuestion,
  fetchQuestions,
  updateQuestionStatus,
  watchQuestions
} from "@/lib/questions";
import type { Question, QuestionComment, QuestionStatus } from "@/lib/types";

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
    { questionId: string; emoji: "like" | "love"; delta: 1 | -1 },
    { previous?: Question[] }
  >({
    mutationFn: ({
      questionId,
      emoji,
      delta
    }: {
      questionId: string;
      emoji: "like" | "love";
      delta: 1 | -1;
    }) => addReaction(questionId, emoji, delta, sessionCode),
    onMutate: async (variables: { questionId: string; emoji: "like" | "love"; delta: 1 | -1 }) => {
      await queryClient.cancelQueries({ queryKey: questionsKey(sessionCode) });
      const previous = queryClient.getQueryData<Question[]>(questionsKey(sessionCode));
      if (previous) {
        queryClient.setQueryData<Question[]>(
          questionsKey(sessionCode),
          previous.map((question: Question) =>
            question.id === variables.questionId
              ? {
                  ...question,
                  reaction: {
                    ...question.reaction,
                    [variables.emoji]:
                      (question.reaction[variables.emoji] ?? 0) + variables.delta
                  }
                }
              : question
          )
        );
      }
      return { previous };
    },
    onError: (
      _error: unknown,
      _variables:
        | {
            questionId: string;
            emoji: "like" | "love";
            delta: 1 | -1;
          }
        | undefined,
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

  const commentMutation = useMutation<
    QuestionComment | void,
    unknown,
    { questionId: string; author: string; content: string },
    { previous?: Question[]; tempId: string }
  >({
    mutationFn: ({
      questionId,
      author,
      content
    }: {
      questionId: string;
      author: string;
      content: string;
    }) => addComment(questionId, { author, content }, sessionCode),
    onMutate: async (variables: { questionId: string; author: string; content: string }) => {
      await queryClient.cancelQueries({ queryKey: questionsKey(sessionCode) });
      const previous = queryClient.getQueryData<Question[]>(questionsKey(sessionCode));
      const tempId = `temp-comment-${Date.now()}`;
      if (previous) {
        queryClient.setQueryData<Question[]>(
          questionsKey(sessionCode),
          previous.map((question: Question) =>
            question.id === variables.questionId
              ? {
                  ...question,
                  comments: [
                    ...question.comments,
                    {
                      id: tempId,
                      author: variables.author,
                      content: variables.content,
                      createdAt: Date.now()
                    }
                  ]
                }
              : question
          )
        );
      }
      return { previous, tempId };
    },
    onError: (
      _error: unknown,
      _variables:
        | {
            questionId: string;
            author: string;
            content: string;
          }
        | undefined,
      context: { previous?: Question[]; tempId: string } | undefined
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

  return {
    questions: filteredQuestions,
    isFetching,
    reaction: (questionId: string, emoji: "like" | "love", delta: 1 | -1 = 1) =>
      reactionMutation.mutate({ questionId, emoji, delta }),
    comment: (questionId: string, payload: { author: string; content: string }) =>
      commentMutation.mutate({
        questionId,
        author: payload.author,
        content: payload.content
      }),
    changeStatus: (questionId: string, status: QuestionStatus) =>
      changeStatusMutation.mutate({ questionId, status }),
    remove: (questionId: string) => deleteMutation.mutate(questionId)
  };
}
