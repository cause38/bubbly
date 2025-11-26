interface RoomViewSkeletonProps {
  questionCount?: number;
}

export function RoomViewSkeleton({ questionCount = 3 }: RoomViewSkeletonProps) {
  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-8 px-4">
      <div className="h-32 rounded-2xl border border-slate-300 bg-slate-300 dark:border-slate-800 dark:bg-slate-900/60 animate-pulse" />
      <div className="h-20 rounded-xl border border-slate-300 bg-slate-200 dark:border-slate-800 dark:bg-slate-900/40 animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: questionCount }).map((_, index) => (
          <div
            key={index}
            className="h-28 rounded-xl border border-slate-300 bg-slate-200 dark:border-slate-800 dark:bg-slate-900/40 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

