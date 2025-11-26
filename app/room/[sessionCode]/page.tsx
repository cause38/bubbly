import { RoomView } from "@/components/views/room-view";
import { RoomViewSkeleton } from "@/components/views/room-view-skeleton";
import { Suspense } from "react";

interface RoomPageProps {
  params: Promise<{
    sessionCode: string;
  }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { sessionCode } = await params;
  const code = decodeURIComponent(sessionCode);
  return (
    <Suspense fallback={<RoomViewSkeleton />}>
      <RoomView sessionCode={code} />
    </Suspense>
  );
}
