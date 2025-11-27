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
import { updateSession } from "@/lib/questions";
import { useSessionStore } from "@/lib/stores/session-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionCode: string;
  sessionTitle: string;
  sessionStartDate: number;
  sessionEndDate: number;
}

export function EditSessionModal({
  open,
  onOpenChange,
  sessionCode,
  sessionTitle,
  sessionStartDate,
  sessionEndDate,
}: EditSessionModalProps) {
  const { setSessionTitle } = useSessionStore((state) => ({
    setSessionTitle: state.setSessionTitle,
  }));
  const queryClient = useQueryClient();
  const [editTitle, setEditTitle] = useState(sessionTitle);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  // 세션 정보가 변경되면 폼 값 업데이트
  useEffect(() => {
    if (open && sessionTitle) {
      setEditTitle(sessionTitle);
      const startDate = new Date(sessionStartDate);
      const startStr = `${startDate.getFullYear()}-${String(
        startDate.getMonth() + 1
      ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
      setEditStartDate(startStr);

      const endDate = new Date(sessionEndDate);
      const endStr = `${endDate.getFullYear()}-${String(
        endDate.getMonth() + 1
      ).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
      setEditEndDate(endStr);
    }
  }, [open, sessionTitle, sessionStartDate, sessionEndDate]);

  const updateSessionMutation = useMutation({
    mutationFn: async () => {
      // Firebase 보안 규칙: 기존 세션의 startDate와 endDate는 변경할 수 없음
      // title만 수정 가능
      return updateSession(sessionCode, {
        title: editTitle.trim(),
      });
    },
    onSuccess: (updatedSession: { title?: string } | undefined) => {
      toast.success("방 정보가 수정되었습니다.");
      onOpenChange(false);
      if (updatedSession?.title) {
        setSessionTitle(updatedSession.title);
      }
      queryClient.invalidateQueries({ queryKey: ["session", sessionCode] });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("방 정보 수정에 실패했습니다.");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>방 정보 수정</DialogTitle>
          <DialogDescription>
            방 이름만 수정 가능하며, 그 외 설정은 변경할 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <SessionTitleInput
            value={editTitle}
            onChange={setEditTitle}
            placeholder="방 이름을 입력하세요"
          />
          <DateRangeInputs
            startDate={editStartDate}
            endDate={editEndDate}
            onStartDateChange={setEditStartDate}
            onEndDateChange={setEditEndDate}
            readOnly
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={() => updateSessionMutation.mutate()}
            disabled={!editTitle.trim() || updateSessionMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
