"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Plus, FileText, Search, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LogoutButton } from "@/components/logout-button";
import { ApiUsageBar } from "@/components/api-usage-bar";
import { VerdictBadge } from "@/components/verdict-badge";
import type { VerdictType } from "@/lib/pipeline/types";

interface JobListItem {
  id: string;
  mode: "ad_article" | "comparative";
  status: string;
  verdict: VerdictType | null;
  company_name: string | null;
  articleTitle: string;
  approved: boolean;
  created_at: string;
}

export function JobsListClient({
  initialJobs,
  userEmail,
  userRole,
}: {
  initialJobs: JobListItem[];
  userEmail: string;
  userRole: string;
}) {
  const [jobsList, setJobsList] = React.useState<JobListItem[]>(initialJobs);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  async function handleDeleteJob(
    e: React.MouseEvent,
    jobId: string,
    title: string
  ) {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `'${title}' 작업을 삭제하시겠습니까?\n(삭제된 작업은 복구할 수 없습니다.)`
    );
    if (!confirmed) return;

    setDeletingId(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (res.ok) {
        setJobsList((prev) => prev.filter((item) => item.id !== jobId));
      }
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = jobsList.filter((j) => {
    if (filterStatus === "hold" && j.verdict !== "HOLD") return false;
    if (filterStatus === "rejected" && j.verdict !== "REJECT") return false;
    if (filterStatus === "approved" && !j.approved) return false;
    if (
      filterStatus === "in_progress" &&
      (j.approved || j.verdict === "REJECT")
    ) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const companyMatch = (j.company_name ?? "").toLowerCase().includes(q);
      const titleMatch = j.articleTitle.toLowerCase().includes(q);
      if (!companyMatch && !titleMatch) return false;
    }

    return true;
  });

  const filterTabs = [
    { id: "all", label: "전체" },
    { id: "in_progress", label: "작성/검수중" },
    { id: "hold", label: "보류(HOLD)" },
    { id: "rejected", label: "반려(REJECT)" },
    { id: "approved", label: "승인완료" },
  ];

  return (
    <div className="min-h-screen bg-surface-subtle">
      <header className="bg-surface border-b-hairline border-line">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/jobs"
              className="text-[16px] leading-[24px] font-semibold text-ink"
            >
              매경 PR사업팀 콘텐츠 작성 에이전트
            </Link>
            <nav className="flex items-center gap-4 text-[14px] leading-[22px]">
              <Link
                href="/jobs"
                className="font-medium text-primary"
              >
                작업 목록
              </Link>
              <Link
                href="/jobs/new"
                className="text-ink-muted hover:text-ink"
              >
                새 작업
              </Link>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1 text-ink-muted hover:text-ink"
              >
                <Settings className="h-3.5 w-3.5 stroke-[1.5]" />
                <span>룰북·매체 설정</span>
              </Link>
              <Link
                href="/guide"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                <BookOpen className="h-3.5 w-3.5 stroke-[1.5]" />
                <span>사용 가이드</span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/guide">
              <Button type="button" variant="secondary" size="sm" className="gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary stroke-[1.75]" />
                <span>사용 가이드</span>
              </Button>
            </Link>
            <ApiUsageBar />
            <span className="text-[12px] leading-[18px] text-ink-muted">
              {userEmail} ({userRole})
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] leading-[28px] font-semibold text-ink">
              작업 목록
            </h1>
            <p className="mt-1 text-[12px] leading-[18px] text-ink-muted">
              보도자료 규정 점검(S0~S10) 및 기사식광고 초안 작성 이력을 관리합니다.
            </p>
          </div>

          <Link href="/jobs/new">
            <Button type="button" variant="primary" className="gap-1.5">
              <Plus className="h-4 w-4 stroke-[1.5]" />
              <span>새 작업</span>
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 rounded-md border-hairline border-line bg-surface p-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`rounded-md px-3 py-1.5 text-[12px] leading-[18px] font-medium transition-colors duration-150 ${
                  filterStatus === tab.id
                    ? "bg-primary-subtle text-primary"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-muted stroke-[1.5]" />
            <Input
              placeholder="기업명 또는 기사 제목 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="grid grid-cols-12 bg-surface-subtle px-4 py-3 border-b-hairline border-line text-[12px] leading-[18px] font-medium text-ink-muted">
            <div className="col-span-2">판정 / 승인</div>
            <div className="col-span-2">작성 모드</div>
            <div className="col-span-2">기업·기관명</div>
            <div className="col-span-4">기사 제목 (초안)</div>
            <div className="col-span-2 flex items-center justify-between">
              <span>작성일시</span>
              <span>관리</span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <FileText className="h-6 w-6 text-ink-muted stroke-[1.5] mb-2" />
              <p className="text-[14px] leading-[22px] text-ink">
                등록된 작업이 없습니다.
              </p>
              <p className="mt-1 text-[12px] leading-[18px] text-ink-muted">
                우측 상단의 새 작업 버튼을 눌러 보도자료 검토를 시작하십시오.
              </p>
              <div className="mt-4">
                <Link href="/jobs/new">
                  <Button type="button" variant="secondary" size="sm">
                    새 작업 시작하기
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y-hairline divide-line">
              {filtered.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="grid grid-cols-12 items-center px-4 py-3 text-[14px] leading-[22px] hover:bg-surface-subtle transition-colors duration-150"
                >
                  <div className="col-span-2 flex items-center gap-2">
                    <VerdictBadge verdict={job.verdict} />
                    {job.approved && (
                      <span className="inline-flex h-[24px] items-center rounded-md border-hairline border-pass bg-pass-bg px-2 text-[12px] leading-[18px] font-medium text-pass">
                        승인완료
                      </span>
                    )}
                  </div>
                  <div className="col-span-2">
                    {job.mode === "comparative" ? (
                      <span className="inline-flex h-[24px] items-center rounded-md border-hairline border-secondary bg-secondary-subtle px-2 text-[12px] leading-[18px] font-medium text-secondary">
                        비교·기획 (실험)
                      </span>
                    ) : (
                      <span className="text-[12px] leading-[18px] text-ink-muted">
                        기사식광고
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 font-medium text-ink truncate pr-2">
                    {job.company_name || "미지정"}
                  </div>
                  <div className="col-span-4 text-ink truncate pr-4">
                    {job.articleTitle}
                  </div>
                  <div className="col-span-2 flex items-center justify-between gap-2 text-[12px] leading-[18px] text-ink-muted">
                    <span className="whitespace-nowrap">
                      {new Date(job.created_at).toLocaleString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === job.id}
                      onClick={(e) =>
                        handleDeleteJob(e, job.id, job.articleTitle)
                      }
                      className="h-[26px] px-2 text-[12px] text-reject hover:bg-reject-bg hover:text-reject gap-1 shrink-0 whitespace-nowrap"
                    >
                      <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
                      <span>{deletingId === job.id ? "삭제중" : "삭제"}</span>
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
