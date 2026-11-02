import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "매경 PR사업팀 콘텐츠 작성 에이전트",
  description: "보도자료 규정 점검 및 기사식광고 초안 작성 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-w-[1280px] min-h-screen bg-surface-subtle text-ink">
        {children}
      </body>
    </html>
  );
}
