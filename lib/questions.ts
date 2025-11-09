import { increment } from "firebase/database";
import {
  createItem,
  deleteItem,
  readItem,
  setItem,
  subscribe,
  updateItem,
} from "@/lib/firebase";
import type {
  Question,
  QuestionComment,
  QuestionPayload,
  QuestionStatus,
  SessionState,
} from "@/lib/types";
import { nanoid } from "nanoid";

export function getSessionPath(sessionCode: string) {
  return `sessions/${sessionCode}`;
}

export function getQuestionsPath(sessionCode: string) {
  return `${getSessionPath(sessionCode)}/questions`;
}

export function getQuestionPath(questionId: string, sessionCode: string) {
  return `${getQuestionsPath(sessionCode)}/${questionId}`;
}

export function getHostSessionsPath(hostUid: string) {
  return `hosts/${hostUid}/sessions`;
}

export async function fetchQuestions(sessionCode: string) {
  const data = await readItem<Record<string, any>>(
    getQuestionsPath(sessionCode)
  );
  return normalizeQuestions(data);
}

export function watchQuestions(
  handler: (questions: Question[]) => void,
  sessionCode: string,
  onError?: (error: Error) => void
) {
  return subscribe<Record<string, any>>(
    (ref) => ref(getQuestionsPath(sessionCode)),
    (data) => {
      handler(normalizeQuestions(data));
    },
    onError
  );
}

export function watchSessionState(
  handler: (session: SessionState | null) => void,
  sessionCode: string,
  onError?: (error: Error) => void
) {
  return subscribe<SessionState>(
    (ref) => ref(`${getSessionPath(sessionCode)}/metadata`),
    handler,
    onError
  );
}

export async function submitQuestion(
  payload: QuestionPayload,
  sessionCode: string
) {
  const now = Date.now();
  const question: Question = {
    ...payload,
    id: nanoid(),
    status: "pending",
    reaction: { like: 0, love: 0 },
    comments: [],
    createdAt: now,
  };

  await setItem(getQuestionPath(question.id, sessionCode), question);
  return question;
}

export async function updateQuestionStatus(
  questionId: string,
  status: QuestionStatus,
  sessionCode: string
) {
  await updateItem(getQuestionPath(questionId, sessionCode), { status });
}

export async function deleteQuestion(questionId: string, sessionCode: string) {
  await deleteItem(getQuestionPath(questionId, sessionCode));
}

export async function endSession(sessionCode: string) {
  const now = Date.now();
  await updateItem(`${getSessionPath(sessionCode)}/metadata`, {
    isActive: false,
    endedAt: now,
  });
  const metadata = await readItem<SessionState>(
    `${getSessionPath(sessionCode)}/metadata`
  );
  if (metadata?.hostUid) {
    await updateItem(
      `${getHostSessionsPath(metadata.hostUid)}/${sessionCode}`,
      {
        isActive: metadata.isActive,
        endedAt: metadata.endedAt ?? now,
      }
    );
  }
}

export async function createSessionMetadata(session: SessionState) {
  await setItem(`${getSessionPath(session.code)}/metadata`, session);
  await setItem(
    `${getHostSessionsPath(session.hostUid)}/${session.code}`,
    session
  );
}

export function generateSessionCode(length = 6) {
  return nanoid(length)
    .replace(/[^A-Z0-9]/gi, "")
    .slice(0, length)
    .toUpperCase();
}

export async function fetchSession(sessionCode: string) {
  const metadata = await readItem<SessionState>(
    `${getSessionPath(sessionCode)}/metadata`
  );
  return metadata ?? null;
}

export async function fetchHostSessions(hostUid: string) {
  const sessionsRecord = await readItem<Record<string, SessionState>>(
    getHostSessionsPath(hostUid)
  );
  return normalizeHostSessions(sessionsRecord, hostUid);
}

export function watchHostSessions(
  handler: (sessions: SessionState[]) => void,
  hostUid: string,
  onError?: (error: Error) => void
) {
  return subscribe<Record<string, SessionState>>(
    (ref) => ref(getHostSessionsPath(hostUid)),
    (data) => handler(normalizeHostSessions(data, hostUid)),
    onError
  );
}

interface HostInfo {
  uid: string;
  displayName?: string | null;
  email?: string | null;
}

export async function createSession(
  host: HostInfo,
  title: string,
  code?: string
) {
  const sessionCode = (code ?? generateSessionCode()).toUpperCase();
  const now = Date.now();
  const metadata: SessionState = {
    code: sessionCode,
    title,
    createdAt: now,
    isActive: true,
    hostUid: host.uid,
    hostDisplayName: host.displayName ?? host.email ?? "진행자",
    hostEmail: host.email ?? null,
  };
  await createSessionMetadata(metadata);
  return metadata;
}

function parseComments(data: any): QuestionComment[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.filter(Boolean);
  }
  return Object.values(data) as QuestionComment[];
}

function normalizeQuestions(record: Record<string, any> | null): Question[] {
  if (!record) return [];
  const items = Object.entries(record).map(([id, value]) => ({
    id,
    content: value?.content ?? "",
    authorName: value?.authorName ?? "익명",
    status: value?.status ?? "pending",
    createdAt: value?.createdAt ?? Date.now(),
    reaction: {
      like: value?.reaction?.like ?? 0,
      love: value?.reaction?.love ?? 0,
    },
    comments: parseComments(value?.comments),
  }));
  items.sort((a, b) => b.createdAt - a.createdAt);
  return items;
}

function normalizeHostSessions(
  record: Record<string, SessionState> | null,
  hostUid: string
): SessionState[] {
  if (!record) return [];
  const sessions: SessionState[] = [];
  Object.entries(record).forEach(([code, data]) => {
    if (!data) return;
    sessions.push({
      code,
      title: data.title ?? "제목 없음",
      createdAt: data.createdAt ?? Date.now(),
      isActive: Boolean(data.isActive),
      endedAt: data.endedAt,
      hostUid: data.hostUid ?? hostUid,
      hostDisplayName: data.hostDisplayName ?? "진행자",
      hostEmail: data.hostEmail ?? null,
    });
  });
  sessions.sort((a, b) => b.createdAt - a.createdAt);
  return sessions;
}

export async function addReaction(
  questionId: string,
  reaction: keyof Question["reaction"],
  delta: 1 | -1,
  sessionCode: string
) {
  await updateItem(getQuestionPath(questionId, sessionCode), {
    [`reaction/${reaction}`]: increment(delta),
  });
}

export async function addComment(
  questionId: string,
  payload: { author: string; content: string },
  sessionCode: string
) {
  const id = nanoid();
  const comment: QuestionComment = {
    id,
    author: payload.author,
    content: payload.content,
    createdAt: Date.now(),
  };
  await createItem(
    `${getQuestionPath(questionId, sessionCode)}/comments`,
    comment
  );
  return comment;
}
