"use client";

import { create } from "zustand";
import type { FirebaseUser } from "@/lib/firebase";

interface SessionStoreState {
  sessionCode: string | null;
  user: FirebaseUser | null;
  sessionTitle: string | null;
  isRoomDrawerOpen: boolean;
  setSessionCode: (code: string) => void;
  setUser: (user: FirebaseUser | null) => void;
  setSessionTitle: (title: string | null) => void;
  setRoomDrawerOpen: (open: boolean) => void;
}

export const useSessionStore = create<SessionStoreState>(set => ({
  sessionCode: null,
  user: null,
  sessionTitle: null,
  isRoomDrawerOpen: false,
  setSessionCode: code => set({ sessionCode: code }),
  setUser: user => set({ user }),
  setSessionTitle: title => set({ sessionTitle: title }),
  setRoomDrawerOpen: open => set({ isRoomDrawerOpen: open })
}));

