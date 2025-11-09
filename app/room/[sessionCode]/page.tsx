import { Suspense } from "react";
import { RoomView } from "@/components/views/room-view";

interface RoomPageProps {
  params: Promise<{
    sessionCode: string;
  }>;
}

function RoomSkeleton() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <div className="h-32 rounded-2xl border border-slate-800 bg-slate-900/60 animate-pulse" />
      <div className="h-20 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-28 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { sessionCode } = await params;
  const code = decodeURIComponent(sessionCode);
  return (
    <Suspense fallback={<RoomSkeleton />}>
      <RoomView sessionCode={code} />
    </Suspense>
  );
}
