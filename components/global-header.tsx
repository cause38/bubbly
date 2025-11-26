"use client";

import { CreateSessionModal } from "@/components/create-session-modal";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { signInWithGoogle, signOutUser } from "@/lib/firebase";
import { useSessionStore } from "@/lib/stores/session-store";
import { LogIn, LogOut, Menu, Moon, PlusCircle, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function GlobalHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, sessionTitle, isRoomDrawerOpen, setRoomDrawerOpen } =
    useSessionStore((state) => ({
      user: state.user,
      sessionTitle: state.sessionTitle,
      isRoomDrawerOpen: state.isRoomDrawerOpen,
      setRoomDrawerOpen: state.setRoomDrawerOpen,
    }));
  const inRoom = pathname.startsWith("/room/");
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 테마가 마운트되었는지 확인 (hydration 이슈 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setIsPopoverOpen(false);
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
      setIsPopoverOpen(false);
      await signOutUser();
      toast.success("로그아웃 되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("로그아웃에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    if (!user) {
      toast.error("먼저 로그인해주세요.");
      handleSignIn();
      return;
    }
    setIsPopoverOpen(false);
    setIsCreateModalOpen(true);
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-brand/80 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-black/40">
      <div className="flex items-center gap-3">
        {inRoom && (
          <Button
            variant="secondary"
            theme="slate"
            className="h-8 w-8 p-0"
            onClick={() => setRoomDrawerOpen(!isRoomDrawerOpen)}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">방 메뉴 토글</span>
          </Button>
        )}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-white dark:text-white"
        >
          Bubbly
        </Link>
        {inRoom && sessionTitle ? (
          <span className="ml-2 max-w-[160px] truncate text-sm text-white dark:text-slate-200/80 sm:max-w-xs">
            {sessionTitle}
          </span>
        ) : null}
      </div>
      <div className="flex items-center">
        {mounted && (
          <Button
            size="sm"
            variant="text"
            theme="slate"
            className="h-9 w-9 p-0"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="sr-only">테마 전환</span>
          </Button>
        )}
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="text"
              theme="slate"
              className="h-9 w-9 p-0"
            >
              <User className="h-4 w-4 shrink-0" />
              <span className="sr-only">사용자 메뉴</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="end">
            {user ? (
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
                  {user.displayName ?? user.email ?? "(알 수 없는 사용자)"}
                </div>
                <Separator />
                <button
                  onClick={handleOpenCreateModal}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <PlusCircle className="h-4 w-4" />방 만들기
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-900 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="p-1">
                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-900 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <LogIn className="h-4 w-4" />
                  호스트 로그인
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <CreateSessionModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        user={user}
      />
    </header>
  );
}
