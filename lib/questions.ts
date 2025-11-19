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
    like: 0,
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

export async function toggleQuestionHighlight(
  questionId: string,
  highlighted: boolean,
  sessionCode: string
) {
  if (highlighted) {
    // 하이라이트하려는 경우: 다른 공개된 질문들의 하이라이트 해제
    const allQuestions = await fetchQuestions(sessionCode);
    const approvedQuestions = allQuestions.filter(
      (q) => q.status === "approved" && q.id !== questionId && q.highlighted
    );
    
    // 기존 하이라이트된 질문들 해제 및 새로운 질문 하이라이트를 배치로 실행
    const updates: Record<string, any> = {};
    
    // 기존 하이라이트된 질문들 해제
    for (const question of approvedQuestions) {
      updates[`${getQuestionPath(question.id, sessionCode)}/highlighted`] = false;
    }
    
    // 새로운 질문 하이라이트
    updates[`${getQuestionPath(questionId, sessionCode)}/highlighted`] = true;
    
    // 모든 업데이트를 한 번에 실행
    if (Object.keys(updates).length > 0) {
      const { getFirebaseServices } = await import("@/lib/firebase");
      const { db } = getFirebaseServices();
      const { ref, update: firebaseUpdate } = await import("firebase/database");
      const rootRef = ref(db);
      
      // Firebase의 update 함수는 root ref에서 상대 경로를 사용
      await firebaseUpdate(rootRef, updates);
    } else {
      // 새로운 질문만 하이라이트 (기존 하이라이트가 없는 경우)
      await updateItem(getQuestionPath(questionId, sessionCode), { highlighted: true });
    }
  } else {
    // 하이라이트 해제만 하면 됨
    await updateItem(getQuestionPath(questionId, sessionCode), { highlighted: false });
  }
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
  return metadata;
}

export async function reactivateSession(sessionCode: string) {
  await updateItem(`${getSessionPath(sessionCode)}/metadata`, {
    isActive: true,
    endedAt: null,
  });
  const metadata = await readItem<SessionState>(
    `${getSessionPath(sessionCode)}/metadata`
  );
  if (metadata?.hostUid) {
    await updateItem(
      `${getHostSessionsPath(metadata.hostUid)}/${sessionCode}`,
      {
        isActive: true,
        endedAt: null,
      }
    );
  }
  return metadata;
}

export async function updateSession(
  sessionCode: string,
  updates: {
    title?: string;
    startDate?: number;
    endDate?: number;
  }
) {
  const updateData: Partial<SessionState> = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.startDate !== undefined) updateData.startDate = updates.startDate;
  if (updates.endDate !== undefined) updateData.endDate = updates.endDate;

  await updateItem(`${getSessionPath(sessionCode)}/metadata`, updateData);

  const metadata = await readItem<SessionState>(
    `${getSessionPath(sessionCode)}/metadata`
  );
  if (metadata?.hostUid) {
    await updateItem(
      `${getHostSessionsPath(metadata.hostUid)}/${sessionCode}`,
      updateData
    );
  }
  return metadata;
}

export async function deleteSession(sessionCode: string, hostUid: string) {
  // 세션 전체 삭제 (질문들도 함께 삭제됨)
  await deleteItem(getSessionPath(sessionCode));
  // 호스트 세션 목록에서도 삭제
  await deleteItem(`${getHostSessionsPath(hostUid)}/${sessionCode}`);
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
  const sessionsRecord = await readItem<Record<string, any>>("sessions");
  return normalizeHostSessions(sessionsRecord, hostUid);
}

export function watchHostSessions(
  handler: (sessions: SessionState[]) => void,
  hostUid: string,
  onError?: (error: Error) => void
) {
  return subscribe<Record<string, any>>(
    (ref) => ref("sessions"),
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
  code: string | undefined,
  startDate: number,
  endDate: number
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
    startDate,
    endDate,
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
    like: value?.like ?? value?.reaction?.like ?? 0,
    comments: parseComments(value?.comments),
    highlighted: value?.highlighted ?? false,
  }));
  items.sort((a, b) => b.createdAt - a.createdAt);
  return items;
}

function normalizeHostSessions(
  record: Record<string, any> | null,
  hostUid: string
): SessionState[] {
  if (!record) return [];
  const sessions: SessionState[] = [];
  Object.entries(record).forEach(([code, value]) => {
    const data = value?.metadata ?? value;
    if (!data) return;
    if (data.hostUid !== hostUid) return;
    sessions.push({
      code,
      title: data.title ?? "제목 없음",
      createdAt: data.createdAt ?? Date.now(),
      isActive: Boolean(data.isActive),
      endedAt: data.endedAt,
      startDate: data.startDate ?? Date.now(),
      endDate: data.endDate ?? Date.now(),
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
  reaction: "like",
  delta: 1 | -1,
  sessionCode: string
) {
  await updateItem(getQuestionPath(questionId, sessionCode), {
    like: increment(delta),
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
