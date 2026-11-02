"use client";

import * as React from "react";
import { CheckCircle2, KeyRound, Coins, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LlmUsageSummary {
  callCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  estimatedCostKrw: number;
}

interface LlmUsageRecord {
  id: string;
  jobId: string;
  stage: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  createdAt: string;
}

interface LlmStatusPayload {
  hasApiKey: boolean;
  maskedKey: string | null;
  totalSummary: LlmUsageSummary;
  jobSummary: LlmUsageSummary | null;
  recentRecords: LlmUsageRecord[];
}

export function ApiUsageBar({
  jobId,
  refreshTrigger,
}: {
  jobId?: string;
  refreshTrigger?: unknown;
}) {
  const [status, setStatus] = React.useState<LlmStatusPayload | null>(null);
  const [open, setOpen] = React.useState(false);
  const [apiKeyInput, setApiKeyInput] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const fetchStatus = React.useCallback(async () => {
    try {
      const url = jobId
        ? `/api/settings/llm?jobId=${encodeURIComponent(jobId)}`
        : "/api/settings/llm";
      const res = await fetch(url);
      if (!res.ok) return;
      const json = (await res.json()) as LlmStatusPayload;
      setStatus(json);
    } catch {
      // ignore network error
    }
  }, [jobId]);

  React.useEffect(() => {
    void fetchStatus();
  }, [fetchStatus, refreshTrigger]);

  async function handleAction(action: "save" | "test" | "clear") {
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/settings/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          apiKey: apiKeyInput.trim() || undefined,
        }),
      });
      const json = (await res.json()) as LlmStatusPayload & {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok || json.ok === false) {
        setFeedback({
          type: "err",
          text: json.error ?? "설정 처리 중 오류가 발생했습니다.",
        });
      } else {
        setStatus(json);
        if (action !== "clear") {
          setApiKeyInput("");
        }
        setFeedback({
          type: "ok",
          text: json.message ?? "설정이 반영되었습니다.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const totalTokens = status?.totalSummary.totalTokens ?? 0;
  const totalUsd = status?.totalSummary.estimatedCostUsd ?? 0;
  const totalKrw = status?.totalSummary.estimatedCostKrw ?? 0;
  const jobTokens = status?.jobSummary?.totalTokens ?? 0;
  const jobUsd = status?.jobSummary?.estimatedCostUsd ?? 0;

  // 월 $5 무료 크레딧 기준 사용률(%)
  const monthlyFreeCreditUsd = 5.0;
  const usedPercent = Math.min(
    100,
    Number(((totalUsd / monthlyFreeCreditUsd) * 100).toFixed(1))
  );
  const remainingUsd = Math.max(0, monthlyFreeCreditUsd - totalUsd);

  return (
    <>
      <div className="inline-flex items-center gap-2">
        {/* 상단 헤더에 상시 노출되는 API & 토큰/크레딧 버닝 요약 버튼 */}
        <button
          type="button"
          onClick={() => {
            setFeedback(null);
            void fetchStatus();
            setOpen(true);
          }}
          className="inline-flex h-[32px] items-center gap-2 rounded-md border-hairline border-line bg-surface px-3 text-[12px] leading-[18px] text-ink hover:bg-surface-subtle transition-colors duration-150 whitespace-nowrap"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              status?.hasApiKey ? "bg-pass" : "bg-hold"
            }`}
          />
          <span className="font-medium">
            {status?.hasApiKey ? "API 연결됨" : "API 미연결 (키 입력)"}
          </span>
          <span className="text-line">|</span>
          <Coins className="h-3.5 w-3.5 text-primary stroke-[1.5]" />
          <span>
            누적{" "}
            <strong className="font-semibold text-ink">
              {totalTokens.toLocaleString()}
            </strong>{" "}
            토큰 ·{" "}
            <strong className="font-semibold text-primary">
              ${totalUsd.toFixed(4)}
            </strong>{" "}
            (약 {totalKrw.toLocaleString()}원)
          </span>
          {jobId && jobTokens > 0 && (
            <>
              <span className="text-line">|</span>
              <span className="text-info font-medium">
                이번 기사: {jobTokens.toLocaleString()}토큰 ($
                {jobUsd.toFixed(4)})
              </span>
            </>
          )}
        </button>
      </div>

      {/* 화면 내 API 키 입력 및 토큰·크레딧 버닝 상세 모달 */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1D21]/40 p-4"
        >
          <div className="w-[640px] max-w-full rounded-lg border-hairline border-line bg-surface p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-hairline border-line pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary stroke-[1.5]" />
                <h2 className="text-[16px] leading-[24px] font-semibold text-ink">
                  Perplexity API 키 설정 및 토큰·크레딧 버닝 현황
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                닫기
              </Button>
            </div>

            {/* 1. API 키 입력·연결 섹션 */}
            <div className="rounded-md border-hairline border-line bg-surface-subtle p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ink">
                  1. Perplexity API 키 연결 상태
                </span>
                {status?.hasApiKey ? (
                  <span className="inline-flex items-center gap-1 rounded bg-pass-bg px-2 py-0.5 text-[12px] font-medium text-pass">
                    <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5]" />
                    <span>연결됨 ({status.maskedKey})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded bg-hold-bg px-2 py-0.5 text-[12px] font-medium text-hold">
                    미연결 (로컬 규칙 모드로 동작 중 · 비용 $0)
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="perplexityApiKeyInput">
                  API 키 입력 또는 변경 (서버 `.env.local`에 안전하게 저장되며 브라우저에 노출되지 않음)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="perplexityApiKeyInput"
                    type="password"
                    placeholder="pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="flex-1 font-mono text-[13px]"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={submitting || !apiKeyInput.trim()}
                    onClick={() => handleAction("save")}
                  >
                    키 저장
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={
                      submitting || (!status?.hasApiKey && !apiKeyInput.trim())
                    }
                    onClick={() => handleAction("test")}
                    className="gap-1"
                  >
                    <RefreshCw className="h-3.5 w-3.5 stroke-[1.5]" />
                    <span>연결 테스트</span>
                  </Button>
                  {status?.hasApiKey && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={submitting}
                      onClick={() => handleAction("clear")}
                      className="gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
                      <span>해제</span>
                    </Button>
                  )}
                </div>
              </div>

              {feedback && (
                <div
                  className={`rounded-md border-hairline px-3 py-2 text-[12px] leading-[18px] ${
                    feedback.type === "ok"
                      ? "border-pass bg-pass-bg text-pass"
                      : "border-reject bg-reject-bg text-reject"
                  }`}
                >
                  {feedback.text}
                </div>
              )}
            </div>

            {/* 2. 토큰 및 크레딧 버닝 대시보드 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ink">
                  2. 실시간 토큰 및 크레딧 버닝 대시보드
                </span>
                <span className="text-[11px] font-medium text-primary">
                  활성 모델: openai/gpt-5.6-sol (Perplexity /v1/responses)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border-hairline border-line bg-surface p-3 space-y-1">
                  <div className="text-[11px] text-ink-muted">
                    누적 API 호출 횟수
                  </div>
                  <div className="text-[18px] leading-[26px] font-semibold text-ink">
                    {(status?.totalSummary.callCount ?? 0).toLocaleString()}회
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    기사 1건당 평균 2~3회 호출
                  </div>
                </div>

                <div className="rounded-md border-hairline border-line bg-surface p-3 space-y-1">
                  <div className="text-[11px] text-ink-muted">
                    누적 토큰 소모량
                  </div>
                  <div className="text-[18px] leading-[26px] font-semibold text-ink">
                    {totalTokens.toLocaleString()} 토큰
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    입력 {(status?.totalSummary.promptTokens ?? 0).toLocaleString()}{" "}
                    / 출력{" "}
                    {(
                      status?.totalSummary.completionTokens ?? 0
                    ).toLocaleString()}
                  </div>
                </div>

                <div className="rounded-md border-hairline border-line bg-surface p-3 space-y-1">
                  <div className="text-[11px] text-ink-muted">
                    누적 크레딧 버닝 비용
                  </div>
                  <div className="text-[18px] leading-[26px] font-semibold text-primary">
                    ${totalUsd.toFixed(4)}
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    한화 약 {totalKrw.toLocaleString()}원 (1,400원/달러)
                  </div>
                </div>
              </div>

              {/* 월 $5 무료 크레딧 대비 잔여 게이지 */}
              <div className="rounded-md border-hairline border-line bg-surface-subtle p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-medium text-ink">
                    Perplexity Pro 기본 무료 크레딧(월 $5.00) 대비 소진율
                  </span>
                  <span className="font-semibold text-primary">
                    사용 ${totalUsd.toFixed(4)} / 잔여 ${remainingUsd.toFixed(4)}{" "}
                    ({usedPercent}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-line overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-150"
                    style={{ width: `${Math.max(usedPercent, totalUsd > 0 ? 2 : 0)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 3. 최근 단계별 호출 내역 로그 */}
            <div className="space-y-2">
              <span className="text-[13px] font-semibold text-ink">
                3. 최근 API 호출 및 단계별 토큰 소모 내역
              </span>
              {!status?.recentRecords || status.recentRecords.length === 0 ? (
                <div className="rounded-md border-hairline border-line bg-surface-subtle p-4 text-center text-[12px] text-ink-muted">
                  아직 기록된 API 호출 내역이 없습니다. (API 키 연결 후 작업을 실행하거나 &lsquo;연결 테스트&rsquo;를 누르면 실시간 기록됩니다.)
                </div>
              ) : (
                <div className="max-h-[180px] overflow-y-auto rounded-md border-hairline border-line">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead>
                      <tr className="border-b-hairline border-line bg-surface-subtle text-ink-muted">
                        <th className="py-2 px-3 font-medium">시각</th>
                        <th className="py-2 px-3 font-medium">단계</th>
                        <th className="py-2 px-3 font-medium">모델</th>
                        <th className="py-2 px-3 font-medium text-right">
                          토큰 (입력/출력)
                        </th>
                        <th className="py-2 px-3 font-medium text-right">
                          버닝 비용
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-hairline divide-line">
                      {status.recentRecords.map((rec) => (
                        <tr key={rec.id}>
                          <td className="py-1.5 px-3 text-ink-muted">
                            {new Date(rec.createdAt).toLocaleTimeString(
                              "ko-KR"
                            )}
                          </td>
                          <td className="py-1.5 px-3 font-medium text-ink">
                            {rec.stage}
                          </td>
                          <td className="py-1.5 px-3 font-mono text-[11px] text-ink-muted">
                            {rec.model}
                          </td>
                          <td className="py-1.5 px-3 text-right text-ink">
                            {rec.totalTokens.toLocaleString()} (
                            {rec.promptTokens}/{rec.completionTokens})
                          </td>
                          <td className="py-1.5 px-3 text-right font-semibold text-primary">
                            ${rec.estimatedCostUsd.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
