"use client";

import { create } from "zustand";
import type { FirebaseUser } from "@/lib/firebase";

interface SessionStoreState {
  sessionCode: string | null;
  user: FirebaseUser | null;
  nickname: string;
  setSessionCode: (code: string) => void;
  setUser: (user: FirebaseUser | null) => void;
  setNickname: (nickname: string) => void;
}

export const useSessionStore = create<SessionStoreState>(set => ({
  sessionCode: null,
  user: null,
  nickname: "",
  setSessionCode: code => set({ sessionCode: code }),
  setUser: user => set({ user }),
  setNickname: nickname => set({ nickname })
}));

