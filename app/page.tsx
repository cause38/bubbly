import { Suspense } from "react";
import { HomeView } from "@/components/views/home-view";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-400">로딩 중...</div>}>
      <HomeView />
    </Suspense>
  );
}

