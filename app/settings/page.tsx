import fs from "fs";
import path from "path";
import YAML from "yaml";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import {
  loadBannedWords,
  loadHardRules,
  loadRejectMessages,
  loadRestrictedTopics,
} from "@/lib/rules/loader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApiUsageBar } from "@/components/api-usage-bar";
import { SeverityBadge } from "@/components/verdict-badge";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session.user?.id) {
    redirect("/login");
  }

  const hardRules = Array.from(loadHardRules().values());
  const rejectMessages = loadRejectMessages().reject_messages;
  const restricted = loadRestrictedTopics();
  const banned = loadBannedWords();

  const outletsPath = path.join(process.cwd(), "data", "outlets.yaml");
  const outlets = YAML.parse(fs.readFileSync(outletsPath, "utf-8")) as {
    naver_cp_allowed: string[];
    naver_cp_disallowed: string[];
    unregistered_periodicals: string[];
  };

  return (
    <div className="min-h-screen bg-surface-subtle">
      <header className="bg-surface border-b-hairline border-line">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 text-[14px] leading-[22px] text-ink-muted hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4 stroke-[1.5]" />
              <span>작업 목록으로</span>
            </Link>
            <span className="text-line">|</span>
            <h1 className="text-[16px] leading-[24px] font-semibold text-ink">
              룰북 · 반려 문구 · 송출 가능 매체 설정 (`/rules/*.yaml`, `/data/*.yaml`)
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/guide">
              <Button type="button" variant="secondary" size="sm" className="gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary stroke-[1.75]" />
                <span>사용 가이드</span>
              </Button>
            </Link>
            <ApiUsageBar />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] p-6 space-y-6">
        <Card className="p-0 overflow-hidden">
          <div className="bg-surface-subtle px-4 py-3 border-b-hairline border-line">
            <h2 className="text-[16px] leading-[24px] font-semibold text-ink">
              1. 하드룰 설정 (`rules/hard-rules.yaml`)
            </h2>
          </div>
          <div className="divide-y-hairline divide-line">
            {hardRules.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-12 items-center px-4 py-2.5 text-[13px] leading-[20px]"
              >
                <div className="col-span-2 font-semibold text-ink">{r.id}</div>
                <div className="col-span-2">
                  <SeverityBadge severity={r.severity} />
                </div>
                <div className="col-span-5 text-ink">{r.message}</div>
                <div className="col-span-3 text-[12px] text-ink-muted font-mono">
                  {JSON.stringify(r.params ?? {})}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-0 overflow-hidden">
            <div className="bg-surface-subtle px-4 py-3 border-b-hairline border-line">
              <h2 className="text-[16px] leading-[24px] font-semibold text-ink">
                2. 반려 문구 표준안 (`rules/reject-messages.yaml`)
              </h2>
            </div>
            <div className="divide-y-hairline divide-line">
              {rejectMessages.map((m) => (
                <div key={m.id} className="p-4 space-y-1">
                  <div className="text-[12px] font-semibold text-reject">
                    [{m.id}] {m.reason}
                  </div>
                  <div className="text-[13px] leading-[20px] text-ink">
                    {m.message}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="bg-surface-subtle px-4 py-3 border-b-hairline border-line">
              <h2 className="text-[16px] leading-[24px] font-semibold text-ink">
                3. 송출 가능 매체 참조표 (`data/outlets.yaml`)
              </h2>
            </div>
            <div className="p-4 space-y-4 text-[13px] leading-[20px]">
              <div>
                <div className="font-semibold text-pass mb-1">
                  네이버 CP 제휴 (송출 가능)
                </div>
                <p className="text-ink">
                  {outlets.naver_cp_allowed.join(" · ")}
                </p>
              </div>
              <div>
                <div className="font-semibold text-reject mb-1">
                  네이버 CP 미포함 (송출 불가 - 네이버 N항목 벌점 2점 주의)
                </div>
                <p className="text-ink">
                  {outlets.naver_cp_disallowed.join(" · ")}
                </p>
              </div>
              <div>
                <div className="font-semibold text-ink-muted mb-1">
                  정기간행물 미등록 매체
                </div>
                <p className="text-ink">
                  {outlets.unregistered_periodicals.join(" · ")}
                </p>
              </div>
              <div className="pt-2 border-t-hairline border-line">
                <div className="font-semibold text-ink mb-1">
                  최상급·금지어 사전 (`data/banned-words.yaml`)
                </div>
                <p className="text-[12px] text-ink-muted">
                  최상급 표현 {banned.superlative_terms.length}종, 홍보체 어미{" "}
                  {banned.promotional_tones.length}종, 제한소재 카테고리{" "}
                  {restricted.workflow_restricted_topics.length}종 등록됨
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
