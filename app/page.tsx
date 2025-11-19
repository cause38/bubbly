import { Suspense } from "react";
import { HomeView } from "@/components/views/home-view";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-slate-400">
          로딩 중...
        </div>
      }
    >
      <HomeView />
    </Suspense>
  );
}
