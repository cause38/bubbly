"use client";

import { useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface SessionTitleInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function SessionTitleInput({
  value,
  onChange,
  placeholder = "방 이름을 입력하세요",
  onKeyDown,
}: SessionTitleInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-900 dark:text-slate-200">방 이름</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}

interface DateRangeInputsProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  defaultStartDate?: string;
  readOnly?: boolean;
  required?: boolean;
}

export function DateRangeInputs({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  defaultStartDate,
  readOnly = false,
  required = false,
}: DateRangeInputsProps) {
  const todayStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;
  }, []);

  const maxEndDate = useMemo(() => {
    if (!startDate) return undefined;
    const start = new Date(startDate);
    const maxDate = new Date(start);
    maxDate.setDate(maxDate.getDate() + 7);
    return `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(maxDate.getDate()).padStart(2, "0")}`;
  }, [startDate]);

  // 시작 날짜가 없으면 오늘 날짜로 설정
  useEffect(() => {
    if (!startDate && defaultStartDate !== undefined && !readOnly) {
      onStartDateChange(defaultStartDate || todayStr);
    }
  }, [startDate, defaultStartDate, todayStr, onStartDateChange, readOnly]);

  const handleStartDateChange = (value: string) => {
    if (readOnly) return;
    onStartDateChange(value);
    // 시작 날짜 변경 시 종료 날짜가 범위를 벗어나면 조정
    if (endDate && value) {
      const newStart = new Date(value);
      const newEnd = new Date(endDate);
      const maxEnd = new Date(newStart);
      maxEnd.setDate(maxEnd.getDate() + 7);
      if (newEnd > maxEnd || newEnd < newStart) {
        const defaultEnd = new Date(newStart);
        defaultEnd.setDate(defaultEnd.getDate() + 7);
        const defaultEndStr = `${defaultEnd.getFullYear()}-${String(
          defaultEnd.getMonth() + 1
        ).padStart(2, "0")}-${String(defaultEnd.getDate()).padStart(2, "0")}`;
        onEndDateChange(defaultEndStr);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (readOnly) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900 dark:text-slate-200">
            시작 날짜 {required && <span className="text-red-500 dark:text-red-400">*</span>}
          </label>
          <div className="mt-1 text-sm text-slate-900 dark:text-white">
            {startDate ? formatDate(startDate) : "-"}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900 dark:text-slate-200">
            종료 날짜 {required && <span className="text-red-500 dark:text-red-400">*</span>}
          </label>
          <div className="mt-1 text-sm text-slate-900 dark:text-white">
            {endDate ? formatDate(endDate) : "-"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-900 dark:text-slate-200">
          시작 날짜 {required && <span className="text-red-500 dark:text-red-400">*</span>}
        </label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => handleStartDateChange(e.target.value)}
          min={todayStr}
          required={required}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-900 dark:text-slate-200">
          종료 날짜 {required && <span className="text-red-500 dark:text-red-400">*</span>}
        </label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => !readOnly && onEndDateChange(e.target.value)}
          min={startDate || todayStr}
          max={maxEndDate}
          required={required}
        />
      </div>
    </div>
  );
}

export function getMaxEndDate(
  startDate: string | undefined
): string | undefined {
  if (!startDate) return undefined;
  const start = new Date(startDate);
  const maxDate = new Date(start);
  maxDate.setDate(maxDate.getDate() + 7);
  return `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(maxDate.getDate()).padStart(2, "0")}`;
}
