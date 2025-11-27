"use client";

import {
  DateRangeInputs,
  SessionTitleInput,
} from "@/components/session-form-inputs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createSession } from "@/lib/questions";
import type { SessionState } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    uid: string;
    displayName: string | null;
    email: string | null;
  } | null;
}

export function CreateSessionModal({
  open,
  onOpenChange,
  user,
}: CreateSessionModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const createSessionMutation = useMutation<SessionState>({
    mutationFn: async () => {
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      if (!title.trim()) {
        throw new Error("세션 제목을 입력해주세요.");
      }
      if (!startDate || !endDate) {
        throw new Error("시작 날짜와 종료 날짜는 필수입니다.");
      }
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      if (start > end) {
        throw new Error("시작 날짜가 종료 날짜보다 늦을 수 없습니다.");
      }
      return createSession(
        {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
        },
        title.trim(),
        undefined,
        start,
        end
      );
    },
    onSuccess: (session: SessionState) => {
      toast.success("새로운 방이 생성되었습니다!");
      setTitle("");
      setStartDate("");
      setEndDate("");
      onOpenChange(false);
      router.push(`/room/${session.code}`);
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("방 생성에 실패했습니다.");
      }
    },
  });

  const handleCreateSession = () => {
    if (!user) {
      toast.error("먼저 진행자 계정으로 로그인해주세요.");
      return;
    }
    if (!title.trim()) {
      toast.error("세션 제목을 입력해주세요.");
      return;
    }
    createSessionMutation.mutate();
  };

  const handleClose = () => {
    onOpenChange(false);
    setTitle("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 방 만들기</DialogTitle>
          <DialogDescription>
            방을 생성한 진행자는 자동으로 방장으로 지정되며, <br />
            이후 해당 계정으로만 질문 승인 및 반려가 가능합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <DateRangeInputs
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            defaultStartDate=""
            required
          />
          <SessionTitleInput
            value={title}
            onChange={setTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter" && title.trim()) {
                handleCreateSession();
              }
            }}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            취소
          </Button>
          <Button
            onClick={handleCreateSession}
            disabled={
              !title.trim() ||
              !startDate ||
              !endDate ||
              createSessionMutation.isPending
            }
          >
            {createSessionMutation.isPending ? "방 생성 중..." : "방 만들기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
