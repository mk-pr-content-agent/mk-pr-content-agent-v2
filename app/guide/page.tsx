"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GuidePage() {
  const [viewMode, setViewMode] = React.useState<"slides" | "pdf">("slides");

  return (
    <div className="min-h-screen bg-surface-subtle flex flex-col">
      <header className="bg-surface border-b-hairline border-line sticky top-0 z-30">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 text-[14px] leading-[22px] text-ink-muted hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4 stroke-[1.5]" />
              <span>작업 목록으로 돌아가기</span>
            </Link>
            <span className="text-line">|</span>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary stroke-[1.75]" />
              <h1 className="text-[16px] leading-[24px] font-semibold text-ink">
                매경 PR사업팀 콘텐츠 작성 에이전트 실무 사용 가이드 (PPT/PDF)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={viewMode === "slides" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setViewMode("slides")}
            >
              슬라이드 화면 보기
            </Button>
            <Button
              type="button"
              variant={viewMode === "pdf" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setViewMode("pdf")}
            >
              PDF 뷰어로 보기
            </Button>
            <a
              href="/guide/매경_PR사업팀_콘텐츠작성에이전트_사용가이드.pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-[32px] items-center gap-1.5 rounded-md border-hairline border-line bg-surface px-3 text-[13px] font-medium text-ink hover:bg-surface-subtle"
            >
              <ExternalLink className="h-3.5 w-3.5 stroke-[1.5]" />
              <span>새 탭에서 PDF 열기</span>
            </a>
            <a
              href="/guide/매경_PR사업팀_콘텐츠작성에이전트_사용가이드.pdf"
              download="매경_PR사업팀_콘텐츠작성에이전트_사용가이드.pdf"
              className="inline-flex h-[32px] items-center gap-1.5 rounded-md border-hairline border-primary bg-primary px-3 text-[13px] font-semibold text-surface hover:bg-primary-hover"
            >
              <Download className="h-3.5 w-3.5 stroke-[1.5]" />
              <span>PDF 가이드 다운로드</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {viewMode === "slides" ? (
          <iframe
            src="/guide/guide.html"
            title="매경 PR사업팀 콘텐츠 작성 에이전트 실무 사용 가이드 슬라이드"
            className="w-full flex-1 min-h-[calc(100vh-58px)] border-0"
          />
        ) : (
          <iframe
            src="/guide/guide.pdf"
            title="매경 PR사업팀 콘텐츠 작성 에이전트 실무 사용 가이드 PDF"
            className="w-full flex-1 min-h-[calc(100vh-58px)] border-0"
          />
        )}
      </main>
    </div>
  );
}
