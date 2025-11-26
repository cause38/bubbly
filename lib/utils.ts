import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const adjectives = [
  "활기찬",
  "빛나는",
  "재빠른",
  "용감한",
  "반짝이는",
  "차분한",
  "즐거운",
  "따뜻한",
  "산뜻한",
  "유쾌한"
];

const nouns = [
  "고래",
  "여우",
  "별빛",
  "바람",
  "새벽",
  "단비",
  "노을",
  "하모니",
  "파도",
  "반딧불"
];

export function generateNickname() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const suffix = Math.floor(Math.random() * 90 + 10); // 10~99
  return `${adjective} ${noun}${suffix}`;
}

// 방문한 방 정보 타입
export interface VisitedSession {
  code: string;
  title: string;
  createdAt: number;
  isActive: boolean;
  lastVisitedAt: number;
}

const VISITED_SESSIONS_KEY = "bubbly:visited-sessions";

// 방문한 방 목록 가져오기
export function getVisitedSessions(): VisitedSession[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = window.localStorage.getItem(VISITED_SESSIONS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("방문한 방 목록을 불러오지 못했습니다.", error);
    return [];
  }
}

// 방문한 방 추가/업데이트
export function addVisitedSession(session: {
  code: string;
  title: string;
  createdAt: number;
  isActive: boolean;
}): void {
  if (typeof window === "undefined") return;
  
  try {
    const visitedSessions = getVisitedSessions();
    const existingIndex = visitedSessions.findIndex(
      (s) => s.code === session.code
    );
    
    const visitedSession: VisitedSession = {
      ...session,
      lastVisitedAt: Date.now(),
    };
    
    if (existingIndex >= 0) {
      // 기존 방문 기록 업데이트
      visitedSessions[existingIndex] = visitedSession;
    } else {
      // 새로운 방문 기록 추가
      visitedSessions.unshift(visitedSession);
    }
    
    // 최근 방문 순으로 정렬
    visitedSessions.sort((a, b) => b.lastVisitedAt - a.lastVisitedAt);
    
    // 최대 50개만 유지
    const limitedSessions = visitedSessions.slice(0, 50);
    
    window.localStorage.setItem(
      VISITED_SESSIONS_KEY,
      JSON.stringify(limitedSessions)
    );
    
    // 같은 탭에서 변경 감지를 위한 커스텀 이벤트 발생
    window.dispatchEvent(new Event("bubbly:visited-sessions-updated"));
  } catch (error) {
    console.error("방문한 방을 저장하지 못했습니다.", error);
  }
}

