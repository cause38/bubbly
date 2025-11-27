import { clsx, type ClassValue } from "clsx";
import type { Metadata } from "next";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 앱 관련 상수
export const APP_NAME = "Bubbly";

// 메타데이터 관련 상수 및 유틸리티
export const getSiteUrl = () => {
  return process.env.NEXT_PUBLIC_SITE_URL || "";
};

export const getOgImageUrl = () => {
  return `${getSiteUrl()}/og-image.png`;
};

// 기본 OG 이미지 설정
export const getDefaultOgImage = (alt?: string) => ({
  url: getOgImageUrl(),
  width: 1200,
  height: 630,
  alt: alt || `${APP_NAME} 실시간 Q&A 세션`,
  type: "image/png" as const,
});

// 공통 메타데이터 생성 함수
export function createMetadata({
  title,
  description,
  url,
  ogImageAlt,
}: {
  title: string;
  description: string;
  url?: string;
  ogImageAlt?: string;
}): Metadata {
  const siteUrl = getSiteUrl();
  const ogImage = getDefaultOgImage(ogImageAlt);

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    openGraph: {
      title,
      description,
      url: url || "/",
      siteName: APP_NAME,
      locale: "ko_KR",
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
  };
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
  "유쾌한",
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
  "반딧불",
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

    // 최대 2개만 유지
    const limitedSessions = visitedSessions.slice(0, 2);

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

// iOS 포함 모든 플랫폼에서 작동하는 복사 함수
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const canUseModernClipboard =
    typeof navigator.clipboard !== "undefined" &&
    typeof navigator.clipboard.writeText === "function" &&
    window.isSecureContext;

  if (canUseModernClipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn("Clipboard API failed, falling back to legacy copy.", error);
    }
  }

  return fallbackCopyToClipboard(text);
}

// Fallback 복사 함수 (iOS 호환)
function fallbackCopyToClipboard(text: string): boolean {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.contentEditable = "true";
    textarea.readOnly = true;
    textarea.style.position = "fixed";
    textarea.style.left = "-999999px";
    textarea.style.top = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);

    const isIOS = /ipad|iphone|ipod/i.test(navigator.userAgent);

    // iOS에서는 selection 방식을 다르게 처리
    if (isIOS) {
      textarea.contentEditable = "true";
      textarea.readOnly = false;
      const range = document.createRange();
      range.selectNodeContents(textarea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textarea.setSelectionRange(0, 999999);
      textarea.contentEditable = "false";
    } else {
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
    }

    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return successful;
  } catch (error) {
    console.error("Fallback copy failed:", error);
    return false;
  }
}
