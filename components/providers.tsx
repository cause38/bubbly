"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { observeAuth } from "@/lib/firebase";
import { useSessionStore } from "@/lib/stores/session-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const setUser = useSessionStore(state => state.setUser);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false
          }
        }
      })
  );

  useEffect(() => {
    const unsubscribe = observeAuth(user => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [setUser]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-center" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

