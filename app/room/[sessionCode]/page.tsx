import { RoomView } from "@/components/views/room-view";
import { RoomViewSkeleton } from "@/components/views/room-view-skeleton";
import { fetchSession } from "@/lib/questions";
import { APP_NAME, createMetadata } from "@/lib/utils";
import type { Metadata } from "next";
import { Suspense } from "react";

interface RoomPageProps {
  params: Promise<{
    sessionCode: string;
  }>;
}

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  const { sessionCode } = await params;
  const code = decodeURIComponent(sessionCode);
  const session = await fetchSession(code);

  const title = session?.title || APP_NAME;
  const description = session
    ? `${session.title} - 실시간 Q&A 세션`
    : "실시간 Q&A 진행자 컨펌 기반 소통 플랫폼";

  return createMetadata({
    title,
    description,
    url: `/room/${code}`,
    ogImageAlt: `${title} - ${APP_NAME}`,
  });
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
