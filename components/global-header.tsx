"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signInWithGoogle, signOutUser } from "@/lib/firebase";
import { useSessionStore } from "@/lib/stores/session-store";
import { toast } from "sonner";

export function GlobalHeader() {
  const { user } = useSessionStore(state => ({
    user: state.user
  }));
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      toast.success("로그인 되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOutUser();
      toast.success("로그아웃 되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("로그아웃에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl">
      <Link href="/" className="text-lg font-bold tracking-tight text-white">
        Bubbly
      </Link>
      <div className="flex items-center gap-3 text-xs text-slate-200">
        {user ? (
          <>
            <span className="hidden sm:block">
              {user.displayName ?? user.email ?? "로그인됨"}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSignOut}
              disabled={loading}
              className="text-slate-200 hover:text-white"
            >
              로그아웃
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSignIn}
            disabled={loading}
          >
            로그인
          </Button>
        )}
      </div>
    </header>
  );
}

