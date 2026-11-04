"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, FileText, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ApiUsageBar } from "@/components/api-usage-bar";
import type { JobMode } from "@/lib/pipeline/types";

const SAMPLE_PRESETS = [
  {
    label: "예시 1: 정상 기업 보도자료 (스크린 파크골프 출시)",
    companyName: "㈜낫소",
    caption:
      "스포츠용품 전문기업 ㈜낫소가 고화질 그래픽과 정밀 센서 기술을 적용한 이동형 스크린 파크골프 부스를 선보인다. [제공=낫소]",
    rawText: `스포츠용품 전문기업 ㈜낫소가 고화질 그래픽과 정밀 센서 기술을 적용한 이동형 스크린 파크골프 부스를 선보이며 지자체와 공공기관, 주민복지시설을 중심으로 시장 확대에 나선다. 기존 실내 공간을 활용해 지역 주민과 시니어에게 새로운 생활체육 환경을 제공할 수 있도록 기획한 제품이다.

이번 부스는 언리얼 엔진 5.1 기반의 4K UHD 고화질 그래픽을 적용해 선명하고 생동감 있는 가상 필드를 구현하도록 설계됐다. 다양한 코스와 연습 콘텐츠를 제공해 입문자의 기초 연습부터 기존 이용자의 게임과 친선경기까지 폭넓게 활용할 수 있다.

특히 2 비전 하이스피드 카메라 센서를 적용해 타격 순간 볼의 움직임을 빠르고 정밀하게 감지하고, 이를 스크린 속 가상 필드에 반영하도록 설계했다. 부스의 기본 골격은 용접 없이 부재를 연결하고 분해할 수 있는 무용접 조인트 결합 방식으로 설계해 설치와 철거 과정을 간소화했다.

1971년 창립한 낫소는 올해 창립 55주년을 맞은 스포츠용품 전문기업으로, 축구공·배구공·테니스공 등 다양한 스포츠용품을 개발 및 생산해 왔다.

낫소 관계자는 “이동형 스크린 파크골프 부스는 실감 나는 플레이 환경과 설치·철거 편의성을 함께 고려한 제품”이라며 “앞으로도 지자체와 주민복지시설 등 다양한 공간에서 활용할 수 있는 생활체육 환경을 제공하고, 지역 주민들의 스포츠 참여 기회를 확대해 나가겠다”라고 밝혔다.`,
  },
  {
    label: "예시 2: 보류(HOLD)·자동 수정 검증용 (특허·최상급·대기업 언급 포함)",
    companyName: "테크원솔루션",
    caption: "테크원솔루션 AI 물류 시스템 시연 현장. <제공=테크원솔루션>",
    rawText: `테크원솔루션(대표 김철수)은 독자 개발한 인공지능 물류 분류 알고리즘으로 최근 특허를 획득하고 올해 매출 34억 원을 달성했다고 밝혔다.

당사는 세계 최고 수준의 AI 비전 기술력을 자랑합니다. 이번 솔루션은 삼성전자 물류 라인에도 적용을 추진 중이며, 약 100평 규모의 실증 센터(https://www.techone-example.co.kr)에서 테스트를 마쳤다.

테크원솔루션 관계자는 “독보적인 기술력으로 국내 최대 시장을 선도하겠다”라고 밝혔다. 이어 “글로벌 물류 자동화 분야에서도 혁신적인 성과를 이어가겠다”라고 밝혔다. 마지막으로 “올해 하반기 추가 수주를 통해 성장을 가속화하겠다”라고 밝혔다.`,
  },
  {
    label: "예시 3: 반려(REJECT) 검증용 (공식 홈페이지 없음 / 코인·비상장주 투자 유도)",
    companyName: "메타코인글로벌",
    caption: "메타코인글로벌 토큰 발행 안내",
    rawText: `메타코인글로벌은 차세대 가상화폐 코인 상장과 함께 비상장주 투자 유도를 통한 원금 보장 프로젝트를 시작한다고 밝혔다.

현재 당사는 공식 홈페이지는 없으며 인스타그램으로만 운영 중이다. 참여 회원에게는 다단계 네트워크 마케팅 보너스와 VIP 클럽 회원권 판매 혜택을 함께 제공한다.`,
  },
];

export default function NewJobPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<JobMode>("minimal");
  const [companyName, setCompanyName] = React.useState("");
  const [category, setCategory] = React.useState("기업·경영");
  const [outlet, setOutlet] = React.useState("매일경제(신문, AX)");
  const [byline, setByline] = React.useState("이경섭 기자");
  const [rawText, setRawText] = React.useState("");
  const [caption1, setCaption1] = React.useState("");
  const [caption2, setCaption2] = React.useState("");
  const [companyProvidedPhotoConfirmed, setCompanyProvidedPhotoConfirmed] =
    React.useState(true);
  const [portraitConsentChecked, setPortraitConsentChecked] =
    React.useState(true);
  const [includeAiNotice, setIncludeAiNotice] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [elapsedSec, setElapsedSec] = React.useState(0);

  React.useEffect(() => {
    if (!submitting) {
      setElapsedSec(0);
      return;
    }
    const timer = window.setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [submitting]);

  const estimatedTotalSec = 5;
  const remainingSec = Math.max(1, estimatedTotalSec - elapsedSec);
  const progressStepLabel =
    elapsedSec < 2
      ? "S0~S3 보도자료 팩트 추출 및 제한 소재 점검 중..."
      : elapsedSec < 4
      ? "S4~S7 과장·판촉 표현 교열 및 매경 기사 초안 작성 중..."
      : "S8~S10 하드룰·네이버 운영평가 점검 마무리 및 화면 이동 중...";

  const applyPreset = (idx: number) => {
    const preset = SAMPLE_PRESETS[idx];
    if (!preset) return;
    setCompanyName(preset.companyName);
    setCaption1(preset.caption);
    setRawText(preset.rawText);
    setError(null);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const captions = [caption1.trim(), caption2.trim()].filter(Boolean);
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          companyName,
          rawText,
          options: {
            category,
            outlet,
            byline,
            captions,
            photoCount: captions.length || 1,
            companyProvidedPhotoConfirmed,
            portraitConsentChecked,
            includeAiNotice,
          },
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        id?: string;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.id) {
        setError(data.error ?? "작업 생성에 실패했습니다.");
        setSubmitting(false);
        return;
      }

      router.push(`/jobs/${data.id}`);
    } catch {
      setError("서버와 통신할 수 없습니다.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-subtle">
      <header className="bg-surface border-b-hairline border-line">
        <div className="mx-auto flex flex-wrap max-w-[1440px] items-center justify-between gap-2.5 px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 text-[14px] leading-[22px] text-ink-muted hover:text-ink whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="h-4 w-4 stroke-[1.5]" />
              <span>작업 목록으로</span>
            </Link>
            <span className="text-line hidden sm:inline">|</span>
            <span className="text-[16px] leading-[24px] font-semibold text-ink whitespace-nowrap shrink-0">
              새 작업 등록
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/guide">
              <Button type="button" variant="secondary" size="sm" className="gap-1.5 whitespace-nowrap shrink-0">
                <FileText className="h-3.5 w-3.5 text-primary stroke-[1.5]" />
                <span>사용 가이드</span>
              </Button>
            </Link>
            <ApiUsageBar />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border-hairline border-reject bg-reject-bg px-4 py-3 text-[14px] leading-[22px] text-reject"
            >
              <XCircle className="h-4 w-4 shrink-0 mt-1 stroke-[1.5]" />
              <span>{error}</span>
            </div>
          )}

          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>작성 모드 선택 (v2 · 3가지 맞춤형 작성 모드)</Label>
                <span className="text-[12px] leading-[18px] text-ink-muted">
                  작업 생성 후 편집 화면에서도 모드를 즉시 전환할 수 있습니다.
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setMode("minimal")}
                  className={`flex flex-col justify-between items-start rounded-md border-hairline p-4 text-left transition-colors duration-150 ${
                    mode === "minimal"
                      ? "border-primary bg-primary-subtle"
                      : "border-line bg-surface hover:bg-surface-subtle"
                  }`}
                >
                  <div className="space-y-1.5 w-full">
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="text-[11px] font-bold text-primary whitespace-nowrap">
                        MODE 01 · 기본 교정
                      </span>
                      <span className="whitespace-nowrap shrink-0 rounded-md border-hairline border-primary bg-primary px-2 py-0.5 text-[11px] leading-[16px] font-semibold text-surface">
                        NEW · 원문 교정
                      </span>
                    </div>
                    <div className="text-[15px] leading-[22px] font-bold text-ink whitespace-nowrap">
                      모드 1: 기사식광고 기본 모드 (최소 수정)
                    </div>
                    <p className="mt-1 text-[12px] leading-[19px] text-ink-muted break-keep">
                      원문 전체와 수정된 내용을 위아래로 비교하며, <strong className="text-reject underline">빨간줄</strong> 교정 문장을 클릭해 원하는 버전으로 바꾸면 <strong className="text-pass">초록색</strong>으로 교체됩니다. 왼쪽 <strong className="font-semibold text-ink">📌 취재 팩트 메모장</strong>에서 기업정보·매출액 등을 단락에 추가합니다.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("rewrite")}
                  className={`flex flex-col justify-between items-start rounded-md border-hairline p-4 text-left transition-colors duration-150 ${
                    mode === "rewrite" || mode === "ad_article"
                      ? "border-primary bg-primary-subtle"
                      : "border-line bg-surface hover:bg-surface-subtle"
                  }`}
                >
                  <div className="space-y-1.5 w-full">
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="text-[11px] font-bold text-primary whitespace-nowrap">
                        MODE 02 · 전면 재작성
                      </span>
                      <span className="whitespace-nowrap shrink-0 rounded-md border-hairline border-hold bg-hold-bg px-2 py-0.5 text-[11px] leading-[16px] font-semibold text-hold">
                        원문·수정본 노란색 비교
                      </span>
                    </div>
                    <div className="text-[15px] leading-[22px] font-bold text-ink whitespace-nowrap">
                      모드 2: 기사식광고 리라이팅 모드
                    </div>
                    <p className="mt-1 text-[12px] leading-[19px] text-ink-muted break-keep">
                      원문 기사를 기반으로 문장 구성을 늘리거나 줄이고 문단 위치를 바꾸어 매경 기사식광고(1,200~1,500자)로 재작성합니다. <strong className="font-semibold text-ink">원문 vs 수정본 비교 및 연한 노란색 하이라이팅</strong>을 제공합니다.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("comparative")}
                  className={`flex flex-col justify-between items-start rounded-md border-hairline p-4 text-left transition-colors duration-150 ${
                    mode === "comparative"
                      ? "border-secondary bg-secondary-subtle"
                      : "border-line bg-surface hover:bg-surface-subtle"
                  }`}
                >
                  <div className="space-y-1.5 w-full">
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="text-[11px] font-bold text-secondary whitespace-nowrap">
                        MODE 03 · 기획 기사
                      </span>
                      <span className="whitespace-nowrap shrink-0 rounded-md border-hairline border-secondary bg-secondary px-2 py-0.5 text-[11px] leading-[16px] font-semibold text-surface">
                        경쟁사 자동 조사
                      </span>
                    </div>
                    <div className="text-[15px] leading-[22px] font-bold text-secondary whitespace-nowrap">
                      모드 3: 비교·기획 기사 모드
                    </div>
                    <p className="mt-1 text-[12px] leading-[19px] text-ink-muted break-keep">
                      동종업계 경쟁사·유사 브랜드 2~3곳을 웹에서 함께 조사하여 비교·분석 문단을 포함한 기획 기사로 작성합니다. 출처 매핑 및 확장 승인 체크리스트 검수가 필수입니다.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {mode === "comparative" && (
              <div className="flex items-start gap-2 rounded-md border-hairline border-hold bg-hold-bg px-4 py-3 text-[12px] leading-[18px] text-hold">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 stroke-[1.5]" />
                <span>
                  비교·기획 모드는 기사식광고 제한 소재 중 &apos;비교 기사&apos; 및 네이버 운영평가 R항목·O항목 리스크가 있으므로 기본 &apos;네이버 제외 송출&apos;이 권장되며 사람 검수가 필수입니다.
                </span>
              </div>
            )}

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label htmlFor="companyName">기업·기관명 (미입력 시 자동 추출)</Label>
                <Input
                  id="companyName"
                  placeholder="예: ㈜낫소, 국민대학교"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="category">섹션 / 카테고리</Label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-[36px] w-full rounded-md border-hairline border-line bg-surface px-3 py-1.5 text-[14px] leading-[22px] text-ink focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <option value="기업·경영">기업 &gt; 기업·경영</option>
                  <option value="사회·교육">사회 &gt; 교육·복지</option>
                  <option value="테크·과학">테크·과학 &gt; 테크</option>
                  <option value="문화·공연">문화 &gt; 전시·공연</option>
                  <option value="보도자료">보도자료 (네이버 M항목 권장)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="outlet">송출 매체 (PRD 7.4)</Label>
                <select
                  id="outlet"
                  value={outlet}
                  onChange={(e) => setOutlet(e.target.value)}
                  className="flex h-[36px] w-full rounded-md border-hairline border-line bg-surface px-3 py-1.5 text-[14px] leading-[22px] text-ink focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <option value="매일경제(신문, AX)">매일경제(신문, AX) [CP 송출가능]</option>
                  <option value="MBN">MBN [CP 송출가능]</option>
                  <option value="매경 ECONOMY">매경 ECONOMY [CP 송출가능]</option>
                  <option value="MK 스포츠">MK 스포츠 [CP 송출가능]</option>
                  <option value="매경헬스(뉴스스탠드)">매경헬스 [네이버 CP 송출불가]</option>
                  <option value="매경비즈">매경비즈 [미등록 정기간행물]</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="byline">작성자 바이라인 (FMT-11 필수)</Label>
                <Input
                  id="byline"
                  placeholder="예: 이경섭 기자"
                  value={byline}
                  onChange={(e) => setByline(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="rawText">보도자료 원문 붙여넣기 (최대 20,000자)</Label>
                <span className="text-[12px] leading-[18px] text-ink-muted">
                  현재 {rawText.length.toLocaleString()}자 / 20,000자
                </span>
              </div>
              <textarea
                id="rawText"
                rows={12}
                placeholder="대행사 또는 기업에서 전달받은 보도자료 원문을 여기에 붙여넣으십시오..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                required
                className="w-full min-h-[240px] rounded-md border-hairline border-line bg-surface p-3 text-[14px] leading-[22px] text-ink placeholder:text-ink-muted focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t-hairline border-line">
              <div className="space-y-1">
                <Label htmlFor="caption1">사진 1 캡션 (설명 + 제공자, 최대 2장)</Label>
                <Input
                  id="caption1"
                  placeholder="예: 행사 사진 설명. [제공=기업명]"
                  value={caption1}
                  onChange={(e) => setCaption1(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="caption2">사진 2 캡션 (선택)</Label>
                <Input
                  id="caption2"
                  placeholder="두 번째 사진이 있는 경우 캡션 입력"
                  value={caption2}
                  onChange={(e) => setCaption2(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-[12px] leading-[18px] text-ink">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={companyProvidedPhotoConfirmed}
                  onChange={(e) =>
                    setCompanyProvidedPhotoConfirmed(e.target.checked)
                  }
                  className="h-4 w-4 rounded border-line text-primary focus:ring-0"
                />
                <span>기업 공식 제공 사진임을 확인했습니다 (F9)</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={portraitConsentChecked}
                  onChange={(e) => setPortraitConsentChecked(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-primary focus:ring-0"
                />
                <span>인물 사진 초상권·저작권 동의를 확인했습니다 (F9)</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAiNotice}
                  onChange={(e) => setIncludeAiNotice(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-primary focus:ring-0"
                />
                <span>기사 하단 AI 활용 고지 문구 삽입 (네이버 D항목 옵션)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t-hairline border-line">
              {submitting && (
                <div className="inline-flex items-center gap-2 rounded-md border-hairline border-info bg-info-bg px-3 py-1.5 text-[12px] leading-[18px] text-info">
                  <span className="font-semibold whitespace-nowrap">
                    예상 남은 시간: 약 {remainingSec}초 (경과 {elapsedSec}초)
                  </span>
                  <span className="text-info/60">·</span>
                  <span>{progressStepLabel}</span>
                </div>
              )}
              <Link href="/jobs">
                <Button type="button" variant="ghost" disabled={submitting}>
                  취소
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                className="gap-1.5 whitespace-nowrap"
              >
                <Play className="h-4 w-4 stroke-[1.5]" />
                <span>
                  {submitting
                    ? `작업 생성 중... (약 ${remainingSec}초 남음)`
                    : "분석 시작 (S0~S10)"}
                </span>
              </Button>
            </div>
          </Card>
        </form>
      </main>
    </div>
  );
}
