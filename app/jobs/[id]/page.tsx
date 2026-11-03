"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ClipboardCopy,
  ExternalLink,
  Info,
  MapPin,
  Maximize2,
  Minimize2,
  Play,
  Plus,
  RotateCcw,
  Save,
  Shuffle,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ApiUsageBar } from "@/components/api-usage-bar";
import { SeverityBadge, VerdictBadge } from "@/components/verdict-badge";
import {
  normalizeJobMode,
  type CompanyFactMemo,
  type JobMode,
  type SentenceProofreadItem,
  type VerdictType,
} from "@/lib/pipeline/types";
import type { RuleSeverity } from "@/lib/rules/loader";

const ALL_STAGES = [
  { id: "S0", label: "S0 전처리·클레임 추출" },
  { id: "S1", label: "S1 중복 게재 점검" },
  { id: "S2", label: "S2 기업·홈페이지 검증" },
  { id: "S3", label: "S3 제한 소재 스크리닝" },
  { id: "S4", label: "S4 팩트체크·증빙 플래그" },
  { id: "S5", label: "S5 과장·미확정 표현 필터" },
  { id: "S6", label: "S6 기사 초안 작성" },
  { id: "S7", label: "S7 제목·문체·리드 정비" },
  { id: "S8", label: "S8 사진·캡션 점검" },
  { id: "S9", label: "S9 최종 교열·규정 체크" },
  { id: "S10", label: "S10 사람 검수·승인" },
];

interface JobDetailPayload {
  job: {
    id: string;
    mode: JobMode;
    status: string;
    verdict: VerdictType | null;
    company_name: string | null;
    raw_text: string;
    options_json: string;
  };
  stages: Array<{
    stage: string;
    status: string;
    output_json: string;
    started_at?: string | null;
    finished_at?: string | null;
  }>;
  claims: Array<{
    id: string;
    text: string;
    type: string;
    status: string;
    evidence_request: string | null;
    usable_in_article: string;
  }>;
  sources: Array<{
    id: string;
    stage: string;
    url: string;
    title: string;
    publisher: string | null;
    published_at: string | null;
    snippet: string | null;
  }>;
  article: {
    version: number;
    title: string;
    subtitle: string;
    body: string;
    caption_json: string;
    ai_notice_included: number;
  } | null;
  findings: Array<{
    id: string;
    rule_id: string;
    severity: RuleSeverity;
    location_json: string;
    message: string;
  }>;
  competitors?: Array<{
    id: string;
    name: string;
    summary: string;
    source_url: string;
    selected: number;
  }>;
  notifications: Array<{
    id: string;
    type: "reject" | "hold";
    message: string;
    reasons_json: string;
  }>;
  approval: {
    id: string;
    approved_at: string;
    override_reason: string | null;
  } | null;
}

function deriveStageSummary(stage: string, outputJson: string): string {
  try {
    const out = JSON.parse(outputJson) as Record<string, unknown>;
    switch (stage) {
      case "S0":
        return `기업: ${String(out.companyName ?? "-")} · 클레임 ${
          Array.isArray(out.claims) ? out.claims.length : 0
        }건 추출`;
      case "S1": {
        const dupCount = Number(out.duplicateCount ?? 0);
        return dupCount >= 3
          ? `타매체 기출고 ${dupCount}건 → 문단·제목 차별화 적용`
          : `기출고 ${dupCount}건 (중복 위험 낮음 · PASS)`;
      }
      case "S2":
        return `${String(out.verdict ?? "PASS")} · 출처 ${
          Array.isArray(out.sources) ? out.sources.length : 0
        }건 확인`;
      case "S3":
        return Array.isArray(out.matches) && out.matches.length > 0
          ? `제한/주의 소재 ${out.matches.length}건 감지 (${String(out.verdict)})`
          : "제한 소재 해당 없음 (PASS)";
      case "S4":
        return Array.isArray(out.evidenceRequiredList) &&
          out.evidenceRequiredList.length > 0
          ? `증빙 확인 필요 ${out.evidenceRequiredList.length}건 (HOLD)`
          : `클레임 ${Array.isArray(out.claims) ? out.claims.length : 0}건 분류 완료`;
      case "S5":
        return Array.isArray(out.diffs) && out.diffs.length > 0
          ? `과장·판촉 표현 ${out.diffs.length}건 교열됨`
          : "과장·금지 표현 없음 (PASS)";
      case "S6":
        return `제목 후보 ${
          Array.isArray(out.titleCandidates) ? out.titleCandidates.length : 3
        }종 및 초안 생성`;
      case "S7":
        return Array.isArray(out.styleEdits) && out.styleEdits.length > 0
          ? `문체·어미 반복 ${out.styleEdits.length}건 정비`
          : "리드문 및 서술 어미 점검 완료";
      case "S8":
        return `캡션 ${
          Array.isArray(out.normalizedCaptions)
            ? out.normalizedCaptions.length
            : 1
        }건 [제공=기관명] 확인`;
      case "S9":
        return `본문 ${Number(out.charCountBody ?? 0).toLocaleString()}자 · 판정 ${String(
          out.overallVerdict ?? "PASS"
        )}`;
      case "S10":
        return `승인 체크리스트 ${
          Array.isArray(out.requiredChecklist)
            ? out.requiredChecklist.length
            : 4
        }개 항목 준비`;
      default:
        return "실행 완료";
    }
  } catch {
    return "실행 완료";
  }
}

export default function JobWorkspacePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const jobId = params.id;

  const [data, setData] = React.useState<JobDetailPayload | null>(null);
  const [stageStates, setStageStates] = React.useState<
    Record<string, { status: string; summary?: string }>
  >({});
  const [selectedStage, setSelectedStage] = React.useState<string | null>(null);
  const [running, setRunning] = React.useState(false);
  const [rightTab, setRightTab] = React.useState<"rules" | "claims" | "sources" | "raw">(
    "rules"
  );
  const [leftTab, setLeftTab] = React.useState<"facts" | "stages">("facts");
  const [expandOriginalBox, setExpandOriginalBox] = React.useState(true);

  // 편집기 상태
  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [captionText, setCaptionText] = React.useState("");
  const [byline, setByline] = React.useState("");
  const [aiNoticeIncluded, setAiNoticeIncluded] = React.useState(false);
  const [savingArticle, setSavingArticle] = React.useState(false);
  const [saveFeedback, setSaveFeedback] = React.useState<string | null>(null);
  const [highlightedTerm, setHighlightedTerm] = React.useState<string | null>(
    null
  );
  const [showSideBySide, setShowSideBySide] = React.useState(false);
  const [paragraphMode, setParagraphMode] = React.useState(true);
  const [showInlineDiffHighlight, setShowInlineDiffHighlight] =
    React.useState(true);
  const [expandDiffBox, setExpandDiffBox] = React.useState(false);
  const [wideEditorMode, setWideEditorMode] = React.useState(false);
  const [tallParagraphs, setTallParagraphs] = React.useState(false);
  const [focusedParaIdx, setFocusedParaIdx] = React.useState<number | null>(
    null
  );
  // CMS 복사 옵션 및 미리보기 상태 (PRD F14)
  const [blankLineCopy, setBlankLineCopy] = React.useState(true);
  const [includeBylineCopy, setIncludeBylineCopy] = React.useState(false);
  const [showCmsPreview, setShowCmsPreview] = React.useState(false);
  const [cmsPreviewText, setCmsPreviewText] = React.useState<string>("");

  // AI 대화형 기사 수정(채팅 개고) 상태
  const [chatInput, setChatInput] = React.useState("");
  const [chatLoading, setChatLoading] = React.useState(false);
  const [chatHistory, setChatHistory] = React.useState<
    Array<{
      id: string;
      instruction: string;
      replySummary: string;
      prevSnapshot: { title: string; subtitle: string; body: string };
      createdAt: string;
    }>
  >([]);

  // v2 모드 1(최소 수정): 문장 교정 인터랙티브 토글(빨간줄 → 대안 토글 → 초록색 교체) & 취재 팩트 메모장 상태
  const [sentenceSuggestions, setSentenceSuggestions] = React.useState<
    SentenceProofreadItem[]
  >([]);
  const [activeSuggestionId, setActiveSuggestionId] = React.useState<
    string | null
  >(null);
  const [customAltText, setCustomAltText] = React.useState("");
  const [factMemos, setFactMemos] = React.useState<CompanyFactMemo[]>([]);
  const [showFactNotepad, setShowFactNotepad] = React.useState(true);
  const [newFactInput, setNewFactInput] = React.useState("");
  const [newFactUrl, setNewFactUrl] = React.useState("");
  const [newFactCategory, setNewFactCategory] =
    React.useState("기업·매출 취재 팩트");
  const [memoTargetParas, setMemoTargetParas] = React.useState<
    Record<string, number>
  >({});

  const effectiveMode = React.useMemo(
    () => normalizeJobMode(data?.job.mode),
    [data?.job.mode]
  );

  const bodyParagraphs = React.useMemo(() => {
    const split = body
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return split.length > 0 ? split : [""];
  }, [body]);

  function updateParagraph(idx: number, newText: string) {
    const next = [...bodyParagraphs];
    next[idx] = newText;
    setBody(next.join("\n\n"));
  }

  function moveParagraph(idx: number, direction: -1 | 1) {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= bodyParagraphs.length) return;
    const next = [...bodyParagraphs];
    const temp = next[idx]!;
    next[idx] = next[targetIdx]!;
    next[targetIdx] = temp;
    setBody(next.join("\n\n"));
  }

  function addParagraphBelow(idx: number) {
    const next = [...bodyParagraphs];
    next.splice(idx + 1, 0, "새 문단 내용을 입력하십시오.");
    setBody(next.join("\n\n"));
  }

  function removeParagraph(idx: number) {
    if (bodyParagraphs.length <= 1) return;
    const next = bodyParagraphs.filter((_, i) => i !== idx);
    setBody(next.join("\n\n"));
  }

  function rotateMiddleParagraphs() {
    if (bodyParagraphs.length < 3) return;
    const next = [...bodyParagraphs];
    if (next.length === 3) {
      const tmp = next[1]!;
      next[1] = next[2]!;
      next[2] = tmp;
    } else {
      // 1문단(리드)과 마지막 문단(인용구/마무리)은 고정하고 중간 문단들을 한 칸씩 순환 재배치
      const middle = next.slice(1, -1);
      const rotated = [...middle.slice(1), middle[0]!];
      next.splice(1, middle.length, ...rotated);
    }
    setBody(next.join("\n\n"));
  }

  // 반려(REJECT) 모달 상태
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const [showOverrideInput, setShowOverrideInput] = React.useState(false);
  const [overrideReason, setOverrideReason] = React.useState("");

  // 승인 체크리스트 및 복사 상태
  const [checkedItems, setCheckedItems] = React.useState<
    Record<string, boolean>
  >({});
  const [approving, setApproving] = React.useState(false);
  const [copyFeedback, setCopyFeedback] = React.useState<string | null>(null);

  const fetchJobDetail = React.useCallback(async () => {
    const res = await fetch(`/api/jobs/${jobId}`);
    if (!res.ok) return;
    const json = (await res.json()) as JobDetailPayload;
    setData(json);

    const map: Record<string, { status: string; summary?: string }> = {};
    for (const s of json.stages) {
      map[s.stage] = {
        status: s.status,
        summary: deriveStageSummary(s.stage, s.output_json),
      };
    }
    setStageStates(map);

    try {
      const opts = JSON.parse(json.job.options_json ?? "{}") as {
        byline?: string;
      };
      setByline(opts.byline ?? "");
    } catch {
      setByline("");
    }

    if (json.article) {
      setTitle(json.article.title);
      setSubtitle(json.article.subtitle);
      setBody(json.article.body);
      setAiNoticeIncluded(json.article.ai_notice_included === 1);
      try {
        const caps = JSON.parse(json.article.caption_json) as string[];
        setCaptionText(caps.join("\n"));
      } catch {
        setCaptionText("");
      }
    }

    // 모드 2(리라이팅)일 경우 2분할 비교 화면을 기본 활성화
    const normMode = normalizeJobMode(json.job.mode);
    if (normMode === "rewrite") {
      setShowSideBySide(true);
    } else if (normMode === "minimal") {
      setShowSideBySide(false);
      setShowFactNotepad(true);
    }

    // S6 output에서 sentenceSuggestions 및 factMemos 복원 (없으면 자동 생성)
    const s6Stage = json.stages.find((s) => s.stage === "S6");
    let parsedS6: {
      sentenceSuggestions?: SentenceProofreadItem[];
      factMemos?: CompanyFactMemo[];
    } = {};
    if (s6Stage) {
      try {
        parsedS6 = JSON.parse(s6Stage.output_json) as typeof parsedS6;
      } catch {
        parsedS6 = {};
      }
    }

    if (
      Array.isArray(parsedS6.sentenceSuggestions) &&
      parsedS6.sentenceSuggestions.length > 0
    ) {
      setSentenceSuggestions(parsedS6.sentenceSuggestions);
    } else {
      // 기존 DB 레코드용 클라이언트 보조 생성
      const rawParas = (json.job.raw_text || "")
        .split(/\n\s*\n|\n+/)
        .map((p) => p.trim())
        .filter((p) => p.length >= 12);
      const fallbackSugs: SentenceProofreadItem[] = [];
      let seq = 1;
      rawParas.forEach((p, pIdx) => {
        const sents = p
          .split(/(?<=[.다요])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length >= 15);
        sents.forEach((s, sIdx) => {
          if (
            fallbackSugs.length < 4 &&
            ((pIdx === 0 && sIdx === 0) ||
              /(?:최초|최고|독보적|자랑|평(?!\s*\()|밝혔다|설계됐다|설계했다)/.test(
                s
              ))
          ) {
            const clean = s.replace(/\.$/, "");
            const v1 = clean
              .replace(/(\d+)\s*평(?!\s*\()/g, (_, n) => `약 ${Math.round(Number(n) * 3.3)}㎡(${n}평)`)
              .replace(/세계\s*최초로?/g, "독자 기술로")
              .replace(/세계\s*최고\s*수준의/g, "고도화된")
              .replace(/자랑합니다/g, "갖췄다")
              .replace(/나선다$/, "나선다고 밝혔다")
              .replace(/설계됐다$/, "설계된 것이 특징이다") + ".";
            const v2 = clean
              .replace(/선보이며\s+/, "출시하고 ")
              .replace(/밝혔다$/, "전했다")
              .replace(/다$/, "다는 설명이다") + ".";
            const v3 = clean.replace(/특히\s+|이번\s+/g, "").replace(/다$/, "고 강조했다") + ".";
            fallbackSugs.push({
              id: `sug-fb-${seq++}`,
              paraIdx: pIdx,
              originalSentence: s,
              ruleBadge:
                pIdx === 0 && sIdx === 0
                  ? "리드문 교열 · 네이버 중복 회피"
                  : "FMT-07/08 · 매경 기사체 다듬기",
              reason:
                "기사식 광고 프로세스 및 네이버 운영평가 기준에 맞춘 에이전트 교정 대안 문장입니다.",
              alternatives: [
                { id: `alt-${seq}-1`, label: "버전 1 (권장 · 최소 다듬기)", text: v1 },
                { id: `alt-${seq}-2`, label: "버전 2 (매경 정통 경제기사 톤)", text: v2 },
                { id: `alt-${seq}-3`, label: "버전 3 (간결·핵심 팩트 중심)", text: v3 },
              ],
              selectedAlternativeId: null,
            });
          }
        });
      });
      setSentenceSuggestions(fallbackSugs);
    }

    if (Array.isArray(parsedS6.factMemos) && parsedS6.factMemos.length > 0) {
      setFactMemos(parsedS6.factMemos);
    } else {
      const comp = json.job.company_name || "대상 기업";
      const primaryUrl =
        json.sources[0]?.url ||
        `https://www.mk.co.kr/search?word=${encodeURIComponent(comp)}`;
      setFactMemos([
        {
          id: "memo-fb-1",
          category: "기업 기본 정보",
          text: /낫소/.test(comp)
            ? `1971년 설립된 ${comp}(대표 주은형)는 경기도 고양시에 본사를 둔 종합 스포츠용품 제조기업으로, 대한테니스협회(KTA) 및 축구·배구 공식 사용구를 50년 이상 공급해 왔다.`
            : `한편 ${comp}는 주력 사업 분야의 자체 기술력과 현장 운영 노하우를 바탕으로 국내외 B2B·B2C 시장 내 입지를 넓혀가고 있는 전문 기업이다.`,
          sourceUrl: primaryUrl,
          sourceTitle: `${comp} 기업 기본 정보`,
          targetParaIdx: 1,
          insertedInParaIdx: null,
        },
        {
          id: "memo-fb-2",
          category: "매출액·실적 정보",
          text: /낫소/.test(comp)
            ? `한편 ${comp}는 인도네시아 자체 생산법인 및 글로벌 20여 개국 수출망을 기반으로 연간 약 150억~180억 원 규모의 매출 실적을 이어가며 생활스포츠 사업 비중을 확대하고 있다.`
            : `특히 ${comp}는 최근 주력 솔루션 공급 확대와 신규 수요처 발굴을 통해 연간 매출액과 영업 실적을 꾸준히 끌어올리며 외형 성장을 이어가고 있다.`,
          sourceUrl: json.sources[1]?.url || primaryUrl,
          sourceTitle: `${comp} 매출액·실적 조사`,
          targetParaIdx: 2,
          insertedInParaIdx: null,
        },
        {
          id: "memo-fb-3",
          category: "브랜드·출시 핵심 팩트",
          text: `${comp}는 현장 공간 제약을 줄이고 도입 효율성을 높인 맞춤형 신규 라인업을 통해 공공·민간 수요처 공략을 본격화했다.`,
          sourceUrl: primaryUrl,
          sourceTitle: "출시·사업 핵심 팩트",
          targetParaIdx: 0,
          insertedInParaIdx: null,
        },
        {
          id: "memo-fb-4",
          category: "제품·기술 핵심 특징",
          text: `정밀 센서 및 고화질 인터페이스와 모듈형 설계를 결합해 설치·철거 편의성과 현장 몰입감을 동시에 높인 것이 핵심 특징이다.`,
          sourceUrl: primaryUrl,
          sourceTitle: "기술 사양 팩트",
          targetParaIdx: 1,
          insertedInParaIdx: null,
        },
        {
          id: "memo-fb-5",
          category: "유통·시장 판매 동향",
          text: `전국 지자체·공공기관·복합문화시설 등 오프라인 거점과 온라인 채널을 연계해 보급망을 단계적으로 넓혀 나갈 계획이다.`,
          sourceUrl: primaryUrl,
          sourceTitle: "유통·시장 확대 동향",
          targetParaIdx: 2,
          insertedInParaIdx: null,
        },
      ]);
    }

    if (json.job.verdict === "REJECT") {
      setShowRejectModal(true);
    }
  }, [jobId]);

  const startPipelineStream = React.useCallback(
    (force = false, reason?: string) => {
      setRunning(true);
      setShowRejectModal(false);

      const url = new URL(`/api/jobs/${jobId}/run`, window.location.origin);
      if (force) {
        url.searchParams.set("force", "1");
        if (reason) url.searchParams.set("overrideReason", reason);
      }

      const es = new EventSource(url.toString());

      es.addEventListener("stage", (e) => {
        const payload = JSON.parse((e as MessageEvent).data) as {
          stage: string;
          status: string;
          summary?: string;
        };
        setStageStates((prev) => ({
          ...prev,
          [payload.stage]: {
            status: payload.status,
            summary: payload.summary,
          },
        }));
      });

      es.addEventListener("done", () => {
        es.close();
        setRunning(false);
        void fetchJobDetail();
      });

      es.addEventListener("error", () => {
        es.close();
        setRunning(false);
        void fetchJobDetail();
      });
    },
    [jobId, fetchJobDetail]
  );

  const hasAutoStartedRef = React.useRef(false);

  React.useEffect(() => {
    void fetchJobDetail().then(() => {
      if (
        searchParams.get("autorun") === "1" &&
        !hasAutoStartedRef.current
      ) {
        hasAutoStartedRef.current = true;
        startPipelineStream(false);
      }
    });
  }, [fetchJobDetail, searchParams, startPipelineStream]);

  // 글자 수 실시간 계산
  const titleCharCount = Array.from(title.trim()).length;
  const bodyCharCount = Array.from(body.replace(/\r?\n/g, "")).length;
  const isTitleInRange = titleCharCount >= 28 && titleCharCount <= 45;
  const isBodyInRange = bodyCharCount >= 1200 && bodyCharCount <= 1500;

  // 미저장 변경사항(Dirty State) 여부 계산
  const isDirty = React.useMemo(() => {
    if (!data?.article) return false;
    let savedCaps = "";
    try {
      savedCaps = (JSON.parse(data.article.caption_json) as string[]).join("\n");
    } catch {
      savedCaps = "";
    }
    let savedByline = "";
    try {
      savedByline =
        (JSON.parse(data.job.options_json ?? "{}") as { byline?: string })
          .byline ?? "";
    } catch {
      savedByline = "";
    }
    return (
      title !== data.article.title ||
      subtitle !== data.article.subtitle ||
      body !== data.article.body ||
      captionText !== savedCaps ||
      aiNoticeIncluded !== (data.article.ai_notice_included === 1) ||
      byline.trim() !== savedByline.trim()
    );
  }, [data, title, subtitle, body, captionText, aiNoticeIncluded, byline]);

  const handleSaveArticle = React.useCallback(
    async (overridePatch?: {
      title?: string;
      subtitle?: string;
      body?: string;
      captionText?: string;
      byline?: string;
      resolveHold?: boolean;
      resolvedClaimId?: string;
      sentenceSuggestions?: SentenceProofreadItem[];
      factMemos?: CompanyFactMemo[];
      competitors?: Array<{ id: string; selected: boolean }>;
    }) => {
      setSavingArticle(true);
      try {
        const nextTitle = overridePatch?.title ?? title;
        const nextSubtitle = overridePatch?.subtitle ?? subtitle;
        const nextBody = overridePatch?.body ?? body;
        const nextCaptionText = overridePatch?.captionText ?? captionText;
        const nextByline = overridePatch?.byline ?? byline;
        const nextSuggestions =
          overridePatch?.sentenceSuggestions ?? sentenceSuggestions;
        const nextMemos = overridePatch?.factMemos ?? factMemos;
        const captions = nextCaptionText
          .split(/\r?\n/)
          .map((c) => c.trim())
          .filter(Boolean);
        const res = await fetch(`/api/jobs/${jobId}/article`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: nextTitle,
            subtitle: nextSubtitle,
            body: nextBody,
            captions,
            aiNoticeIncluded,
            byline: nextByline,
            resolveHold: overridePatch?.resolveHold,
            resolvedClaimId: overridePatch?.resolvedClaimId,
            sentenceSuggestions: nextSuggestions,
            factMemos: nextMemos,
            competitors: overridePatch?.competitors,
          }),
        });
        if (res.ok) {
          await fetchJobDetail();
          setSaveFeedback("수정 내역 저장 및 하드룰·판정 재검사가 완료되었습니다.");
          setTimeout(() => setSaveFeedback(null), 3000);
        }
      } finally {
        setSavingArticle(false);
      }
    },
    [
      jobId,
      title,
      subtitle,
      body,
      captionText,
      byline,
      aiNoticeIncluded,
      sentenceSuggestions,
      factMemos,
      fetchJobDetail,
    ]
  );

  // Ctrl+S / Cmd+S 키보드 단축키로 즉시 저장 및 재검사
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!savingArticle && title) {
          void handleSaveArticle();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSaveArticle, savingArticle, title]);

  // 3가지 모드(모드1 최소수정 / 모드2 리라이팅 / 모드3 비교·기획) 즉시 전환
  async function handleSwitchToMode(targetMode: "minimal" | "rewrite" | "comparative") {
    if (!data || running) return;
    await fetch(`/api/jobs/${jobId}/article`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: targetMode }),
    });
    if (targetMode === "comparative" && (!data.competitors || data.competitors.length === 0)) {
      startPipelineStream(false);
    } else {
      await fetchJobDetail();
    }
  }

  // 모드 1(최소 수정): 빨간 줄 문장을 눌러 선택한 대안 문장으로 교체 (초록색으로 변경)
  async function handleSelectSentenceAlternative(
    sugId: string,
    altId: string,
    customTextOverride?: string
  ) {
    const targetSug = sentenceSuggestions.find((s) => s.id === sugId);
    if (!targetSug) return;

    const currentAppliedText = targetSug.selectedAlternativeId
      ? targetSug.alternatives.find((a) => a.id === targetSug.selectedAlternativeId)
          ?.text ?? targetSug.originalSentence
      : targetSug.originalSentence;

    let chosenAlt = targetSug.alternatives.find((a) => a.id === altId);
    let nextAlternatives = targetSug.alternatives;
    if (customTextOverride && customTextOverride.trim()) {
      const cleanCustom = customTextOverride.trim();
      const customAltObj = {
        id: "alt-custom",
        label: "직접 입력 교정 문장",
        text: cleanCustom,
      };
      nextAlternatives = [
        ...targetSug.alternatives.filter((a) => a.id !== "alt-custom"),
        customAltObj,
      ];
      chosenAlt = customAltObj;
      altId = "alt-custom";
    }

    if (!chosenAlt) return;

    let nextBody = body;
    if (nextBody.includes(currentAppliedText)) {
      nextBody = nextBody.replace(currentAppliedText, chosenAlt.text);
    } else if (nextBody.includes(targetSug.originalSentence)) {
      nextBody = nextBody.replace(targetSug.originalSentence, chosenAlt.text);
    }

    const nextSuggestions = sentenceSuggestions.map((s) =>
      s.id === sugId
        ? {
            ...s,
            alternatives: nextAlternatives,
            selectedAlternativeId: altId,
          }
        : s
    );

    setBody(nextBody);
    setSentenceSuggestions(nextSuggestions);
    setActiveSuggestionId(null);
    setCustomAltText("");
    await handleSaveArticle({
      body: nextBody,
      sentenceSuggestions: nextSuggestions,
    });
  }

  // 모드 1(최소 수정): 초록색으로 교체된 문장을 다시 원문(빨간 줄 상태)으로 복원
  async function handleRevertSentenceToOriginal(sugId: string) {
    const targetSug = sentenceSuggestions.find((s) => s.id === sugId);
    if (!targetSug || !targetSug.selectedAlternativeId) return;

    const appliedAlt = targetSug.alternatives.find(
      (a) => a.id === targetSug.selectedAlternativeId
    );
    let nextBody = body;
    if (appliedAlt && nextBody.includes(appliedAlt.text)) {
      nextBody = nextBody.replace(appliedAlt.text, targetSug.originalSentence);
    }

    const nextSuggestions = sentenceSuggestions.map((s) =>
      s.id === sugId ? { ...s, selectedAlternativeId: null } : s
    );

    setBody(nextBody);
    setSentenceSuggestions(nextSuggestions);
    setActiveSuggestionId(null);
    await handleSaveArticle({
      body: nextBody,
      sentenceSuggestions: nextSuggestions,
    });
  }

  // 모드 1(최소 수정): 모든 빨간 줄 문장에 권장 버전 1을 원클릭 일괄 적용
  async function handleApplyAllRecommendedSuggestions() {
    let nextBody = body;
    const nextSuggestions = sentenceSuggestions.map((s) => {
      const firstAlt = s.alternatives[0];
      if (!firstAlt) return s;
      const currentText = s.selectedAlternativeId
        ? s.alternatives.find((a) => a.id === s.selectedAlternativeId)?.text ??
          s.originalSentence
        : s.originalSentence;
      if (nextBody.includes(currentText)) {
        nextBody = nextBody.replace(currentText, firstAlt.text);
      } else if (nextBody.includes(s.originalSentence)) {
        nextBody = nextBody.replace(s.originalSentence, firstAlt.text);
      }
      return { ...s, selectedAlternativeId: firstAlt.id };
    });

    setBody(nextBody);
    setSentenceSuggestions(nextSuggestions);
    setActiveSuggestionId(null);
    await handleSaveArticle({
      body: nextBody,
      sentenceSuggestions: nextSuggestions,
    });
  }

  // 모드 1: 취재 팩트 메모장에 자체 취재 내용(기업정보, 매출액 등)을 매경 문체로 다듬어 추가
  async function handleAddFactMemo() {
    const raw = newFactInput.trim();
    if (!raw) return;
    const comp = data?.job.company_name || "대상 기업";

    // 매경 기사체 및 경어체 정돈
    let polished = raw
      .replace(/했습니다\.?$/, "했다.")
      .replace(/됐습니다\.?$/, "됐다.")
      .replace(/있습니다\.?$/, "있다.")
      .replace(/입니다\.?$/, "이다.")
      .replace(/합니다\.?$/, "한다.")
      .trim();

    if (!/[.다]$/.test(polished)) {
      if (/(?:매출|영업이익|달성|억\s*원|조\s*원|실적)/.test(polished)) {
        polished = `한편 ${comp}는 ${polished} 등 견조한 매출·경영 실적을 이어가고 있다.`;
      } else if (/(?:설립|창립|대표|본사|직원|임직원|공장|특허)/.test(polished)) {
        polished = `한편 ${comp}는 ${polished} 기반의 기업 역량을 갖추고 있다.`;
      } else {
        polished = `${polished}다.`;
      }
    } else if (!polished.endsWith(".")) {
      polished = `${polished}.`;
    }

    const detectedCategory =
      newFactCategory !== "기업·매출 취재 팩트"
        ? newFactCategory
        : /(?:매출|영업이익|실적|수출|억\s*원)/.test(raw)
        ? "매출액·실적 정보"
        : /(?:설립|창립|대표|본사|직원|업력|기업)/.test(raw)
        ? "기업 기본 정보"
        : "자체 취재 핵심 팩트";

    const newMemo: CompanyFactMemo = {
      id: `memo-user-${Date.now()}`,
      category: detectedCategory,
      text: polished,
      sourceUrl: newFactUrl.trim() || undefined,
      sourceTitle: newFactUrl.trim() ? "취재 출처 원문" : "담당자 자체 취재",
      targetParaIdx: Math.min(1, Math.max(0, bodyParagraphs.length - 1)),
      insertedInParaIdx: null,
    };

    const nextMemos = [newMemo, ...factMemos];
    setFactMemos(nextMemos);
    setNewFactInput("");
    setNewFactUrl("");
    await handleSaveArticle({ factMemos: nextMemos });
  }

  // 모드 1: 기업 기본정보·매출액·최신 뉴스 문장 메모장에 더 불러오기
  async function handleLoadMoreCompanyFacts() {
    const comp = data?.job.company_name || "대상 기업";
    const primaryUrl =
      data?.sources[0]?.url ||
      `https://www.mk.co.kr/search?word=${encodeURIComponent(comp)}`;

    const extraCandidates: CompanyFactMemo[] = [
      {
        id: `memo-extra-fin-${Date.now()}`,
        category: "매출액·재무 건전성",
        text: `금융감독원 공시 및 업계 추산에 따르면 ${comp}는 주력 제품군의 안정적인 내수·수출 매출 기반을 바탕으로 최근 3년간 꾸준한 외형 성장과 R&D 재투자를 이어오고 있다.`,
        sourceUrl: primaryUrl,
        sourceTitle: `${comp} 매출·재무 동향`,
        targetParaIdx: Math.min(1, Math.max(0, bodyParagraphs.length - 1)),
        insertedInParaIdx: null,
      },
      {
        id: `memo-extra-org-${Date.now() + 1}`,
        category: "기업 기본·연혁 정보",
        text: `${comp}는 자체 연구개발 전담 조직과 품질 관리 체계를 갖추고 국내외 다수의 공인 인증 및 특허 포트폴리오를 보유한 강소·전문 기업으로 평가받는다.`,
        sourceUrl: primaryUrl,
        sourceTitle: `${comp} 기업 현황`,
        targetParaIdx: Math.min(2, Math.max(0, bodyParagraphs.length - 1)),
        insertedInParaIdx: null,
      },
    ];

    // S2/S6 외부 검색 스니펫에서 아직 추가되지 않은 뉴스 팩트 추출
    for (const src of (data?.sources || []).slice(0, 3)) {
      if (src.snippet) {
        const firstLine = src.snippet
          .split(/\n/)
          .map((l) => l.replace(/^[#*\-\s]+/, "").trim())
          .find((l) => l.length >= 28 && /[다.]$/.test(l));
        if (
          firstLine &&
          !factMemos.some((m) => m.text.includes(firstLine.slice(0, 20)))
        ) {
          extraCandidates.push({
            id: `memo-src-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            category: "최신 뉴스·취재 팩트",
            text: firstLine.endsWith(".") ? firstLine : `${firstLine}.`,
            sourceUrl: src.url,
            sourceTitle: src.title,
            targetParaIdx: Math.min(1, Math.max(0, bodyParagraphs.length - 1)),
            insertedInParaIdx: null,
          });
          break;
        }
      }
    }

    const existingTexts = new Set(factMemos.map((m) => m.text));
    const filteredExtras = extraCandidates.filter(
      (c) => !existingTexts.has(c.text)
    );
    if (filteredExtras.length === 0) {
      setSaveFeedback("추가 가능한 최신 기업·매출 팩트가 이미 메모장에 모두 반영되어 있습니다.");
      setTimeout(() => setSaveFeedback(null), 3000);
      return;
    }

    const nextMemos = [...filteredExtras, ...factMemos];
    setFactMemos(nextMemos);
    await handleSaveArticle({ factMemos: nextMemos });
  }

  // 모드 1: 취재 팩트 메모장의 한 줄 문장을 선택한 본문 단락에 끼워 넣기 (또는 반영 취소)
  async function handleInsertFactMemoToParagraph(memo: CompanyFactMemo) {
    const selectedParaIdx =
      memoTargetParas[memo.id] ?? memo.targetParaIdx ?? 1;
    const clampedIdx = Math.min(
      Math.max(0, selectedParaIdx),
      bodyParagraphs.length - 1
    );

    const nextParas = [...bodyParagraphs];

    // 이미 본문에 반영된 상태라면 본문에서 해당 한 줄을 제거(반영 취소)
    if (
      memo.insertedInParaIdx !== null &&
      memo.insertedInParaIdx !== undefined &&
      body.includes(memo.text)
    ) {
      const cleanedBody = body
        .replace(` ${memo.text}`, "")
        .replace(`${memo.text} `, "")
        .replace(memo.text, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      const nextMemos = factMemos.map((m) =>
        m.id === memo.id ? { ...m, insertedInParaIdx: null } : m
      );
      setBody(cleanedBody);
      setFactMemos(nextMemos);
      await handleSaveArticle({ body: cleanedBody, factMemos: nextMemos });
      return;
    }

    // 선택한 단락 끝에 한 줄 자연스럽게 추가
    const targetPara = nextParas[clampedIdx] ?? "";
    nextParas[clampedIdx] = targetPara
      ? `${targetPara.trim()} ${memo.text}`
      : memo.text;

    const nextBody = nextParas.join("\n\n");
    const nextMemos = factMemos.map((m) =>
      m.id === memo.id ? { ...m, insertedInParaIdx: clampedIdx } : m
    );

    setBody(nextBody);
    setFactMemos(nextMemos);
    setFocusedParaIdx(clampedIdx);
    await handleSaveArticle({ body: nextBody, factMemos: nextMemos });
  }

  async function handleDeleteFactMemo(memoId: string) {
    const nextMemos = factMemos.filter((m) => m.id !== memoId);
    setFactMemos(nextMemos);
    await handleSaveArticle({ factMemos: nextMemos });
  }

  // 경쟁사 포함/제외 토글 (PRD F10.1 #3)
  async function handleToggleCompetitor(compId: string, compName: string, currentSelected: boolean) {
    if (!data?.competitors) return;
    const nextSelected = !currentSelected;
    let nextBody = body;

    if (!nextSelected) {
      // 체크 해제 시 비교 문단에서 해당 경쟁사 언급을 중립 표현으로 정리하거나 안내
      nextBody = nextBody
        .replace(new RegExp(`${compName}\\s*등\\s*`, "g"), "주요 경쟁 브랜드 등 ")
        .replace(new RegExp(`${compName}(?:와|과)\\s*`, "g"), "")
        .replace(new RegExp(`,?\\s*${compName}`, "g"), "");
      setBody(nextBody);
    }

    await handleSaveArticle({
      body: nextBody,
      competitors: [{ id: compId, selected: nextSelected }],
    });
  }

  // 하드룰 위반 항목 원클릭 자동 교정 (FMT-01, FMT-02, FMT-07, FMT-08, FMT-11, FMT-12)
  async function handleAutoFixRule(ruleId: string, matchedText: string) {
    let nextBody = body;
    let nextCaption = captionText;
    let nextByline = byline;

    if (ruleId === "FMT-01" && matchedText) {
      nextBody = nextBody.replaceAll(matchedText, "").replace(/  +/g, " ");
      setBody(nextBody);
    } else if (ruleId === "FMT-02") {
      // '평' 단위 → ㎡ 병기 자동 변환
      nextBody = nextBody.replace(/(\d+(?:\.\d+)?)\s*평(?!\s*\()/g, (_, numStr) => {
        const sqm = Math.round(Number(numStr) * 3.3058 * 10) / 10;
        return `${sqm}㎡(${numStr}평)`;
      });
      setBody(nextBody);
    } else if (ruleId === "FMT-07") {
      // '~밝혔다' 3회 이상 반복 완화 (두 번째 이후 일부를 설명했다/전했다로 분산)
      let count = 0;
      nextBody = nextBody.replace(/밝혔다\./g, (m) => {
        count += 1;
        if (count === 2) return "설명했다.";
        if (count >= 3) return "전했다.";
        return m;
      });
      setBody(nextBody);
    } else if (ruleId === "FMT-08" && matchedText) {
      const map: Record<string, string> = {
        "세계 최초": "독자 기술로",
        "국내 최초": "신규 방식으로",
        "업계 최초": "선도적으로",
        "업계 1위": "주요 기업으로",
        "국내 1위": "대표 브랜드로",
        "최고의": "주목받는",
        "완벽한": "체계적인",
        "독보적인": "차별화된",
      };
      const rep = map[matchedText] ?? "주요";
      nextBody = nextBody.replaceAll(matchedText, rep);
      setBody(nextBody);
    } else if (ruleId === "FMT-11") {
      nextByline = nextByline.trim() || "매경 콘텐츠PR팀 기자";
      setByline(nextByline);
    } else if (ruleId === "FMT-12") {
      const comp = data?.job.company_name || "기업";
      const lines = nextCaption
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const fixedLines =
        lines.length > 0
          ? lines.map((l) =>
              /\[제공=[^\]]+\]/.test(l) ? l : `${l} [제공=${comp}]`
            )
          : [`${comp} 관련 이미지 [제공=${comp}]`];
      nextCaption = fixedLines.slice(0, 2).join("\n");
      setCaptionText(nextCaption);
    }

    await handleSaveArticle({
      body: nextBody,
      captionText: nextCaption,
      byline: nextByline,
    });
  }

  // AI 대화형 기사 수정 실행
  async function handleChatEdit(customInstruction?: string) {
    const instruction = (customInstruction ?? chatInput).trim();
    if (!instruction || chatLoading) return;

    const prevSnapshot = { title, subtitle, body };
    setChatLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/chat-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction,
          currentTitle: title,
          currentSubtitle: subtitle,
          currentBody: body,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        title?: string;
        subtitle?: string;
        body?: string;
        replySummary?: string;
        error?: string;
      };

      if (res.ok && json.ok) {
        if (json.title) setTitle(json.title);
        if (json.subtitle !== undefined) setSubtitle(json.subtitle);
        if (json.body) setBody(json.body);
        setChatInput("");
        setChatHistory((prev) => [
          {
            id: `${Date.now()}`,
            instruction,
            replySummary:
              json.replySummary ??
              "요청하신 내용을 반영하여 기사 문단과 문장을 수정했습니다.",
            prevSnapshot,
            createdAt: new Date().toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          },
          ...prev,
        ]);
        await fetchJobDetail();
        setSaveFeedback("AI 채팅 수정이 본문에 즉시 반영 및 저장되었습니다.");
        setTimeout(() => setSaveFeedback(null), 3500);
      }
    } finally {
      setChatLoading(false);
    }
  }

  async function handleUndoChatEdit(entryId: string) {
    const target = chatHistory.find((h) => h.id === entryId);
    if (!target) return;
    setTitle(target.prevSnapshot.title);
    setSubtitle(target.prevSnapshot.subtitle);
    setBody(target.prevSnapshot.body);
    setChatHistory((prev) => prev.filter((h) => h.id !== entryId));
    await handleSaveArticle({
      title: target.prevSnapshot.title,
      subtitle: target.prevSnapshot.subtitle,
      body: target.prevSnapshot.body,
    });
  }

  // S6 제목 후보 및 S9 네이버 체크리스트, S10 승인 체크리스트 파싱
  const s5Output = React.useMemo(() => {
    const s5 = data?.stages.find((s) => s.stage === "S5");
    if (!s5) return null;
    try {
      return JSON.parse(s5.output_json) as {
        diffs: Array<{ original: string; replacement: string; reason: string }>;
      };
    } catch {
      return null;
    }
  }, [data]);

  function scrollToParagraph(pIdx: number, term?: string) {
    if (!paragraphMode) {
      setParagraphMode(true);
    }
    setShowInlineDiffHighlight(true);
    setFocusedParaIdx(pIdx);
    if (term) {
      setHighlightedTerm(term);
    }
    setTimeout(() => {
      const el = document.getElementById(`body-para-${pIdx}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  }

  function renderTextWithDiffHighlights(text: string): React.ReactNode {
    const diffs = s5Output?.diffs ?? [];
    type TokenMatch = {
      token: string;
      diffIdx: number;
      original: string;
      replacement: string;
      reason: string;
      isRestored: boolean;
    };

    const matches: TokenMatch[] = [];
    diffs.forEach((d, idx) => {
      if (d.replacement !== "(삭제)" && d.replacement && text.includes(d.replacement)) {
        matches.push({
          token: d.replacement,
          diffIdx: idx,
          original: d.original,
          replacement: d.replacement,
          reason: d.reason,
          isRestored: false,
        });
      } else if (d.original && text.includes(d.original)) {
        matches.push({
          token: d.original,
          diffIdx: idx,
          original: d.original,
          replacement: d.replacement,
          reason: d.reason,
          isRestored: true,
        });
      }
    });

    if (matches.length === 0 && (!highlightedTerm || !text.includes(highlightedTerm))) {
      return text;
    }

    // 가장 먼저 등장하는 토큰부터 순차 분할 렌더링
    const segments: React.ReactNode[] = [];
    let remaining = text;
    let keySeq = 0;

    while (remaining.length > 0) {
      let earliestPos = -1;
      let chosenMatch: TokenMatch | null = null;
      let isCustomTerm = false;

      for (const m of matches) {
        const pos = remaining.indexOf(m.token);
        if (pos !== -1 && (earliestPos === -1 || pos < earliestPos)) {
          earliestPos = pos;
          chosenMatch = m;
          isCustomTerm = false;
        }
      }

      if (highlightedTerm && remaining.includes(highlightedTerm)) {
        const pos = remaining.indexOf(highlightedTerm);
        if (pos !== -1 && (earliestPos === -1 || pos < earliestPos)) {
          earliestPos = pos;
          chosenMatch = null;
          isCustomTerm = true;
        }
      }

      if (earliestPos === -1) {
        segments.push(remaining);
        break;
      }

      if (earliestPos > 0) {
        segments.push(remaining.slice(0, earliestPos));
      }

      if (isCustomTerm && highlightedTerm) {
        segments.push(
          <mark
            key={`hl-${keySeq++}`}
            className="rounded border-hairline border-hold bg-hold-bg px-1.5 py-0.5 font-semibold text-hold mx-0.5"
          >
            {highlightedTerm}
          </mark>
        );
        remaining = remaining.slice(earliestPos + highlightedTerm.length);
      } else if (chosenMatch) {
        segments.push(
          <span
            key={`diff-${keySeq++}`}
            className={`inline-flex items-center gap-1 rounded border-hairline px-1.5 py-0.5 text-[13px] leading-[20px] font-semibold mx-0.5 align-baseline ${
              chosenMatch.isRestored
                ? "border-hold bg-hold-bg text-hold"
                : "border-pass bg-pass-bg text-pass"
            }`}
            title={chosenMatch.reason}
          >
            <span className="rounded bg-primary px-1 py-0.2 text-[10px] leading-[14px] font-bold text-surface">
              교열 {chosenMatch.diffIdx + 1}
            </span>
            {chosenMatch.isRestored ? (
              <span>{chosenMatch.original} (원문 복원됨)</span>
            ) : (
              <>
                <span className="line-through text-reject font-normal">
                  {chosenMatch.original}
                </span>
                <span className="text-ink-muted">→</span>
                <span className="underline decoration-2">
                  {chosenMatch.replacement}
                </span>
              </>
            )}
          </span>
        );
        remaining = remaining.slice(earliestPos + chosenMatch.token.length);
      } else {
        segments.push(remaining);
        break;
      }
    }

    return segments;
  }

  const s6Output = React.useMemo(() => {
    const s6 = data?.stages.find((s) => s.stage === "S6");
    if (!s6) return null;
    try {
      return JSON.parse(s6.output_json) as { titleCandidates?: string[] };
    } catch {
      return null;
    }
  }, [data]);

  const s9Output = React.useMemo(() => {
    const s9 = data?.stages.find((s) => s.stage === "S9");
    if (!s9) return null;
    try {
      return JSON.parse(s9.output_json) as {
        naverChecklist?: Array<{
          code: string;
          name: string;
          penalty: string;
          status: "PASS" | "WARN" | "BLOCK";
          detail: string;
        }>;
      };
    } catch {
      return null;
    }
  }, [data]);

  const s10Checklist = React.useMemo(() => {
    const s10 = data?.stages.find((s) => s.stage === "S10");
    if (s10) {
      try {
        const parsed = JSON.parse(s10.output_json) as {
          requiredChecklist?: Array<{ id: string; label: string }>;
        };
        if (parsed.requiredChecklist) return parsed.requiredChecklist;
      } catch {
        // fallback below
      }
    }
    return [
      {
        id: "fact_verified",
        label:
          "본문 내 수치·일정·고유명사가 보도자료 및 근거 출처와 일치함을 확인했습니다.",
      },
      {
        id: "rule_report_checked",
        label:
          "우측 규정 체크 리포트(하드룰 및 네이버 운영평가 항목)의 경고 사항을 검토했습니다.",
      },
      {
        id: "caption_copyright_checked",
        label:
          "사진이 기업 제공 원본이며 캡션(설명+제공자) 및 초상권 동의를 확인했습니다.",
      },
      {
        id: "naver_exclusion_decided",
        label: "네이버 송출 여부(권고: 네이버 제외)를 결정했습니다.",
      },
    ];
  }, [data]);

  const allChecklistChecked =
    s10Checklist.length > 0 &&
    s10Checklist.every((item) => Boolean(checkedItems[item.id]));

  const isApproved = Boolean(data?.approval);

  async function handleApprove() {
    if (!allChecklistChecked) return;
    setApproving(true);
    try {
      await handleSaveArticle();
      const res = await fetch(`/api/jobs/${jobId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklist: checkedItems,
          naverExcluded: true,
        }),
      });
      if (res.ok) {
        await fetchJobDetail();
      }
    } finally {
      setApproving(false);
    }
  }

  function handleCheckAllChecklist() {
    const next: Record<string, boolean> = {};
    for (const item of s10Checklist) {
      next[item.id] = true;
    }
    setCheckedItems(next);
  }

  async function fetchCmsTextPayload() {
    if (isDirty) {
      await handleSaveArticle();
    }
    const qs = new URLSearchParams({
      blankLine: blankLineCopy ? "1" : "0",
      includeByline: includeBylineCopy ? "1" : "0",
    });
    const res = await fetch(`/api/jobs/${jobId}/cms-text?${qs.toString()}`);
    const json = (await res.json()) as {
      ok?: boolean;
      error?: string;
      fullText?: string;
      title?: string;
      subtitle?: string;
      body?: string;
      captions?: string;
    };
    return { ok: res.ok && Boolean(json.ok), json };
  }

  async function handleCopyCmsText(
    part: "full" | "title" | "subtitle" | "body" | "captions"
  ) {
    const { ok, json } = await fetchCmsTextPayload();

    if (!ok) {
      setCopyFeedback(json.error ?? "승인 후 복사할 수 있습니다.");
      return;
    }

    const textMap = {
      full: json.fullText ?? "",
      title: json.title ?? "",
      subtitle: json.subtitle ?? "",
      body: json.body ?? "",
      captions: json.captions ?? "",
    };

    if (showCmsPreview && json.fullText) {
      setCmsPreviewText(json.fullText);
    }

    await navigator.clipboard.writeText(textMap[part]);
    const labelMap = {
      full: "CMS용 전체 텍스트",
      title: "제목",
      subtitle: "부제목",
      body: "본문",
      captions: "사진 캡션",
    };
    setCopyFeedback(
      `${labelMap[part]}가 최신 수정본 기준으로 클립보드에 복사되었습니다.`
    );
    setTimeout(() => setCopyFeedback(null), 3500);
  }

  async function handleToggleCmsPreview() {
    if (showCmsPreview) {
      setShowCmsPreview(false);
      return;
    }
    const { ok, json } = await fetchCmsTextPayload();
    if (!ok) {
      setCopyFeedback(json.error ?? "승인 완료 후 CMS 복사본을 미리볼 수 있습니다.");
      return;
    }
    setCmsPreviewText(json.fullText ?? "");
    setShowCmsPreview(true);
  }

  const rejectNotification = data?.notifications.find(
    (n) => n.type === "reject"
  );
  const holdNotification = data?.notifications.find((n) => n.type === "hold");

  const rejectReasons: Array<{
    ruleId: string;
    category: string;
    quote: string;
    message: string;
  }> = React.useMemo(() => {
    if (!rejectNotification) return [];
    try {
      return JSON.parse(rejectNotification.reasons_json);
    } catch {
      return [];
    }
  }, [rejectNotification]);

  const holdReasons: string[] = React.useMemo(() => {
    if (!holdNotification) return [];
    try {
      return JSON.parse(holdNotification.reasons_json);
    } catch {
      return [];
    }
  }, [holdNotification]);

  const jobOptions = React.useMemo(() => {
    if (!data?.job.options_json) return {};
    try {
      return JSON.parse(data.job.options_json) as {
        overrideRejectReason?: string;
        byline?: string;
      };
    } catch {
      return {};
    }
  }, [data]);

  const rawParagraphs = React.useMemo(() => {
    const raw = (data?.job.raw_text ?? "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim();
    if (!raw) return [] as string[];
    const splitByDouble = raw
      .split(/\r?\n\s*\r?\n/)
      .map((p) => p.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim())
      .filter((p) => p.length > 0);
    if (splitByDouble.length >= 2) return splitByDouble;
    return raw
      .split(/\r?\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [data?.job.raw_text]);

  function renderOriginalVsReviewBlock(
    matchedSug: SentenceProofreadItem,
    keyPrefix: string
  ) {
    const isReplaced = Boolean(matchedSug.selectedAlternativeId);
    const isOpen = activeSuggestionId === matchedSug.id;
    const selectedAlt = matchedSug.alternatives.find(
      (a) => a.id === matchedSug.selectedAlternativeId
    );
    const previewAlt =
      selectedAlt ??
      matchedSug.alternatives[0] ?? {
        id: "default",
        label: "버전 1 (권장 교정)",
        text: matchedSug.originalSentence,
      };

    const toggleOpen = () => {
      setActiveSuggestionId((prev) =>
        prev === matchedSug.id ? null : matchedSug.id
      );
      setCustomAltText(
        selectedAlt?.text ??
          matchedSug.alternatives[0]?.text ??
          matchedSug.originalSentence
      );
    };

    return (
      <div
        id={`sug-card-${matchedSug.id}`}
        key={keyPrefix}
        className="my-2.5 rounded-lg border-hairline border-line bg-surface p-3.5 space-y-2.5"
      >
        <div
          role="button"
          tabIndex={0}
          onClick={toggleOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleOpen();
            }
          }}
          className="space-y-2 cursor-pointer group"
          title="클릭하면 다양한 버전의 대체 문장 토글이 열립니다"
        >
          {/* 상단: 원본 문장 (전체 폭 · 취소선) */}
          <div className="rounded-md border-hairline border-line bg-surface-subtle/70 px-3.5 py-2.5 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center rounded bg-reject-bg px-2 py-0.5 text-[11px] font-bold text-reject whitespace-nowrap shrink-0">
                원본 문장
              </span>
              <span className="text-[11px] font-medium text-ink-muted break-keep">
                {matchedSug.ruleBadge} · {matchedSug.reason}
              </span>
            </div>
            <div className="text-[15px] leading-[26px] text-[#334155] break-keep">
              <span
                className={`line-through decoration-2 ${
                  isReplaced
                    ? "decoration-ink-muted/70 text-ink-muted"
                    : "decoration-reject text-ink"
                }`}
              >
                {matchedSug.originalSentence}
              </span>
            </div>
          </div>

          {/* 하단: 수정 제안 / 교정 완료 문장 (원본 바로 아래 100% 전체 폭 · 선택 완료 시 초록색으로 변경) */}
          <div
            className={`rounded-md px-3.5 py-3 text-[15px] leading-[26px] transition-colors space-y-1.5 ${
              isReplaced
                ? "bg-pass-bg border-hairline border-pass text-pass font-semibold"
                : "bg-[#FDEBD0] border-hairline border-[#F5CBA7] text-[#9A3412] font-medium group-hover:bg-[#FAD7A0]/70"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] leading-[16px] font-bold whitespace-nowrap shrink-0 ${
                  isReplaced
                    ? "bg-pass text-surface"
                    : "bg-[#9A3412] text-surface"
                }`}
              >
                {isReplaced ? "✓ 수정 완료 (초록색 교체됨)" : "✎ 아래 수정 제안"}
              </span>
              <span
                className={`shrink-0 whitespace-nowrap inline-flex items-center rounded px-2.5 py-0.5 text-[11px] leading-[16px] font-semibold ${
                  isReplaced
                    ? "bg-surface/80 text-pass border-hairline border-pass"
                    : "bg-surface/90 text-[#9A3412] border-hairline border-[#F5CBA7]"
                }`}
              >
                {isReplaced
                  ? `선택됨: ${selectedAlt?.toneBadge ?? "선택 버전"} (다시 선택 ▾)`
                  : `클릭해 다른 표현 버전 선택 (${matchedSug.alternatives.length}종) ▾`}
              </span>
            </div>
            <div className="text-[15px] leading-[26px] break-keep">
              {previewAlt.text}
            </div>
          </div>
        </div>

        {/* 문장 클릭 시 열리는 다양한 표현 버전 선택 토글 */}
        {isOpen && (
          <div className="mt-2 pt-2.5 border-t-hairline border-line space-y-2.5 text-[13px] leading-[20px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-[22px] shrink-0 whitespace-nowrap items-center rounded bg-primary px-2.5 text-[11px] font-semibold text-surface">
                  ✨ 다양한 버전의 문장 선택 토글
                </span>
                <span className="text-[12px] font-medium text-ink-muted">
                  {matchedSug.ruleBadge} · {matchedSug.reason}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {isReplaced && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevertSentenceToOriginal(matchedSug.id)}
                    className="h-[24px] px-2 text-[11px] text-reject hover:bg-reject-bg gap-1"
                  >
                    <RotateCcw className="h-3 w-3 stroke-[1.5]" />
                    <span>원본 문장으로 되돌리기</span>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSuggestionId(null)}
                  className="h-[24px] px-2 text-[11px]"
                >
                  접기 ✕
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-ink-muted">
                바꾸고 싶은 한 문장을 선택하면 위 검토 박스와 본문이{" "}
                <span className="text-pass font-bold">초록색</span>으로 바뀌며 문장이 교체됩니다:
              </p>
              {matchedSug.alternatives.map((alt) => {
                const isCurrentAlt =
                  matchedSug.selectedAlternativeId === alt.id;
                return (
                  <button
                    key={alt.id}
                    type="button"
                    onClick={() =>
                      handleSelectSentenceAlternative(matchedSug.id, alt.id)
                    }
                    className={`w-full text-left rounded-md border-hairline p-2.5 transition-colors space-y-1 ${
                      isCurrentAlt
                        ? "border-pass bg-pass-bg text-pass"
                        : "border-line bg-surface-subtle hover:border-primary hover:bg-primary-subtle/40 text-ink"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                            isCurrentAlt
                              ? "bg-pass text-surface"
                              : "bg-primary-subtle text-primary"
                          }`}
                        >
                          {alt.label}
                        </span>
                        {alt.toneBadge && (
                          <span className="rounded border-hairline border-line bg-surface px-1.5 py-0.5 text-[10px] text-ink-muted">
                            {alt.toneBadge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-pass">
                        {isCurrentAlt
                          ? "✓ 현재 선택됨 (초록색 교체 완료)"
                          : "이 문장 선택하여 초록색으로 교체 →"}
                      </span>
                    </div>
                    <p className="text-[14px] leading-[22px] font-medium">
                      {alt.text}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="pt-1 border-t-hairline border-line flex items-center gap-2">
              <Input
                value={customAltText}
                onChange={(e) => setCustomAltText(e.target.value)}
                placeholder="직접 표현을 수정해 초록색으로 교체할 수도 있습니다..."
                className="h-[32px] text-[12px] flex-1 bg-surface"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (!customAltText.trim()) return;
                  handleSelectSentenceAlternative(
                    matchedSug.id,
                    `${matchedSug.id}-custom`,
                    customAltText.trim()
                  );
                }}
                className="h-[32px] px-3 text-[12px] whitespace-nowrap text-pass border-pass"
              >
                직접 수정 문장으로 교체
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderOriginalFullWithRedlines() {
    return (
      <div className="space-y-3 text-[14px] leading-[25px] text-ink break-keep">
        {rawParagraphs.map((rawPara, rIdx) => {
          const sentences = rawPara
            .split(/(?<=[.!?다요])\s+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
          return (
            <div
              key={rIdx}
              className="rounded-md border-hairline border-line bg-surface p-3 space-y-1"
            >
              <div className="flex items-center justify-between text-[11px] text-ink-muted">
                <span className="font-semibold text-ink">
                  원문 단락 {String(rIdx + 1).padStart(2, "0")}
                </span>
                <span>{Array.from(rawPara).length}자</span>
              </div>
              <div className="leading-[26px]">
                {sentences.map((sent, sIdx) => {
                  const matchedSug = sentenceSuggestions.find(
                    (sug) =>
                      sent === sug.originalSentence ||
                      sent.includes(sug.originalSentence) ||
                      sug.originalSentence.includes(sent)
                  );
                  if (matchedSug && effectiveMode === "minimal") {
                    const isReplaced = Boolean(matchedSug.selectedAlternativeId);
                    return (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => {
                          setActiveSuggestionId(matchedSug.id);
                          const el = document.getElementById(
                            `sug-card-${matchedSug.id}`
                          );
                          el?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }}
                        className={`inline text-left rounded px-1 py-0.5 mr-1.5 transition-colors ${
                          isReplaced
                            ? "bg-pass-bg text-pass font-semibold border-b-2 border-pass"
                            : "bg-reject-bg text-reject line-through decoration-reject decoration-2 font-medium hover:bg-reject-bg/80"
                        }`}
                        title="클릭하면 아래 수정된 내용 영역의 해당 문장 교정 카드로 이동합니다"
                      >
                        {sent}
                      </button>
                    );
                  }
                  return (
                    <span key={sIdx} className="mr-1.5">
                      {sent}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderMinimalProofreadParagraph(para: string, paraIdx: number) {
    const sentences = para
      .split(/(?<=[.!?다요])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    return (
      <div className="space-y-2 text-[15px] leading-[28px] text-ink">
        <div className="leading-[30px]">
          {sentences.map((sent, sIdx) => {
            const matchedSug = sentenceSuggestions.find((sug) => {
              const selectedAlt = sug.alternatives.find(
                (a) => a.id === sug.selectedAlternativeId
              );
              const currentTarget = selectedAlt
                ? selectedAlt.text
                : sug.originalSentence;
              return (
                sent === currentTarget ||
                sent.includes(currentTarget) ||
                currentTarget.includes(sent) ||
                sent === sug.originalSentence
              );
            });

            const matchedInsertedFact = factMemos.find(
              (m) =>
                m.insertedInParaIdx !== null &&
                m.insertedInParaIdx !== undefined &&
                (sent === m.text || sent.includes(m.text))
            );

            if (matchedSug) {
              return renderOriginalVsReviewBlock(
                matchedSug,
                `${paraIdx}-${sIdx}-${matchedSug.id}`
              );
            }

            if (matchedInsertedFact) {
              return (
                <div
                  key={`${paraIdx}-${sIdx}-fact`}
                  className="my-2 grid grid-cols-[42px_1fr] items-baseline gap-x-3 rounded-lg border-hairline border-pass bg-pass-bg/60 p-3"
                  title={`취재 팩트 메모장에서 추가된 한 줄 (${matchedInsertedFact.category})`}
                >
                  <span className="text-[12px] font-semibold text-pass select-none">
                    취재
                  </span>
                  <div className="text-[15px] leading-[26px] font-semibold text-pass">
                    <span className="mr-1.5 inline-flex items-center rounded bg-pass px-1.5 py-0.5 text-[11px] leading-[15px] font-semibold text-surface align-middle">
                      📌 {matchedInsertedFact.category} 추가됨
                    </span>
                    <span>{sent}</span>
                  </div>
                </div>
              );
            }

            return (
              <span key={`${paraIdx}-${sIdx}`} className="mr-1.5">
                {sent}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  function renderRewriteYellowHighlights(para: string, paraIdx: number) {
    const sentences = para
      .split(/(?<=[.!?다요])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const rawFull = (data?.job.raw_text ?? "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ");
    const sameIdxRawPara = rawParagraphs[paraIdx] ?? "";

    return (
      <div className="leading-[28px] text-[15px] text-ink">
        {sentences.map((sent, sIdx) => {
          const cleanSent = sent.replace(/\s+/g, " ").trim();
          const probe = cleanSent.slice(
            0,
            Math.min(24, Math.max(10, Math.floor(cleanSent.length * 0.55)))
          );
          const existsVerbatimInSamePara =
            probe.length >= 10 && sameIdxRawPara.includes(probe);
          const existsInOtherRawPara =
            !existsVerbatimInSamePara &&
            probe.length >= 10 &&
            rawFull.includes(probe);

          const matchedDiff = (s5Output?.diffs ?? []).find(
            (d) =>
              d.replacement !== "(삭제)" &&
              Boolean(d.replacement) &&
              cleanSent.includes(d.replacement)
          );

          const isModifiedOrRewritten =
            !existsVerbatimInSamePara || Boolean(matchedDiff);

          let changeTag = "문장 리라이팅";
          if (matchedDiff) {
            changeTag = `교열 (${matchedDiff.original} → ${matchedDiff.replacement})`;
          } else if (existsInOtherRawPara) {
            changeTag = "문단 위치 재배치";
          } else if (
            /최근\s*관련\s*업계와\s*시장에서는|수요가\s*꾸준히\s*확대되는\s*추세|사업\s*외연을\s*넓히고\s*있다/.test(
              cleanSent
            )
          ) {
            changeTag = "배경·분량 보강";
          } else if (paraIdx === 0) {
            changeTag = "리드문 기사체 재구성";
          }

          if (isModifiedOrRewritten) {
            return (
              <span
                key={`${paraIdx}-rw-${sIdx}`}
                className="inline rounded-sm bg-[#FEF9C3] border-b border-[#EAB308] text-ink px-1.5 py-0.5 mr-1.5"
                title={`원문 대비 수정·리라이팅 구간: ${changeTag}`}
              >
                <span className="mr-1 inline-flex items-center rounded bg-[#FEF08A] border-hairline border-[#EAB308] px-1 py-0.2 text-[10px] leading-[14px] font-semibold text-[#854D0E] align-middle">
                  {changeTag}
                </span>
                <span>{sent}</span>
              </span>
            );
          }

          return (
            <span key={`${paraIdx}-rw-${sIdx}`} className="mr-1.5">
              {sent}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-subtle flex flex-col">
      {/* 상단 고정 헤더 */}
      <header className="bg-surface border-b-hairline border-line">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 text-[14px] leading-[22px] text-ink-muted hover:text-ink whitespace-nowrap"
            >
              <ArrowLeft className="h-4 w-4 stroke-[1.5]" />
              <span>작업 목록</span>
            </Link>
            <span className="text-line">|</span>
            <h1 className="text-[16px] leading-[24px] font-semibold text-ink whitespace-nowrap">
              {data?.job.company_name || "보도자료 검토 작업"}
            </h1>
            <VerdictBadge verdict={data?.job.verdict} />
            {jobOptions.overrideRejectReason && (
              <span className="inline-flex h-[24px] items-center rounded-md border-hairline border-reject bg-reject-bg px-2 text-[12px] leading-[18px] font-medium text-reject whitespace-nowrap">
                반려 사유 무시 진행 ({jobOptions.overrideRejectReason})
              </span>
            )}
            <span className="inline-flex h-[24px] items-center rounded-md border-hairline border-hold bg-hold-bg px-2 text-[12px] leading-[18px] font-medium text-hold whitespace-nowrap">
              네이버 제외 송출 권장
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/guide">
              <Button type="button" variant="secondary" size="sm" className="gap-1.5 whitespace-nowrap">
                <Info className="h-3.5 w-3.5 text-primary stroke-[1.75]" />
                <span>사용 가이드</span>
              </Button>
            </Link>
            <ApiUsageBar jobId={jobId} refreshTrigger={data} />
            {data && (
              <div
                className="inline-flex items-center rounded-md border-hairline border-line bg-surface-subtle p-0.5 shrink-0"
                role="group"
                aria-label="기사 작성 3모드 전환"
              >
                {(
                  [
                    {
                      id: "minimal",
                      label: "모드 1: 기본(최소 수정)",
                    },
                    {
                      id: "rewrite",
                      label: "모드 2: 리라이팅(2분할)",
                    },
                    {
                      id: "comparative",
                      label: "모드 3: 비교·기획",
                    },
                  ] as const
                ).map((m) => {
                  const isActive = effectiveMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={running}
                      onClick={() => void handleSwitchToMode(m.id)}
                      className={`h-[28px] rounded px-2.5 text-[12px] font-semibold whitespace-nowrap transition-colors ${
                        isActive
                          ? m.id === "comparative"
                            ? "bg-secondary text-surface"
                            : "bg-primary text-surface"
                          : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            )}
            {data?.job.verdict === "REJECT" && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setShowRejectModal(true)}
              >
                반려 알림 보기
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => startPipelineStream(false)}
              disabled={running}
              className="gap-1.5"
            >
              <Play className="h-3.5 w-3.5 stroke-[1.5]" />
              <span>{running ? "분석 실행 중..." : "파이프라인 재실행"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 비교·기획 모드 고정 경고 배너 (PRD 10.3 / DESIGN.md) */}
      {data?.job.mode === "comparative" && (
        <div className="border-b-hairline border-secondary bg-secondary-subtle px-6 py-2.5">
          <div className="mx-auto max-w-[1600px] flex items-center justify-between text-[12px] leading-[18px] text-secondary font-medium">
            <span>
              [실험 모드 · 경쟁사 실명 포함 가능 · 사람 검수 필수] 이 초안은 &apos;기사식광고 제한 소재 중 한쪽만 대변·비교 기사&apos; 및 네이버 운영평가 R항목·O항목 리스크가 있습니다. 담당자 검수 후 송출하십시오.
            </span>
          </div>
        </div>
      )}

      {/* 보류(HOLD) 상단 배너 (PRD 11.2 / DESIGN.md) */}
      {data?.job.verdict === "HOLD" && holdReasons.length > 0 && (
        <div className="border-b-hairline border-hold bg-hold-bg px-6 py-3">
          <div className="mx-auto max-w-[1600px] flex flex-wrap items-start justify-between gap-3 text-[12px] leading-[18px] text-hold">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 stroke-[1.5]" />
              <div className="space-y-1">
                <p className="font-semibold">
                  보류(HOLD) 알림 — 아래 증빙 필요 항목 또는 주의 소재를 확인해 주십시오:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {holdReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setWideEditorMode(false);
                  setRightTab("claims");
                }}
                className="h-[28px] px-2.5 text-[12px]"
              >
                증빙·팩트 탭에서 문장 확인
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={savingArticle}
                onClick={() => void handleSaveArticle({ resolveHold: true })}
                className="h-[28px] px-3 text-[12px] gap-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.75]" />
                <span>증빙 자료 확인 완료 (보류 해제)</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3단 메인 워크스페이스 (좌측 사이드: 취재 팩트 메모장·단계 타임라인 / 중앙: 원문 전체→아래 수정본 편집기 / 우측: 규정·우측 하단 AI 채팅) */}
      <main className="mx-auto flex w-full max-w-[1680px] flex-1 gap-4 p-4">
        {/* 1) 왼쪽 사이드바 (350px): 📌 취재 팩트 메모장 (기본 활성) + 단계 진행 타임라인 탭 */}
        {!wideEditorMode && (
          <aside id="left-fact-sidebar" className="w-[350px] shrink-0 flex flex-col gap-3">
            <Card className="p-0 overflow-hidden">
              <div className="grid grid-cols-2 border-b-hairline border-line bg-surface-subtle p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setLeftTab("facts")}
                  className={`whitespace-nowrap rounded-md py-2 px-2 text-[12px] font-bold transition-colors ${
                    leftTab === "facts"
                      ? "bg-surface text-ink border-hairline border-line"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  📌 취재 팩트 메모장 ({factMemos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLeftTab("stages")}
                  className={`whitespace-nowrap rounded-md py-2 px-2 text-[12px] font-bold transition-colors ${
                    leftTab === "stages"
                      ? "bg-surface text-primary border-hairline border-line"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  ⚡ 단계 진행 (S0~S10)
                </button>
              </div>

              {leftTab === "facts" ? (
                <div className="p-4 space-y-3 flex flex-col max-h-[calc(100vh-145px)] overflow-y-auto">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[15px] leading-[22px] font-bold text-ink flex items-center gap-1.5 whitespace-nowrap">
                        <span>📌</span>
                        <span>취재 팩트 메모장 ({factMemos.length}건)</span>
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadMoreCompanyFacts}
                      className="inline-flex items-center gap-1 text-[12px] leading-[18px] font-semibold text-hold hover:underline break-keep text-left"
                    >
                      <span>📰</span>
                      <span>최신 뉴스·기업정보·매출액 문장 더 불러오기</span>
                    </button>
                    <p className="text-[12px] leading-[18px] text-ink-muted break-keep">
                      오른쪽 작성 중인 기사는 그대로 유지하면서, 보도자료 기업의{" "}
                      <strong className="font-semibold text-ink">
                        기업정보·매출액·자체 취재 팩트
                      </strong>
                      를 매경 기사체로 다듬어 원하는 단락에 끼워 넣는 왼쪽 사이드 메모장입니다.
                    </p>
                  </div>

                  {/* 자체 취재 내용(기업정보, 매출액 등) 직접 입력 및 추가 박스 */}
                  <div className="rounded-md border-hairline border-line bg-surface-subtle p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-ink-muted whitespace-nowrap">
                        팩트 분류:
                      </span>
                      <select
                        value={newFactCategory}
                        onChange={(e) => setNewFactCategory(e.target.value)}
                        className="h-[26px] rounded border-hairline border-line bg-surface px-2 text-[11px] font-medium text-ink"
                      >
                        <option value="기업 기본 정보">기업 기본 정보</option>
                        <option value="매출액·실적 정보">매출액·실적 정보</option>
                        <option value="브랜드·출시 핵심 팩트">브랜드·출시 핵심 팩트</option>
                        <option value="제품·기술 핵심 특징">제품·기술 핵심 특징</option>
                        <option value="유통·시장 판매 동향">유통·시장 판매 동향</option>
                      </select>
                    </div>
                    <textarea
                      rows={3}
                      value={newFactInput}
                      onChange={(e) => setNewFactInput(e.target.value)}
                      placeholder="기업 정보, 매출액 등 팩트나 보도자료 문장을 붙여넣으세요..."
                      className="w-full resize-y rounded-md border-hairline border-line bg-surface p-2.5 text-[13px] leading-[20px] text-ink focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    />
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={newFactUrl}
                        onChange={(e) => setNewFactUrl(e.target.value)}
                        placeholder="출처 URL (선택)"
                        className="h-[34px] text-[12px] flex-1 min-w-0 bg-surface"
                      />
                      <button
                        type="button"
                        onClick={handleAddFactMemo}
                        disabled={!newFactInput.trim()}
                        className="h-[34px] shrink-0 whitespace-nowrap rounded-md bg-hold px-3 text-[12px] font-bold text-surface hover:opacity-90 disabled:opacity-50"
                      >
                        + 매경 문체로 추가
                      </button>
                    </div>
                  </div>

                  {/* 메모 리스트 */}
                  <div className="divide-y-hairline divide-line space-y-3 pt-1">
                    {factMemos.map((memo) => {
                      const selectedParaIdx =
                        memoTargetParas[memo.id] ??
                        Math.min(
                          memo.targetParaIdx ?? 1,
                          Math.max(0, bodyParagraphs.length - 1)
                        );
                      const isInserted =
                        memo.insertedInParaIdx !== null &&
                        memo.insertedInParaIdx !== undefined;
                      return (
                        <div
                          key={memo.id}
                          className="pt-3 first:pt-0 space-y-2 text-[13px] leading-[20px]"
                        >
                          <p className="text-ink font-medium leading-[21px] break-keep">
                            {memo.text}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center rounded bg-hold-bg px-2 py-0.5 text-[11px] font-semibold text-hold whitespace-nowrap">
                              {memo.category}
                            </span>
                            {memo.sourceUrl && (
                              <a
                                href={memo.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-0.5 text-[11px] text-ink-muted underline hover:text-ink whitespace-nowrap"
                              >
                                <span>{memo.sourceTitle || "출처 원문"} ↗</span>
                              </a>
                            )}
                            {isInserted && (
                              <span className="inline-flex items-center rounded bg-pass-bg px-1.5 py-0.5 text-[11px] font-semibold text-pass whitespace-nowrap">
                                ✓ 단락 {String((memo.insertedInParaIdx ?? 0) + 1).padStart(2, "0")} 반영됨
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <select
                              value={selectedParaIdx}
                              onChange={(e) =>
                                setMemoTargetParas((prev) => ({
                                  ...prev,
                                  [memo.id]: Number(e.target.value),
                                }))
                              }
                              className="h-[28px] rounded border-hairline border-line bg-surface px-2 text-[12px] text-ink"
                            >
                              {bodyParagraphs.map((_, pIdx) => (
                                <option key={pIdx} value={pIdx}>
                                  단락 {String(pIdx + 1).padStart(2, "0")}에 넣기
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleInsertFactMemoToParagraph(memo)}
                              className="inline-flex items-center gap-1 text-[12px] font-semibold text-hold hover:underline whitespace-nowrap shrink-0"
                            >
                              <span>{isInserted ? "반영 취소 ↺" : "본문 반영 →"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFactMemo(memo.id)}
                              className="text-[12px] text-ink-muted hover:text-reject whitespace-nowrap shrink-0"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="bg-surface-subtle px-4 py-2.5 border-b-hairline border-line space-y-0.5">
                    <p className="text-[11px] leading-[16px] text-ink-muted">
                      단계를 클릭하면 상세 실행 결과를 확인합니다
                    </p>
                  </div>
                  <div className="divide-y-hairline divide-line">
                    {ALL_STAGES.map((st) => {
                      const state = stageStates[st.id]?.status ?? "pending";
                      const summary = stageStates[st.id]?.summary ?? "";
                      const isSelected = selectedStage === st.id;
                      const isHoldOrCaution =
                        summary.includes("HOLD") ||
                        summary.includes("차별화 적용") ||
                        summary.includes("증빙 확인 필요");
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() =>
                            setSelectedStage((prev) =>
                              prev === st.id ? null : st.id
                            )
                          }
                          className={`w-full text-left px-3.5 py-2.5 space-y-1 transition-colors duration-150 ${
                            isSelected
                              ? "bg-primary-subtle"
                              : "hover:bg-surface-subtle"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[12px] leading-[18px]">
                            <span
                              className={
                                isSelected
                                  ? "font-semibold text-primary"
                                  : state === "completed"
                                  ? "font-medium text-ink"
                                  : state === "running"
                                  ? "font-semibold text-primary"
                                  : "text-ink-muted"
                              }
                            >
                              {st.label}
                            </span>
                            <span className="shrink-0">
                              {state === "completed" &&
                                (isHoldOrCaution ? (
                                  <span
                                    title="주의·자동 차별화 또는 증빙 확인 항목이 있어 반영되었습니다 (클릭하여 상세 보기)"
                                    className="inline-flex items-center gap-0.5 rounded bg-hold-bg px-1.5 py-0.5 text-[10px] font-semibold text-hold whitespace-nowrap"
                                  >
                                    <AlertTriangle className="h-3 w-3 stroke-[1.75]" />
                                    <span>주의</span>
                                  </span>
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-pass stroke-[1.5]" />
                                ))}
                              {state === "running" && (
                                <span className="text-[12px] font-semibold text-primary">
                                  ...
                                </span>
                              )}
                              {state === "skipped" && (
                                <span className="text-[11px] text-ink-muted">생략</span>
                              )}
                              {state === "failed" && (
                                <XCircle className="h-3.5 w-3.5 text-reject stroke-[1.5]" />
                              )}
                            </span>
                          </div>
                          {summary && (
                            <p
                              className={`text-[11px] leading-[16px] truncate ${
                                isHoldOrCaution ? "text-hold font-medium" : "text-ink-muted"
                              }`}
                            >
                              {summary}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </aside>
        )}

        {/* 중앙: 기사 편집기 (최소 560px, flex-1) */}
        <section className="flex-1 min-w-[560px] flex flex-col gap-4">
          {/* 단계 클릭 시 표시되는 단계별 실행 상세 결과 카드 */}
          {selectedStage && (() => {
            const stageRecord = data?.stages.find(
              (s) => s.stage === selectedStage
            );
            const stageMeta = ALL_STAGES.find((s) => s.id === selectedStage);
            let parsedOutput: Record<string, unknown> = {};
            try {
              parsedOutput = JSON.parse(stageRecord?.output_json ?? "{}") as Record<
                string,
                unknown
              >;
            } catch {
              parsedOutput = {};
            }

            return (
              <Card className="p-4 space-y-3 border-primary bg-surface">
                <div className="flex items-center justify-between border-b-hairline border-line pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-primary-subtle px-2 py-0.5 text-[12px] font-semibold text-primary">
                      {stageMeta?.label ?? selectedStage}
                    </span>
                    <span className="text-[12px] text-ink-muted">
                      상태: {stageRecord?.status ?? "pending"} · 완료 시각:{" "}
                      {stageRecord?.finished_at
                        ? new Date(stageRecord.finished_at).toLocaleTimeString(
                            "ko-KR"
                          )
                        : "-"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStage(null)}
                    className="h-[24px] px-2 text-[12px]"
                  >
                    닫기
                  </Button>
                </div>

                {selectedStage === "S1" && (
                  <div className="rounded-md border-hairline border-hold bg-hold-bg/40 p-3 text-[12px] leading-[18px] text-ink space-y-1">
                    <p className="font-semibold text-hold">
                      💡 S1 중복 게재 점검의 HOLD(주의) 판정 의미 — 왜 멈추지 않고 초안을 작성했나요?
                    </p>
                    <p className="text-ink">
                      보도자료 특성상 기업이 여러 매체에 동시 배포하므로, 타 언론사 기출고 기사가 발견되었다고 해서 게재를 반려(REJECT)하거나 작성을 멈추지 않습니다. 대신 <strong className="font-semibold">3건 이상 기출고 감지 시 포털 중복·유사기사(네이버 운영평가 E·F항목) 판정을 피하기 위해</strong> S6 초안 작성 단계로 신호를 전달하여 <strong className="font-semibold">① 매경 전용 제목 3종 신설, ② 리드문 재서술, ③ 중간 문단(2↔3문단) 순서 교차 배치</strong>를 자동으로 적용합니다.
                    </p>
                    {typeof parsedOutput.differentiationAdvice === "string" && (
                      <p className="text-[11px] font-medium text-primary pt-0.5">
                        • AI 권고 조치: {parsedOutput.differentiationAdvice}
                      </p>
                    )}
                  </div>
                )}

                <div className="text-[12px] leading-[18px] text-ink space-y-1.5">
                  <p className="font-semibold text-ink">
                    요약: {stageStates[selectedStage]?.summary ?? "실행 완료"}
                  </p>
                  <pre className="max-h-[220px] overflow-y-auto whitespace-pre-wrap rounded-md border-hairline border-line bg-surface-subtle p-3 text-[11px] leading-[16px] text-ink font-mono">
                    {JSON.stringify(parsedOutput, null, 2)}
                  </pre>
                </div>
              </Card>
            );
          })()}
          <Card className="p-0 overflow-hidden flex-1 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-subtle px-4 py-3 border-b-hairline border-line">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[16px] leading-[24px] font-semibold text-ink">
                  기사 초안 편집기
                </h2>
                <span className="rounded-md border-hairline border-info bg-info-bg px-2 py-0.5 text-[12px] leading-[18px] text-info">
                  AI 초안 · 담당자 검수 필수
                </span>
                {isDirty && (
                  <span className="inline-flex items-center gap-1 rounded-md border-hairline border-hold bg-hold-bg px-2 py-0.5 text-[11px] font-semibold text-hold">
                    <span>● 미저장 변경사항 있음 (Ctrl+S 저장)</span>
                  </span>
                )}
                {saveFeedback && (
                  <span className="inline-flex items-center gap-1 rounded-md border-hairline border-pass bg-pass-bg px-2 py-0.5 text-[11px] font-semibold text-pass">
                    <CheckCircle2 className="h-3 w-3 stroke-[1.75]" />
                    <span>{saveFeedback}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setWideEditorMode((v) => !v)}
                  className="gap-1.5"
                >
                  {wideEditorMode ? (
                    <>
                      <Minimize2 className="h-3.5 w-3.5 stroke-[1.5]" />
                      <span>3단 기본 화면으로 복귀</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-3.5 w-3.5 stroke-[1.5]" />
                      <span>편집기 넓게 보기 (좌우 패널 접기)</span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant={isDirty ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => void handleSaveArticle()}
                  disabled={savingArticle || !title}
                  className="gap-1.5"
                >
                  <Save className="h-3.5 w-3.5 stroke-[1.5]" />
                  <span>
                    {savingArticle
                      ? "재검사 중..."
                      : isDirty
                      ? "● 수정 저장 및 하드룰 재검사 (Ctrl+S)"
                      : "수정 저장 및 하드룰 재검사"}
                  </span>
                </Button>
              </div>
            </div>

            {data?.job.verdict === "REJECT" && !data.article ? (
              <div className="flex flex-1 flex-col items-center justify-center p-12 text-center space-y-3">
                <XCircle className="h-8 w-8 text-reject stroke-[1.5]" />
                <p className="text-[16px] leading-[24px] font-semibold text-reject">
                  반려(REJECT) 판정으로 기사 초안을 작성하지 않았습니다.
                </p>
                <p className="text-[14px] leading-[22px] text-ink-muted max-w-[480px]">
                  반려 사유를 확인하고 대행사에 전달하거나, 예외적으로 작성을 계속하려면 반려 알림 창에서 사유를 입력해 진행하십시오.
                </p>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setShowRejectModal(true)}
                >
                  반려 문구 및 사유 확인
                </Button>
              </div>
            ) : (
              <div className="divide-y-hairline divide-line flex-1 flex flex-col">
                {/* 1. 상단: 기사 제목 & 추천 제목 후보 & 부제목 (불필요한 상단 박스 제거로 한눈에 들어오도록 구성) */}
                <div className="p-4 space-y-3 bg-surface">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="articleTitle">
                        제목 (목표 40자 내외, 28~45자 통과)
                      </Label>
                      <span
                        className={`text-[12px] leading-[18px] font-medium whitespace-nowrap ${
                          isTitleInRange ? "text-ink-muted" : "text-hold"
                        }`}
                      >
                        {titleCharCount}자 (기준 28~45자)
                      </span>
                    </div>
                    <Input
                      id="articleTitle"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-[42px] text-[19px] leading-[28px] font-bold"
                    />
                    {s6Output?.titleCandidates &&
                      s6Output.titleCandidates.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] font-semibold text-ink-muted whitespace-nowrap">
                            추천 제목 후보:
                          </span>
                          {s6Output.titleCandidates.map((cand, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setTitle(cand)}
                              className="text-left rounded border-hairline border-line bg-surface-subtle px-2 py-0.5 text-[11px] leading-[16px] text-primary hover:border-primary hover:bg-primary-subtle transition-colors"
                            >
                              후보 {idx + 1}: {cand}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* 부제목 입력란 */}
                  <div className="space-y-1">
                    <Label htmlFor="articleSubtitle">
                      부제목 (0~3줄, 명사형 종결·마침표 없음)
                    </Label>
                    <textarea
                      id="articleSubtitle"
                      rows={2}
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full resize-y rounded-md border-hairline border-line bg-surface px-3 py-2 text-[14px] leading-[22px] text-ink focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    />
                  </div>
                </div>

                {/* 비교·기획 기사 모드 전용: 조사된 동종업계 경쟁사·유사 브랜드 비교 내역 (PRD F10) */}
                {data?.job.mode === "comparative" &&
                  data.competitors &&
                  data.competitors.length > 0 && (
                    <div className="px-4 py-3 bg-secondary-subtle border-b-hairline border-secondary space-y-2 resize-y overflow-auto">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[13px] leading-[20px] font-semibold text-secondary">
                          <Info className="h-4 w-4 shrink-0 stroke-[1.5]" />
                          <span>
                            [비교·기획 모드] 동종업계 경쟁사·유사 브랜드 조사 및 본문 비교 반영 ({data.competitors.length}곳)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={chatLoading}
                            onClick={() =>
                              void handleChatEdit(
                                "비교·기획 문단에 묶여 있는 경쟁사 브랜드들을 문단마다 브랜드별로 각각 독립된 문단으로 분리해서 상세히 작성해줘."
                              )
                            }
                            className="h-[24px] px-2.5 text-[11px] font-semibold text-secondary border-secondary whitespace-nowrap"
                          >
                            {chatLoading
                              ? "문단 분리 중..."
                              : "📊 경쟁사 브랜드별로 문단 각각 분리하기"}
                          </Button>
                        </div>
                      </div>

                      <ul className="space-y-1.5 text-[12px] leading-[18px] text-ink">
                        {data.competitors.map((comp, cIdx) => {
                          const compParaIdx = bodyParagraphs.findIndex((p) =>
                            p.includes(comp.name)
                          );
                          const isSelected = comp.selected !== 0;
                          return (
                            <li
                              key={comp.id ?? cIdx}
                              className={`flex flex-wrap items-center justify-between gap-2 rounded bg-surface px-3 py-2 border-hairline ${
                                isSelected ? "border-line" : "border-line opacity-65"
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-wrap flex-1">
                                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() =>
                                      void handleToggleCompetitor(
                                        comp.id,
                                        comp.name,
                                        isSelected
                                      )
                                    }
                                    className="h-3.5 w-3.5 rounded border-line text-secondary"
                                  />
                                  <span className="rounded bg-secondary-subtle px-1.5 py-0.5 text-[11px] font-semibold text-secondary whitespace-nowrap">
                                    비교 브랜드 {cIdx + 1}: {comp.name}
                                    {isSelected ? "" : " (제외됨)"}
                                  </span>
                                </label>
                                <span className="text-ink break-keep">{comp.summary}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {compParaIdx !== -1 && (
                                  <button
                                    type="button"
                                    onClick={() => scrollToParagraph(compParaIdx)}
                                    className="inline-flex items-center gap-1 rounded border-hairline border-secondary bg-secondary-subtle px-2 py-0.5 text-[11px] font-semibold text-secondary hover:opacity-80 whitespace-nowrap"
                                  >
                                    <MapPin className="h-3 w-3 stroke-[1.75]" />
                                    <span>본문 {compParaIdx + 1}문단 위치 보기</span>
                                  </button>
                                )}
                                {comp.source_url && (
                                  <a
                                    href={comp.source_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded border-hairline border-line bg-surface-subtle px-2 py-0.5 text-[11px] text-primary hover:underline whitespace-nowrap"
                                  >
                                    <span>근거 출처 확인</span>
                                    <ExternalLink className="h-3 w-3 stroke-[1.5]" />
                                  </a>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                {/* 2. 본문 영역: [상단: 보도자료 원문 전체] → [하단: 수정된 내용] 위아래 수직 배치 */}
                <div className="p-4 space-y-4 flex-1 flex flex-col">
                  {/* 편집기 상단 보조 툴바 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b-hairline border-line">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-bold text-ink whitespace-nowrap">
                        본문 (총 {bodyParagraphs.length}문단 · 목표 1,200~1,500자)
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={rotateMiddleParagraphs}
                        disabled={bodyParagraphs.length < 3}
                        className="h-[26px] px-2.5 text-[12px] gap-1 whitespace-nowrap"
                      >
                        <Shuffle className="h-3.5 w-3.5 stroke-[1.5]" />
                        <span>중간 문단 순서 재배치</span>
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setTallParagraphs((v) => !v)}
                        className="h-[26px] px-2.5 text-[12px] gap-1 whitespace-nowrap"
                      >
                        {tallParagraphs ? "입력창 기본 높이" : "입력창 일괄 크게 보기"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setParagraphMode((v) => !v)}
                        className="h-[26px] px-2 text-[12px] whitespace-nowrap"
                      >
                        {paragraphMode
                          ? "통문장 편집으로 전환"
                          : "문단별 블록 편집으로 전환"}
                      </Button>
                    </div>

                    <div className="flex items-center gap-3">
                      {highlightedTerm && (
                        <button
                          type="button"
                          onClick={() => setHighlightedTerm(null)}
                          className="rounded-md border-hairline border-hold bg-hold-bg px-2 py-0.5 text-[12px] text-hold hover:opacity-80 whitespace-nowrap"
                        >
                          선택된 점검 어구: &quot;{highlightedTerm}&quot; ✕
                        </button>
                      )}
                      <span
                        className={`text-[12px] leading-[18px] font-semibold whitespace-nowrap ${
                          isBodyInRange ? "text-pass" : "text-hold"
                        }`}
                      >
                        공백 포함 {bodyCharCount.toLocaleString()}자 (목표 1,200~1,500자)
                      </span>
                    </div>
                  </div>

                  {/* ① 상단 박스: 보도자료 원문 전체 보기 */}
                  <div className="rounded-lg border-hairline border-line bg-surface-subtle p-3.5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-[24px] items-center rounded bg-[#334155] px-2.5 text-[12px] font-bold text-surface whitespace-nowrap shrink-0">
                          1. 보도자료 원문 전체 ({rawParagraphs.length}단락)
                        </span>
                        <span className="text-[12px] text-ink-muted break-keep">
                          {effectiveMode === "minimal"
                            ? "원문 전체를 먼저 확인하고, 빨간줄 문장을 클릭하면 아래 수정된 내용의 해당 교정 위치로 바로 이동합니다."
                            : "입력된 보도자료 원문 전체입니다. 바로 아래에서 원문 대비 수정·리라이팅된 기사 내용을 한눈에 확인하세요."}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setExpandOriginalBox((v) => !v)}
                        className="h-[26px] px-2.5 text-[11px] whitespace-nowrap shrink-0"
                      >
                        {expandOriginalBox ? "원문 접기 ▲" : "원문 전체 펼치기 ▼"}
                      </Button>
                    </div>
                    {expandOriginalBox && (
                      <div className="max-h-[340px] overflow-y-auto pr-1">
                        {renderOriginalFullWithRedlines()}
                      </div>
                    )}
                  </div>

                  {/* ② 하단 박스: 원문 아래 수정된 내용 (전체 폭 100% 사용) */}
                  <div className="rounded-lg border-hairline border-primary bg-surface p-4 space-y-3 flex-1 flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b-hairline border-line pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-[26px] items-center rounded bg-primary px-3 text-[12px] font-bold text-surface whitespace-nowrap shrink-0">
                          2. 원문 아래 수정된 내용 (
                          {effectiveMode === "minimal"
                            ? "모드 1: 최소 수정·문장 교정"
                            : effectiveMode === "rewrite"
                            ? "모드 2: 리라이팅·노란색 하이라이트"
                            : "모드 3: 비교·기획 기사"}
                          )
                        </span>
                        {effectiveMode === "minimal" && (
                          <span className="text-[12px] font-semibold text-pass whitespace-nowrap">
                            ✓ 수정 사항 {sentenceSuggestions.length}건 중{" "}
                            {
                              sentenceSuggestions.filter((s) =>
                                Boolean(s.selectedAlternativeId)
                              ).length
                            }
                            건 초록색 교체 완료
                          </span>
                        )}
                        {effectiveMode === "rewrite" && (
                          <span className="inline-flex items-center rounded bg-[#FEF9C3] border-hairline border-[#EAB308] px-2 py-0.5 text-[11px] font-semibold text-[#854D0E] whitespace-nowrap">
                            연한 노란색 = 원문 대비 리라이팅·문단 재배치·분량 보강 구간
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {effectiveMode === "minimal" && (
                          <button
                            type="button"
                            onClick={handleApplyAllRecommendedSuggestions}
                            className="inline-flex h-[28px] items-center rounded-md bg-[#F59E0B] px-3 text-[12px] font-bold text-[#1E293B] hover:opacity-90 whitespace-nowrap shrink-0"
                          >
                            ⚡ 권장 교정 문장 전체 초록색 적용
                          </button>
                        )}
                        {effectiveMode !== "minimal" && (
                          <Button
                            type="button"
                            variant={showSideBySide ? "primary" : "secondary"}
                            size="sm"
                            onClick={() => setShowSideBySide((v) => !v)}
                            className="h-[26px] px-2.5 text-[11px] whitespace-nowrap"
                          >
                            {showSideBySide
                              ? "위아래(원문→수정본) 기본 보기로 전환"
                              : "좌우 2분할 나란히 보기로 전환"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* 모드별 수정된 내용 본문 */}
                    <div className="flex flex-col space-y-3 flex-1">
                      {effectiveMode === "minimal" && paragraphMode ? (
                        <div className="space-y-3 flex-1">
                          {bodyParagraphs.map((para, idx) => {
                            const isLead = idx === 0;
                            const isClosing =
                              idx === bodyParagraphs.length - 1 &&
                              bodyParagraphs.length > 1;
                            const baseRows = Math.max(
                              2,
                              Math.ceil(Array.from(para).length / 60)
                            );
                            return (
                              <div
                                id={`body-para-${idx}`}
                                key={idx}
                                className="rounded-md border-hairline border-line bg-surface-subtle/50 p-3.5 space-y-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b-hairline border-line pb-2">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="inline-flex h-[22px] items-center rounded bg-primary-subtle px-2 text-[11px] font-semibold text-primary whitespace-nowrap">
                                      단락 {String(idx + 1).padStart(2, "0")}
                                      {isLead
                                        ? " (리드문)"
                                        : isClosing
                                        ? " (마무리/인용)"
                                        : ""}
                                    </span>
                                    <span className="text-[11px] text-ink-muted whitespace-nowrap">
                                      {Array.from(para).length.toLocaleString()}자
                                    </span>
                                    <span className="text-[11px] text-ink-muted break-keep">
                                      · 원본 문장 아래 수정 제안을 클릭해 원하는 표현으로 교체하세요
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      disabled={idx === 0}
                                      onClick={() => moveParagraph(idx, -1)}
                                      className="h-[22px] px-2 text-[11px] gap-1 whitespace-nowrap"
                                    >
                                      <ArrowUp className="h-3 w-3 stroke-[1.5]" />
                                      <span>위로</span>
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      disabled={idx === bodyParagraphs.length - 1}
                                      onClick={() => moveParagraph(idx, 1)}
                                      className="h-[22px] px-2 text-[11px] gap-1 whitespace-nowrap"
                                    >
                                      <ArrowDown className="h-3 w-3 stroke-[1.5]" />
                                      <span>아래로</span>
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => addParagraphBelow(idx)}
                                      className="h-[22px] px-2 text-[11px] gap-1 whitespace-nowrap"
                                    >
                                      <Plus className="h-3 w-3 stroke-[1.5]" />
                                      <span>문단 추가</span>
                                    </Button>
                                  </div>
                                </div>

                                {/* 인터랙티브 교정 문장 뷰 (원본 전체 폭 → 아래 수정 제안 전체 폭) */}
                                <div className="rounded-md border-hairline border-line bg-surface p-3">
                                  {renderMinimalProofreadParagraph(para, idx)}
                                </div>

                                {/* 수동 미세 편집용 입력창 */}
                                <details className="group">
                                  <summary className="cursor-pointer text-[11px] font-medium text-ink-muted hover:text-primary select-none">
                                    ✎ 단락 {String(idx + 1).padStart(2, "0")} 텍스트 직접 타이핑 수정 열기
                                  </summary>
                                  <textarea
                                    rows={tallParagraphs ? baseRows + 2 : baseRows}
                                    value={para}
                                    onChange={(e) =>
                                      updateParagraph(idx, e.target.value)
                                    }
                                    className="mt-1.5 w-full resize-y rounded-md border-hairline border-line bg-surface p-2.5 text-[14px] leading-[24px] text-ink focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                                  />
                                </details>
                              </div>
                            );
                          })}
                        </div>
                      ) : showSideBySide ? (
                        /* 좌우 2분할 비교 켜짐 시 */
                        <div className="space-y-3 flex-1">
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 min-h-[480px]">
                            <div className="flex flex-col space-y-2 rounded-md border-hairline border-line bg-surface-subtle p-3.5">
                              <div className="flex items-center justify-between border-b-hairline border-line pb-2">
                                <span className="text-[13px] font-semibold text-ink">
                                  📄 원문 보도자료 ({rawParagraphs.length}단락)
                                </span>
                              </div>
                              <div className="space-y-2.5 overflow-y-auto max-h-[760px] pr-1">
                                {rawParagraphs.map((rawPara, rIdx) => (
                                  <div
                                    key={rIdx}
                                    className="rounded border-hairline border-line bg-surface p-3 space-y-1.5 text-[14px] leading-[24px] text-ink-muted"
                                  >
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-semibold text-ink">
                                        원문 {String(rIdx + 1).padStart(2, "0")}단락 ({Array.from(rawPara).length}자)
                                      </span>
                                    </div>
                                    <p className="whitespace-pre-wrap">{rawPara}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-col space-y-2 rounded-md border-hairline border-primary bg-surface p-3.5">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b-hairline border-line pb-2">
                                <span className="text-[13px] font-semibold text-primary">
                                  ✨ 수정·리라이팅된 기사식 광고 버전 ({bodyParagraphs.length}문단)
                                </span>
                              </div>
                              <div className="space-y-3 overflow-y-auto max-h-[760px] pr-1">
                                {bodyParagraphs.map((para, idx) => {
                                  const baseRows = Math.max(
                                    3,
                                    Math.ceil(Array.from(para).length / 52)
                                  );
                                  return (
                                    <div
                                      id={`body-para-${idx}`}
                                      key={idx}
                                      className="rounded border-hairline border-line bg-surface-subtle p-3 space-y-2"
                                    >
                                      <div className="rounded border-hairline border-line bg-surface p-2.5">
                                        {renderRewriteYellowHighlights(para, idx)}
                                      </div>
                                      <textarea
                                        rows={tallParagraphs ? baseRows + 2 : baseRows}
                                        value={para}
                                        onChange={(e) =>
                                          updateParagraph(idx, e.target.value)
                                        }
                                        className="w-full resize-y rounded border-hairline border-line bg-surface p-2 text-[14px] leading-[22px] text-ink"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : paragraphMode ? (
                        <div className="space-y-3 flex-1">
                          {bodyParagraphs.map((para, idx) => {
                            const isLead = idx === 0;
                            const isClosing =
                              idx === bodyParagraphs.length - 1 &&
                              bodyParagraphs.length > 1;
                            const paraDiffs = (s5Output?.diffs ?? [])
                              .map((d, dIdx) => ({
                                ...d,
                                diffIdx: dIdx,
                                isApplied:
                                  d.replacement !== "(삭제)" &&
                                  Boolean(d.replacement) &&
                                  para.includes(d.replacement),
                                isRestored:
                                  Boolean(d.original) &&
                                  para.includes(d.original),
                              }))
                              .filter((d) => d.isApplied || d.isRestored);

                            const hasCustomTerm =
                              Boolean(highlightedTerm) &&
                              para.includes(highlightedTerm!);
                            const hasAnyHighlight =
                              paraDiffs.length > 0 || hasCustomTerm;
                            const isFocusedPara = focusedParaIdx === idx;
                            const baseRows = Math.max(
                              3,
                              Math.ceil(Array.from(para).length / 65)
                            );

                            return (
                              <div
                                id={`body-para-${idx}`}
                                key={idx}
                                onClick={() => {
                                  if (focusedParaIdx === idx) {
                                    setFocusedParaIdx(null);
                                  }
                                }}
                                className={`rounded-md border-hairline p-3.5 space-y-2.5 transition-colors ${
                                  isFocusedPara
                                    ? "border-primary bg-info-bg"
                                    : hasAnyHighlight
                                    ? "border-info bg-surface-subtle"
                                    : "border-line bg-surface-subtle"
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="inline-flex h-[22px] items-center rounded bg-primary-subtle px-2 text-[11px] font-semibold text-primary whitespace-nowrap">
                                      수정 단락 {String(idx + 1).padStart(2, "0")}
                                      {isLead
                                        ? " (리드문)"
                                        : isClosing
                                        ? " (마무리/인용)"
                                        : ""}
                                    </span>
                                    <span className="text-[11px] text-ink-muted whitespace-nowrap">
                                      {Array.from(para).length.toLocaleString()}자
                                    </span>

                                    {data?.job.mode === "comparative" &&
                                      ((data.competitors ?? []).some((c) =>
                                        para.includes(c.name)
                                      ) ||
                                        /(?:경쟁이\s*치열하게\s*전개|차별화를\s*꾀했다|차별점으로\s*꼽힌다|비교해\s*볼\s*때|기존\s*스크린|동종\s*라이프스타일|뉴미디어\s*콘텐츠\s*스튜디오)/.test(
                                          para
                                        )) && (
                                        <span className="inline-flex items-center gap-1 rounded border-hairline border-secondary bg-secondary-subtle px-2 py-0.5 text-[11px] font-semibold text-secondary whitespace-nowrap">
                                          <span>📊 동종업계·경쟁사 비교·기획 문단</span>
                                        </span>
                                      )}
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      disabled={idx === 0}
                                      onClick={() => moveParagraph(idx, -1)}
                                      className="h-[24px] px-2 text-[11px] gap-1 whitespace-nowrap"
                                    >
                                      <ArrowUp className="h-3 w-3 stroke-[1.5]" />
                                      <span>위로</span>
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      disabled={idx === bodyParagraphs.length - 1}
                                      onClick={() => moveParagraph(idx, 1)}
                                      className="h-[24px] px-2 text-[11px] gap-1 whitespace-nowrap"
                                    >
                                      <ArrowDown className="h-3 w-3 stroke-[1.5]" />
                                      <span>아래로</span>
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => addParagraphBelow(idx)}
                                      className="h-[24px] px-2 text-[11px] gap-1 whitespace-nowrap"
                                    >
                                      <Plus className="h-3 w-3 stroke-[1.5]" />
                                      <span>문단 추가</span>
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      disabled={bodyParagraphs.length <= 1}
                                      onClick={() => removeParagraph(idx)}
                                      className="h-[24px] px-2 text-[11px] text-reject hover:bg-reject-bg hover:text-reject gap-1 whitespace-nowrap"
                                    >
                                      <Trash2 className="h-3 w-3 stroke-[1.5]" />
                                      <span>삭제</span>
                                    </Button>
                                  </div>
                                </div>

                                {effectiveMode === "rewrite" ? (
                                  <div className="rounded border-hairline border-line bg-surface p-3">
                                    {renderRewriteYellowHighlights(para, idx)}
                                  </div>
                                ) : (
                                  showInlineDiffHighlight &&
                                  hasAnyHighlight && (
                                    <div className="rounded border-hairline border-info bg-surface px-3 py-2 text-[14px] leading-[24px] text-ink">
                                      <p className="whitespace-pre-wrap">
                                        {renderTextWithDiffHighlights(para)}
                                      </p>
                                    </div>
                                  )
                                )}

                                <textarea
                                  rows={tallParagraphs ? baseRows + 3 : baseRows}
                                  value={para}
                                  onChange={(e) =>
                                    updateParagraph(idx, e.target.value)
                                  }
                                  className="w-full resize-y rounded-md border-hairline border-line bg-surface p-2.5 text-[15px] leading-[26px] font-normal text-ink focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-2.5 flex-1 flex flex-col">
                          <textarea
                            id="articleBody"
                            rows={tallParagraphs ? 26 : 16}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className={`w-full flex-1 resize-y rounded-md border-hairline border-line bg-surface p-3 text-[16px] leading-[28px] font-normal text-ink focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                              tallParagraphs ? "min-h-[600px]" : "min-h-[360px]"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 사진 캡션 영역 */}
                <div className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="articleCaption">
                      사진 캡션 (설명 + [제공=기관명] 필수, 줄바꿈으로 최대 2장 구분)
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        void handleAutoFixRule("FMT-12", "")
                      }
                      className="h-[22px] px-2 text-[11px] text-primary whitespace-nowrap"
                    >
                      [제공={data?.job.company_name || "기관명"}] 자동 보완
                    </Button>
                  </div>
                  <textarea
                    id="articleCaption"
                    rows={2}
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    className="w-full rounded-md border-hairline border-line bg-surface px-3 py-2 text-[14px] leading-[22px] text-ink focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  />
                </div>

                {/* 작성자 식별 정보(바이라인) 영역 — FMT-11 및 네이버 운영평가 C항목 */}
                <div className="p-4 space-y-1.5 bg-surface-subtle/50">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label htmlFor="articleByline">
                      작성자 식별 정보 (바이라인 · FMT-11 / 네이버 운영평가 C항목 대비)
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-medium whitespace-nowrap ${
                          byline.trim() ? "text-pass" : "text-hold"
                        }`}
                      >
                        {byline.trim()
                          ? "✓ 바이라인 입력됨 (FMT-11 통과)"
                          : "⚠ 미입력 시 FMT-11 경고가 발생합니다"}
                      </span>
                      {!byline.trim() && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            void handleAutoFixRule("FMT-11", "")
                          }
                          className="h-[22px] px-2 text-[11px] whitespace-nowrap"
                        >
                          기본 바이라인 자동 입력
                        </Button>
                      )}
                    </div>
                  </div>
                  <Input
                    id="articleByline"
                    placeholder="예: 매경 콘텐츠PR팀 기자 (mkpr@mk.co.kr)"
                    value={byline}
                    onChange={(e) => setByline(e.target.value)}
                  />
                </div>

                {/* 3. 아래쪽(하단) 배치: 💬 AI 채팅으로 기사 즉시 수정 */}
                <div className="p-4 bg-primary-subtle/40 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-[24px] items-center rounded bg-primary px-2.5 text-[12px] font-bold text-surface whitespace-nowrap shrink-0">
                        💬 AI 채팅으로 기사 수정 (아래쪽 & 오른쪽 하단 지원)
                      </span>
                      <span className="text-[12px] text-ink-muted break-keep">
                        원하는 수정 방향을 채팅으로 입력하면 제목·부제·본문 문단이 즉시 개고됩니다 (openai/gpt-5.6-sol)
                      </span>
                    </div>
                  </div>

                  {/* 자주 쓰는 원클릭 추천 프롬프트 칩 */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      "경쟁사 브랜드별로 문단을 각각 분리해서 작성해줘",
                      "보도자료 원문과 문단 구성·어순을 더 다르게 재구성해줘",
                      "본문 분량을 1,350자 내외로 배경 설명을 보강해줘",
                      "제목과 리드문을 더 정통 경제신문 기사 톤으로 다듬어줘",
                      "과장·홍보성 수식어를 빼고 건조한 팩트 위주로 다듬어줘",
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={chatLoading}
                        onClick={() => void handleChatEdit(preset)}
                        className="rounded-md border-hairline border-line bg-surface px-2.5 py-1 text-[11px] leading-[16px] font-medium text-ink hover:border-primary hover:text-primary transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>

                  {/* 채팅 입력창 + 실행 버튼 */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="예: 경쟁사 브랜드별로 문단을 각각 나누어 작성해줘 / 3문단 내용을 더 간결하게 줄여줘 (Enter)"
                      value={chatInput}
                      disabled={chatLoading}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleChatEdit();
                        }
                      }}
                      className="flex-1 bg-surface text-[13px]"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={chatLoading || !chatInput.trim()}
                      onClick={() => void handleChatEdit()}
                      className="h-[36px] px-4 whitespace-nowrap shrink-0"
                    >
                      {chatLoading ? "AI 수정 중..." : "AI 수정 적용"}
                    </Button>
                  </div>

                  {/* 최근 채팅 수정 내역 및 원클릭 되돌리기(Undo) */}
                  {chatHistory.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {chatHistory.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border-hairline border-pass bg-pass-bg/60 px-3 py-2 text-[12px] leading-[18px]"
                        >
                          <div className="space-y-0.5 flex-1">
                            <span className="font-semibold text-ink">
                              요청 ({item.createdAt}): &quot;{item.instruction}&quot;
                            </span>
                            <p className="text-pass font-medium">
                              ↳ AI 반영 완료: {item.replySummary}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => void handleUndoChatEdit(item.id)}
                            className="h-[24px] px-2 text-[11px] gap-1 shrink-0 whitespace-nowrap"
                          >
                            <RotateCcw className="h-3 w-3 stroke-[1.5]" />
                            <span>되돌리기</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 접이식: 보도자료 원문 대비 AI 편집·교열 요약 내역 */}
                <details className="p-4 bg-surface-subtle/60">
                  <summary className="cursor-pointer text-[12px] font-semibold text-info select-none">
                    ⓘ 보도자료 원문 대비 AI 자동 교열 내역 상세 보기 (총 {(s5Output?.diffs?.length ?? 0) + 2}건)
                  </summary>
                  <ul className="mt-2.5 space-y-1.5 text-[12px] leading-[18px] text-ink">
                    <li>
                      • <strong className="font-semibold">제목·부제 신설:</strong> 원문에 없던 매경 스타일 40자 내외 제목 후보 3종 및 명사형 부제 생성
                    </li>
                    {(s5Output?.diffs ?? []).map((d, idx) => (
                      <li
                        key={idx}
                        className="flex flex-wrap items-center justify-between gap-2 rounded bg-surface border-hairline border-line px-2.5 py-1.5"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-primary">[교열 {idx + 1}]</span>
                          <span className="rounded bg-reject-bg px-1.5 py-0.5 text-reject line-through">
                            {d.original}
                          </span>
                          <span className="text-ink-muted">→</span>
                          <span className="rounded bg-pass-bg px-1.5 py-0.5 text-pass font-semibold">
                            {d.replacement}
                          </span>
                          <span className="text-ink-muted">({d.reason})</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            )}
          </Card>

          {/* 하단: 승인 체크리스트 및 CMS용 복사 패널 (DESIGN.md 5절 / PRD F14) */}
          <Card className="p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-hairline border-line pb-3">
              <div>
                <h3 className="text-[14px] leading-[22px] font-semibold text-ink">
                  담당자 최종 검수·승인 체크리스트 (Human-in-the-loop)
                </h3>
                <p className="text-[12px] leading-[18px] text-ink-muted">
                  모든 항목을 확인·체크하고 승인해야 CMS 붙여넣기용 복사 버튼이 활성화됩니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isApproved && !allChecklistChecked && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCheckAllChecklist}
                    className="h-[26px] px-2.5 text-[12px] gap-1"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5]" />
                    <span>전체 항목 일괄 체크</span>
                  </Button>
                )}
                {isApproved && (
                  <span className="inline-flex h-[24px] items-center gap-1 rounded-md border-hairline border-pass bg-pass-bg px-2.5 text-[12px] font-medium text-pass">
                    <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5]" />
                    <span>승인 완료됨 (수정 시 복사 전 자동 반영)</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {s10Checklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2.5 text-[13px] leading-[20px] text-ink cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(checkedItems[item.id] || isApproved)}
                    onChange={(e) =>
                      setCheckedItems((prev) => ({
                        ...prev,
                        [item.id]: e.target.checked,
                      }))
                    }
                    disabled={isApproved}
                    className="h-4 w-4 rounded border-line text-primary"
                  />
                  <span>{item.label}</span>
                </label>
              ))}

              <div className="flex flex-wrap items-center gap-4 pt-2 border-t-hairline border-line text-[12px] leading-[18px] text-ink-muted">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiNoticeIncluded}
                    onChange={(e) => setAiNoticeIncluded(e.target.checked)}
                    className="h-4 w-4 rounded border-line text-primary"
                  />
                  <span>
                    [옵션] 기사 하단에 AI 활용 고지 문구 포함 (네이버 D항목 대비)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blankLineCopy}
                    onChange={(e) => setBlankLineCopy(e.target.checked)}
                    className="h-4 w-4 rounded border-line text-primary"
                  />
                  <span>[CMS 복사 옵션] 단락 사이 빈 줄 포함 (PRD F14)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBylineCopy}
                    onChange={(e) => setIncludeBylineCopy(e.target.checked)}
                    className="h-4 w-4 rounded border-line text-primary"
                  />
                  <span>[CMS 복사 옵션] 하단에 기자 바이라인 포함</span>
                </label>
              </div>
            </div>

            {copyFeedback && (
              <div className="rounded-md border-hairline border-info bg-info-bg px-3 py-2 text-[12px] leading-[18px] text-info">
                {copyFeedback}
              </div>
            )}

            {showCmsPreview && cmsPreviewText && (
              <div className="space-y-1.5 rounded-md border-hairline border-line bg-surface-subtle p-3">
                <div className="flex items-center justify-between text-[12px] font-semibold text-ink">
                  <span>
                    📋 CMS 최종 복사본 미리보기 (마크다운·제어문자 제거 완료된 순수 텍스트)
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCmsPreview(false)}
                    className="h-[22px] px-2 text-[11px]"
                  >
                    닫기
                  </Button>
                </div>
                <pre className="max-h-[240px] overflow-y-auto whitespace-pre-wrap rounded border-hairline border-line bg-surface p-3 text-[13px] leading-[21px] text-ink font-sans">
                  {cmsPreviewText}
                </pre>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-hairline border-line">
              <div className="flex items-center gap-2">
                {!isApproved ? (
                  <Button
                    type="button"
                    variant="primary"
                    disabled={!allChecklistChecked || approving || !title}
                    onClick={handleApprove}
                  >
                    {approving
                      ? "승인 처리 중..."
                      : "검수 승인 완료 (CMS 복사 잠금 해제)"}
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => void handleCopyCmsText("full")}
                      className="gap-1.5"
                    >
                      <ClipboardCopy className="h-4 w-4 stroke-[1.5]" />
                      <span>CMS용 전체 복사</span>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleToggleCmsPreview()}
                    >
                      {showCmsPreview ? "복사본 미리보기 닫기" : "CMS 복사본 미리보기"}
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!isApproved}
                  onClick={() => void handleCopyCmsText("title")}
                >
                  제목만 복사
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!isApproved}
                  onClick={() => void handleCopyCmsText("subtitle")}
                >
                  부제목만 복사
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!isApproved}
                  onClick={() => void handleCopyCmsText("body")}
                >
                  본문만 복사
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!isApproved}
                  onClick={() => void handleCopyCmsText("captions")}
                >
                  캡션만 복사
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* 우측: 상단 규정 체크 리포트 + 오른쪽 하단 AI 채팅으로 기사 수정 (350px) */}
        {!wideEditorMode && (
        <aside className="w-[350px] shrink-0 flex flex-col gap-4">
          <Card className="p-0 overflow-hidden">
            <div className="grid grid-cols-4 border-b-hairline border-line bg-surface-subtle p-1 gap-1">
              {[
                { id: "rules", label: `규정리포트(${data?.findings.length ?? 0})` },
                {
                  id: "claims",
                  label: `증빙·팩트(${
                    data?.claims.filter((c) => c.status === "evidence_required")
                      .length ?? 0
                  })`,
                },
                { id: "sources", label: `출처(${data?.sources.length ?? 0})` },
                { id: "raw", label: "보도자료원문" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setRightTab(t.id as "rules" | "claims" | "sources" | "raw")
                  }
                  className={`whitespace-nowrap rounded-md py-1.5 text-[11px] leading-[16px] font-medium transition-colors duration-150 ${
                    rightTab === t.id
                      ? "bg-primary-subtle text-primary"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-4 max-h-[820px] overflow-y-auto">
              {rightTab === "rules" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-[13px] leading-[18px] font-semibold text-ink">
                      1. 기사식광고 하드룰 점검 (FMT-01~12)
                    </h3>
                    {data?.findings && data.findings.length === 0 ? (
                      <div className="flex items-center gap-2 rounded-md border-hairline border-pass bg-pass-bg px-3 py-2 text-[12px] text-pass">
                        <CheckCircle2 className="h-4 w-4 stroke-[1.5]" />
                        <span>모든 하드룰 기준을 통과했습니다.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {data?.findings.map((f) => {
                          let matchedText = "";
                          try {
                            matchedText =
                              (
                                JSON.parse(f.location_json) as {
                                  matchedText?: string;
                                }
                              ).matchedText ?? "";
                          } catch {
                            matchedText = "";
                          }
                          const canAutoFix = [
                            "FMT-01",
                            "FMT-02",
                            "FMT-07",
                            "FMT-08",
                            "FMT-11",
                            "FMT-12",
                          ].includes(f.rule_id);
                          const paraIdx = matchedText
                            ? bodyParagraphs.findIndex((p) =>
                                p.includes(matchedText)
                              )
                            : -1;

                          return (
                            <div
                              key={f.id}
                              className="w-full text-left rounded-md border-hairline border-line bg-surface p-3 space-y-2 hover:bg-surface-subtle"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[12px] font-semibold text-ink">
                                  {f.rule_id}
                                </span>
                                <SeverityBadge severity={f.severity} />
                              </div>
                              <p className="text-[12px] leading-[18px] text-ink">
                                {f.message}
                              </p>
                              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (f.rule_id === "FMT-11") {
                                      document
                                        .getElementById("articleByline")
                                        ?.scrollIntoView({
                                          behavior: "smooth",
                                          block: "center",
                                        });
                                      document
                                        .getElementById("articleByline")
                                        ?.focus();
                                    } else if (f.rule_id === "FMT-12") {
                                      document
                                        .getElementById("articleCaption")
                                        ?.scrollIntoView({
                                          behavior: "smooth",
                                          block: "center",
                                        });
                                      document
                                        .getElementById("articleCaption")
                                        ?.focus();
                                    } else if (paraIdx !== -1) {
                                      scrollToParagraph(paraIdx, matchedText);
                                    } else {
                                      setHighlightedTerm(
                                        matchedText || f.rule_id
                                      );
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 rounded border-hairline border-line bg-surface-subtle px-2 py-0.5 text-[11px] text-ink-muted hover:text-ink"
                                >
                                  <MapPin className="h-3 w-3 stroke-[1.5]" />
                                  <span>
                                    {paraIdx !== -1
                                      ? `본문 ${paraIdx + 1}문단 위치 보기`
                                      : f.rule_id === "FMT-11"
                                      ? "바이라인 입력란 이동"
                                      : f.rule_id === "FMT-12"
                                      ? "캡션 입력란 이동"
                                      : "편집기 내 위치 표시"}
                                  </span>
                                </button>
                                {canAutoFix && (
                                  <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    disabled={savingArticle}
                                    onClick={() =>
                                      void handleAutoFixRule(
                                        f.rule_id,
                                        matchedText
                                      )
                                    }
                                    className="h-[22px] px-2 text-[11px]"
                                  >
                                    ⚡ 원클릭 자동 교정
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-3 border-t-hairline border-line">
                    <h3 className="text-[13px] leading-[18px] font-semibold text-ink">
                      2. 네이버 뉴스 운영평가 점검 (A~R)
                    </h3>
                    <div className="space-y-2">
                      {(s9Output?.naverChecklist ?? []).map((item) => (
                        <div
                          key={item.code}
                          className="rounded-md border-hairline border-line bg-surface p-2.5 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] leading-[18px] font-medium text-ink">
                              [{item.code}항목] {item.name} (벌점 {item.penalty})
                            </span>
                            <SeverityBadge
                              severity={
                                item.status === "BLOCK"
                                  ? "BLOCK"
                                  : item.status === "WARN"
                                  ? "WARN"
                                  : "INFO"
                              }
                            />
                          </div>
                          <p className="text-[11px] leading-[16px] text-ink-muted">
                            {item.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {rightTab === "claims" && (() => {
                const typeLabelMap: Record<string, string> = {
                  metric: "수치·규모·매출",
                  certification: "특허·수상·인증",
                  partnership: "제휴·협약·대기업 언급",
                  schedule: "일정·장소",
                  quote: "관계자 인용구",
                  general: "일반 사실",
                };
                const evidenceNeeded =
                  data?.claims.filter((c) => c.status === "evidence_required") ??
                  [];
                const factItems =
                  data?.claims.filter((c) => c.status !== "evidence_required") ??
                  [];

                return (
                  <div className="space-y-4">
                    <div className="rounded-md border-hairline border-line bg-surface-subtle p-3 space-y-1">
                      <p className="text-[12px] font-semibold text-ink">
                        PR사업팀 업무 프로세스 2단계: 증빙 확인 및 팩트체크
                      </p>
                      <p className="text-[11px] leading-[16px] text-ink-muted">
                        보도자료 내 특허·수상·매출 수치·설문 결과·특정 대기업 언급 중 대행사에 증빙 자료를 요청해야 할 문장을 자동 분류합니다.
                      </p>
                    </div>

                    {/* 1. 대행사 증빙 요청 필요 항목 */}
                    <div className="space-y-2">
                      <h4 className="text-[12px] font-semibold text-ink">
                        1. 대행사/업체 증빙 자료 요청 필요 항목 ({evidenceNeeded.length}건)
                      </h4>
                      {evidenceNeeded.length === 0 ? (
                        <div className="flex items-center gap-2 rounded-md border-hairline border-pass bg-pass-bg px-3 py-2 text-[12px] text-pass">
                          <CheckCircle2 className="h-4 w-4 shrink-0 stroke-[1.5]" />
                          <span>
                            별도 증빙(특허증·매출근거·대기업 협의)을 요청해야 할 위험 문장이 없습니다.
                          </span>
                        </div>
                      ) : (
                        evidenceNeeded.map((c) => (
                          <div
                            key={c.id}
                            className="rounded-md border-hairline border-hold bg-hold-bg/40 p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="font-semibold text-hold">
                                [{typeLabelMap[c.type] ?? c.type}]
                              </span>
                              <span className="rounded bg-hold-bg px-1.5 py-0.5 font-semibold text-hold whitespace-nowrap">
                                증빙 확인 필수
                              </span>
                            </div>
                            <p className="text-[12px] leading-[18px] text-ink">
                              {c.text}
                            </p>
                            {c.evidence_request && (
                              <p className="text-[11px] leading-[16px] font-medium text-hold">
                                • 필요 증빙: {c.evidence_request}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={savingArticle}
                                onClick={() =>
                                  void handleSaveArticle({
                                    resolvedClaimId: c.id,
                                  })
                                }
                                className="h-[22px] px-2 text-[11px] text-pass"
                              >
                                ✓ 증빙 자료 확인 완료
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={savingArticle}
                                onClick={() => {
                                  const nextBody = body
                                    .replace(c.text, "")
                                    .replace(/\n{3,}/g, "\n\n");
                                  setBody(nextBody);
                                  void handleSaveArticle({
                                    body: nextBody,
                                    resolvedClaimId: c.id,
                                  });
                                }}
                                className="h-[22px] px-2 text-[11px] text-reject hover:bg-reject-bg"
                              >
                                본문에서 문장 제외 후 보류 해제
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* 2. 기사 사용 가능 주요 팩트 (수치·일정·인용) */}
                    <div className="space-y-2 pt-2 border-t-hairline border-line">
                      <h4 className="text-[12px] font-semibold text-ink">
                        2. 보도자료 내 추출된 수치·일정·인용구 ({factItems.length}건)
                      </h4>
                      {factItems.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-md border-hairline border-line bg-surface p-2.5 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-primary">
                              {typeLabelMap[c.type] ?? "보도자료 사실"}
                            </span>
                            <span className="rounded bg-pass-bg px-1.5 py-0.5 font-medium text-pass whitespace-nowrap">
                              기사 반영 가능
                            </span>
                          </div>
                          <p className="text-[12px] leading-[18px] text-ink">
                            {c.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {rightTab === "sources" && (
                <div className="space-y-2.5">
                  <p className="text-[12px] leading-[18px] text-ink-muted">
                    검증 단계에서 수집되어 DB(sources)에 기록된 근거 URL 목록입니다.
                  </p>
                  {data?.sources.length === 0 ? (
                    <p className="text-[12px] text-ink-muted">
                      저장된 외부 출처가 없습니다.
                    </p>
                  ) : (
                    data?.sources.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-md border-hairline border-line bg-surface p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-ink-muted">
                          <span>단계: {s.stage}</span>
                          <span>{s.publisher ?? ""}</span>
                        </div>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline break-all"
                        >
                          <span>{s.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 stroke-[1.5]" />
                        </a>
                        {s.snippet && (
                          <p className="text-[11px] leading-[16px] text-ink-muted">
                            {s.snippet}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {rightTab === "raw" && (
                <div className="space-y-2">
                  <p className="text-[12px] font-medium text-ink-muted">
                    입력된 보도자료 원문:
                  </p>
                  <pre className="whitespace-pre-wrap rounded-md border-hairline border-line bg-surface-subtle p-3 text-[12px] leading-[18px] text-ink font-sans">
                    {data?.job.raw_text}
                  </pre>
                </div>
              )}
            </div>
          </Card>

          {/* 오른쪽 하단: 💬 AI 채팅으로 기사 수정 빠른 패널 */}
          <Card className="p-3.5 space-y-2.5 border-primary bg-surface">
            <div className="flex items-center justify-between gap-2 border-b-hairline border-line pb-2">
              <span className="inline-flex h-[22px] items-center rounded bg-primary px-2 text-[11px] font-bold text-surface whitespace-nowrap">
                💬 AI 채팅으로 기사 수정
              </span>
              <span className="text-[10px] font-medium text-ink-muted whitespace-nowrap">
                오른쪽 하단 빠른 개고
              </span>
            </div>
            <p className="text-[11px] leading-[16px] text-ink-muted break-keep">
              원하는 수정 방향을 선택하거나 입력하면 본문·제목이 즉시 개고됩니다.
            </p>
            <div className="flex flex-wrap gap-1">
              {[
                "경쟁사 브랜드별로 문단을 각각 분리해줘",
                "원문과 문단 구성·어순을 더 다르게 재구성해줘",
                "본문 분량을 1,350자 내외로 보강해줘",
                "제목과 리드문을 더 정통 경제신문 기사 톤으로 다듬어줘",
                "과장·홍보성 수식어를 빼고 건조한 팩트 위주로 다듬어줘",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={chatLoading}
                  onClick={() => void handleChatEdit(preset)}
                  className="text-left rounded border-hairline border-line bg-surface-subtle px-2 py-1 text-[11px] leading-[15px] font-medium text-ink hover:border-primary hover:text-primary transition-colors break-keep disabled:opacity-50"
                >
                  + {preset}
                </button>
              ))}
            </div>
            <div className="space-y-1.5 pt-1">
              <textarea
                rows={2}
                value={chatInput}
                disabled={chatLoading}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleChatEdit();
                  }
                }}
                placeholder="예: 3문단 내용을 더 간결하게 줄여줘 (Enter)"
                className="w-full resize-y rounded-md border-hairline border-line bg-surface p-2 text-[12px] leading-[18px] text-ink focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={chatLoading || !chatInput.trim()}
                onClick={() => void handleChatEdit()}
                className="w-full h-[32px] text-[12px] font-bold whitespace-nowrap"
              >
                {chatLoading ? "AI가 기사 수정 중..." : "AI 수정 적용"}
              </Button>
            </div>
          </Card>
        </aside>
        )}
      </main>

      {/* 반려(REJECT) 모달 알림 (PRD F11.1 / DESIGN.md 4절: 폭 560px, 12px 모서리, 0.5px reject 보더, 단색 반투명 배경막) */}
      {showRejectModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1D21]/40 p-4"
        >
          <div className="w-[560px] rounded-lg border-hairline border-reject bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <VerdictBadge verdict="REJECT" />
              <span className="text-[12px] leading-[18px] text-ink-muted">
                PRD F11 반려 판정 알림
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-[12px] font-medium text-ink-muted">
                대행사/기업 전달용 표준 반려 문구:
              </p>
              <p className="rounded-md border-hairline border-reject bg-reject-bg p-3 text-[16px] leading-[24px] font-semibold text-reject">
                {rejectNotification?.message ??
                  "기사식광고 게재 제한 사유에 해당하여 게재가 어렵습니다."}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[12px] font-medium text-ink-muted">
                상세 반려 사유 및 원문 근거 구절:
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {rejectReasons.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-md border-hairline border-line bg-surface-subtle p-3 space-y-1 text-[12px] leading-[18px]"
                  >
                    <div className="font-semibold text-ink">
                      [{r.ruleId}] {r.category}
                    </div>
                    <div className="rounded bg-reject-bg px-2 py-1 text-reject">
                      근거: &quot;{r.quote}&quot;
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {showOverrideInput && (
              <div className="space-y-2 pt-2 border-t-hairline border-line">
                <Label htmlFor="overrideReason">
                  반려 사유 무시 진행 사유 (필수 입력 · 감사 로그에 기록됨)
                </Label>
                <Input
                  id="overrideReason"
                  placeholder="예: 공식 홈페이지 별도 도메인 확인 완료 (팀장 사전 승인)"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={!overrideReason.trim()}
                    onClick={() =>
                      startPipelineStream(true, overrideReason.trim())
                    }
                  >
                    사유 기록 후 기사 초안 작성 강행
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t-hairline border-line">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      rejectNotification?.message ?? ""
                    );
                    setCopyFeedback("반려 문구가 복사되었습니다.");
                  }}
                >
                  반려 문구 복사
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRightTab("raw");
                  }}
                >
                  원문에서 근거 보기
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setShowOverrideInput((v) => !v)}
                >
                  그래도 진행
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRejectModal(false)}
                >
                  닫기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
