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

