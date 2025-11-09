export type QuestionStatus = "pending" | "approved" | "answered" | "archived";

export interface QuestionReaction {
  like: number;
  love: number;
}

export interface QuestionComment {
  id: string;
  author: string;
  content: string;
  createdAt: number;
}

export interface QuestionPayload {
  content: string;
  authorName: string;
}

export interface Question extends QuestionPayload {
  id: string;
  status: QuestionStatus;
  reaction: QuestionReaction;
  comments: QuestionComment[];
  createdAt: number;
}

export interface SessionState {
  code: string;
  title: string;
  isActive: boolean;
  createdAt: number;
  endedAt?: number;
  hostUid: string;
  hostDisplayName: string;
  hostEmail?: string | null;
}

