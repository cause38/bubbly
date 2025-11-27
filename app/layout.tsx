import { GlobalHeader } from "@/components/global-header";
import { Providers } from "@/components/providers";
import { APP_NAME, createMetadata } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const defaultMetadata = createMetadata({
  title: APP_NAME,
  description: "실시간 Q&A 진행자 컨펌 기반 소통 플랫폼",
  url: "/",
});

export const metadata: Metadata = {
  ...defaultMetadata,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <GlobalHeader />
          <main className="py-4 h-[100svh] max-h-[calc(100svh-61px)] overflow-y-auto">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
