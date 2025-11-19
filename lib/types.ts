export type QuestionStatus = "pending" | "approved" | "answered" | "archived";

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
  like: number;
  comments: QuestionComment[];
  createdAt: number;
  highlighted?: boolean;
}

export interface SessionState {
  code: string;
  title: string;
  isActive: boolean;
  createdAt: number;
  endedAt?: number;
  startDate: number;
  endDate: number;
  hostUid: string;
  hostDisplayName: string;
  hostEmail?: string | null;
}
