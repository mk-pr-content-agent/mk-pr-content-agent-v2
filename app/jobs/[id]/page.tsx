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
import type { VerdictType } from "@/lib/pipeline/types";
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
    mode: "ad_article" | "comparative";
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
      competitors?: Array<{ id: string; selected: boolean }>;
    }) => {
      setSavingArticle(true);
      try {
        const nextTitle = overridePatch?.title ?? title;
        const nextSubtitle = overridePatch?.subtitle ?? subtitle;
        const nextBody = overridePatch?.body ?? body;
        const nextCaptionText = overridePatch?.captionText ?? captionText;
        const nextByline = overridePatch?.byline ?? byline;
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

  // 모드 즉시 전환 후 파이프라인 재실행
  async function handleSwitchModeAndRerun() {
    if (!data || running) return;
    const nextMode =
      data.job.mode === "ad_article" ? "comparative" : "ad_article";
    await fetch(`/api/jobs/${jobId}/article`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: nextMode }),
    });
    startPipelineStream(false);
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

  return (
    <div className="min-h-screen bg-surface-subtle flex flex-col">
      {/* 상단 고정 헤더 */}
      <header className="bg-surface border-b-hairline border-line">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 text-[14px] leading-[22px] text-ink-muted hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4 stroke-[1.5]" />
              <span>작업 목록</span>
            </Link>
            <span className="text-line">|</span>
            <h1 className="text-[16px] leading-[24px] font-semibold text-ink">
              {data?.job.company_name || "보도자료 검토 작업"}
            </h1>
            <VerdictBadge verdict={data?.job.verdict} />
            {jobOptions.overrideRejectReason && (
              <span className="inline-flex h-[24px] items-center rounded-md border-hairline border-reject bg-reject-bg px-2 text-[12px] leading-[18px] font-medium text-reject">
                반려 사유 무시 진행 ({jobOptions.overrideRejectReason})
              </span>
            )}
            <span className="inline-flex h-[24px] items-center rounded-md border-hairline border-hold bg-hold-bg px-2 text-[12px] leading-[18px] font-medium text-hold">
              네이버 제외 송출 권장 (PRD Q항목)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/guide">
              <Button type="button" variant="secondary" size="sm" className="gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary stroke-[1.75]" />
                <span>사용 가이드</span>
              </Button>
            </Link>
            <ApiUsageBar jobId={jobId} refreshTrigger={data} />
            {data && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void handleSwitchModeAndRerun()}
                disabled={running}
                title="새 작업을 다시 만들지 않고 현재 보도자료로 작성 모드를 즉시 전환하여 재실행합니다"
                className="gap-1.5"
              >
                <Shuffle className="h-3.5 w-3.5 stroke-[1.5]" />
                <span>
                  {data.job.mode === "ad_article"
                    ? "비교·기획 모드로 전환"
                    : "기사식광고 기본으로 전환"}
                </span>
              </Button>
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

      {/* 3단 메인 워크스페이스 (DESIGN.md 5절 레이아웃: 240px / flex / 360px · 넓게 보기 시 전체 폭 확장) */}
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 gap-4 p-4">
        {/* 좌측: 진행 타임라인 (240px) */}
        {!wideEditorMode && (
          <aside className="w-[240px] shrink-0">
            <Card className="p-0 overflow-hidden">
              <div className="bg-surface-subtle px-4 py-3 border-b-hairline border-line space-y-0.5">
                <h2 className="text-[14px] leading-[22px] font-semibold text-ink">
                  단계 진행 타임라인
                </h2>
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
                                className="inline-flex items-center gap-0.5 rounded bg-hold-bg px-1.5 py-0.5 text-[10px] font-semibold text-hold"
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
                {/* 원문 대비 AI 편집·변경 요약 박스 (본문 위치 연결 및 사이즈 자유 조절 지원) */}
                <div
                  className={`px-4 py-3 bg-info-bg border-b-hairline border-info space-y-2.5 resize-y overflow-auto ${
                    expandDiffBox ? "min-h-[260px]" : "min-h-[135px]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[13px] leading-[20px] font-semibold text-info">
                      <Info className="h-4 w-4 shrink-0 stroke-[1.5]" />
                      <span>
                        보도자료 원문 대비 AI 편집·교열 내역 (총{" "}
                        {(s5Output?.diffs?.length ?? 0) + 2}건 반영 · 항목 클릭 시 본문 위치로 이동)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setExpandDiffBox((v) => !v)}
                        className="h-[26px] px-2.5 text-[12px] gap-1 whitespace-nowrap"
                      >
                        {expandDiffBox ? (
                          <>
                            <Minimize2 className="h-3 w-3 stroke-[1.5]" />
                            <span>교열 영역 기본 크기</span>
                          </>
                        ) : (
                          <>
                            <Maximize2 className="h-3 w-3 stroke-[1.5]" />
                            <span>교열 영역 크게 보기</span>
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowSideBySide((v) => !v)}
                        className="h-[26px] px-2.5 text-[12px] whitespace-nowrap"
                      >
                        {showSideBySide
                          ? "단일 편집기로 보기"
                          : "원문과 나란히 비교 보기"}
                      </Button>
                    </div>
                  </div>

                  <ul
                    className={`space-y-1.5 ${
                      expandDiffBox
                        ? "text-[13px] leading-[22px]"
                        : "text-[12px] leading-[18px]"
                    } text-ink`}
                  >
                    <li>
                      • <strong className="font-semibold">제목·부제 신설:</strong>{" "}
                      원문에 없던 매경 스타일 40자 내외 제목 후보 3종 및 명사형 부제 2줄 생성
                    </li>
                    <li>
                      • <strong className="font-semibold">리드문 기사체 정비 및 문단 순서 재배치:</strong>{" "}
                      첫 문단(리드)은 고정하되 포털 중복·유사 판정 회피를 위해 중간 문단(2문단 ↔ 3문단) 순서를 교차 배치했으며, 아래 문단별 블록에서 <strong className="font-semibold">[위로 / 아래로]</strong> 버튼으로 자유롭게 위치를 조정할 수 있습니다.
                    </li>
                    {s5Output?.diffs && s5Output.diffs.length > 0 ? (
                      s5Output.diffs.map((d, idx) => {
                        const matchedParaIndices: number[] = [];
                        let isRestoredInBody = false;
                        bodyParagraphs.forEach((p, pIdx) => {
                          if (
                            d.replacement !== "(삭제)" &&
                            d.replacement &&
                            p.includes(d.replacement)
                          ) {
                            matchedParaIndices.push(pIdx);
                          } else if (d.original && p.includes(d.original)) {
                            matchedParaIndices.push(pIdx);
                            isRestoredInBody = true;
                          }
                        });

                        return (
                          <li
                            key={idx}
                            className={`flex flex-wrap items-center justify-between gap-2 rounded bg-surface border-hairline border-line ${
                              expandDiffBox ? "px-3 py-2" : "px-2.5 py-1.5"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-primary">
                                [교열 {idx + 1}]
                              </span>
                              <span className="rounded bg-reject-bg px-1.5 py-0.5 text-reject line-through">
                                {d.original}
                              </span>
                              <span className="text-ink-muted">→</span>
                              <span className="rounded bg-pass-bg px-1.5 py-0.5 text-pass font-semibold">
                                {d.replacement}
                              </span>
                              <span className="text-ink-muted">({d.reason})</span>

                              {/* 본문 내 어느 문단에 위치해 있는지 표시 및 클릭 시 해당 문단으로 스크롤 */}
                              {matchedParaIndices.length > 0 ? (
                                matchedParaIndices.map((pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => scrollToParagraph(pIdx)}
                                    className="inline-flex items-center gap-1 rounded border-hairline border-primary bg-primary-subtle px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary hover:text-surface transition-colors"
                                  >
                                    <MapPin className="h-3 w-3 stroke-[1.75]" />
                                    <span>
                                      본문 {pIdx + 1}문단 위치 보기
                                      {isRestoredInBody ? " (원문 복원됨)" : ""}
                                    </span>
                                  </button>
                                ))
                              ) : (
                                <span className="inline-flex items-center rounded bg-surface-subtle px-1.5 py-0.5 text-[11px] text-ink-muted">
                                  본문 내 삭제·편집됨
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {matchedParaIndices.length > 0 && (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() =>
                                    scrollToParagraph(matchedParaIndices[0]!)
                                  }
                                  className="h-[22px] px-2 text-[11px] gap-1 whitespace-nowrap"
                                >
                                  <MapPin className="h-3 w-3 stroke-[1.5]" />
                                  <span>
                                    {matchedParaIndices[0]! + 1}문단 이동
                                  </span>
                                </Button>
                              )}
                              {d.replacement !== "(삭제)" && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setBody((prev) =>
                                      isRestoredInBody
                                        ? prev.replace(d.original, d.replacement)
                                        : prev.replace(d.replacement, d.original)
                                    )
                                  }
                                  className="h-[22px] px-2 text-[11px] gap-1 shrink-0 whitespace-nowrap"
                                >
                                  <RotateCcw className="h-3 w-3 stroke-[1.5]" />
                                  <span>
                                    {isRestoredInBody
                                      ? "교열어 재적용"
                                      : "원문 복원"}
                                  </span>
                                </Button>
                              )}
                            </div>
                          </li>
                        );
                      })
                    ) : (
                      <li>
                        • <strong className="font-semibold">과장·판촉 표현 점검:</strong>{" "}
                        원문 내 금지 최상급·URL이 없으며, 원문 팩트를 그대로 유지함
                      </li>
                    )}
                  </ul>

                  <div className="flex items-center justify-between pt-0.5 text-[11px] text-ink-muted">
                    <span>
                      💡 각 <strong className="font-semibold text-primary">[본문 N문단 위치 보기]</strong>를 누르면 해당 문단으로 이동하며, 문단 내부에 교열 전·후 위치가 초록색 배지로 표시됩니다.
                    </span>
                    <span className="shrink-0">
                      ↕ 우측 하단 모서리를 드래그해 영역 높이를 자유롭게 조절할 수 있습니다
                    </span>
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
                            className="h-[24px] px-2.5 text-[11px] font-semibold text-secondary border-secondary"
                          >
                            {chatLoading
                              ? "문단 분리 중..."
                              : "📊 경쟁사 브랜드별로 문단 각각 분리하기"}
                          </Button>
                          <span className="text-[11px] text-ink-muted">
                            타 매체 문장 복사 없이 자체 기사 문장으로 재서술됨 (PRD 10.2)
                          </span>
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
                                  <span className="rounded bg-secondary-subtle px-1.5 py-0.5 text-[11px] font-semibold text-secondary">
                                    비교 브랜드 {cIdx + 1}: {comp.name}
                                    {isSelected ? "" : " (제외됨)"}
                                  </span>
                                </label>
                                <span className="text-ink">{comp.summary}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {compParaIdx !== -1 && (
                                  <button
                                    type="button"
                                    onClick={() => scrollToParagraph(compParaIdx)}
                                    className="inline-flex items-center gap-1 rounded border-hairline border-secondary bg-secondary-subtle px-2 py-0.5 text-[11px] font-semibold text-secondary hover:opacity-80"
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
                                    className="inline-flex items-center gap-1 rounded border-hairline border-line bg-surface-subtle px-2 py-0.5 text-[11px] text-primary hover:underline"
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

                {/* 💬 AI 대화형 기사 수정 (채팅 입력으로 즉시 문단 분리·문체 교정·분량 조절) */}
                <div className="px-4 py-3.5 bg-primary-subtle/50 border-b-hairline border-line space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-[22px] items-center rounded bg-primary px-2 text-[11px] font-semibold text-surface">
                        💬 AI 채팅으로 기사 즉시 수정
                      </span>
                      <span className="text-[12px] text-ink-muted">
                        원하는 수정 방향을 채팅으로 입력하면 제목·부제·본문 문단이 페이지 내에서 즉시 개고됩니다 (openai/gpt-5.6-sol)
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
                        className="rounded-md border-hairline border-line bg-surface px-2.5 py-1 text-[11px] leading-[16px] font-medium text-ink hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>

                  {/* 채팅 입력창 + 실행 버튼 */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="예: 경쟁사 브랜드별로 문단을 각각 나누어 작성해줘 / 3문단 내용을 더 간결하게 줄여줘 (Enter 입력)"
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
                      className="h-[36px] px-4 whitespace-nowrap"
                    >
                      {chatLoading ? "AI가 기사 수정 중..." : "AI 수정 적용"}
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
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-ink">
                                요청 ({item.createdAt}): &quot;{item.instruction}&quot;
                              </span>
                            </div>
                            <p className="text-pass font-medium">
                              ↳ AI 반영 완료: {item.replySummary}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => void handleUndoChatEdit(item.id)}
                            className="h-[24px] px-2 text-[11px] gap-1 shrink-0"
                          >
                            <RotateCcw className="h-3 w-3 stroke-[1.5]" />
                            <span>이 수정 전으로 되돌리기</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 제목 후보 3개 선택 영역 (PRD F8) */}
                {s6Output?.titleCandidates &&
                  s6Output.titleCandidates.length > 0 && (
                    <div className="px-4 py-3 bg-surface-subtle space-y-1.5">
                      <span className="text-[12px] leading-[18px] font-medium text-ink-muted">
                        추천 제목 후보 (클릭 시 적용 · 40자 내외):
                      </span>
                      <div className="flex flex-col gap-1">
                        {s6Output.titleCandidates.map((cand, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setTitle(cand)}
                            className="text-left text-[12px] leading-[18px] text-primary hover:underline truncate"
                          >
                            후보 {idx + 1} ({Array.from(cand).length}자): {cand}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 제목 입력란 (DESIGN.md: 20px / 30px, 600) */}
                <div className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="articleTitle">
                      제목 (목표 40자 내외, 28~45자 통과)
                    </Label>
                    <span
                      className={`text-[12px] leading-[18px] font-medium ${
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
                    className="h-[42px] text-[20px] leading-[30px] font-semibold"
                  />
                </div>

                {/* 부제목 입력란 */}
                <div className="p-4 space-y-1.5">
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

                {/* 본문 편집란 (DESIGN.md: 16px / 28px 행간 1.75 · 문단별 블록 위치 이동 및 교열 위치 하이라이트 지원) */}
                <div className="p-4 space-y-2.5 flex-1 flex flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Label htmlFor="articleBody" className="mr-1">
                        본문 (총 {bodyParagraphs.length}문단 · 목표 공백 포함 1,200~1,500자)
                      </Label>
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
                        variant={showInlineDiffHighlight ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => setShowInlineDiffHighlight((v) => !v)}
                        className="h-[26px] px-2.5 text-[12px] gap-1 whitespace-nowrap"
                      >
                        <MapPin className="h-3 w-3 stroke-[1.5]" />
                        <span>
                          {showInlineDiffHighlight
                            ? "본문 내 교열 위치 표시 중"
                            : "본문 내 교열 위치 표시 켜기"}
                        </span>
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setTallParagraphs((v) => !v)}
                        className="h-[26px] px-2.5 text-[12px] gap-1 whitespace-nowrap"
                      >
                        {tallParagraphs ? (
                          <>
                            <Minimize2 className="h-3 w-3 stroke-[1.5]" />
                            <span>입력창 기본 높이</span>
                          </>
                        ) : (
                          <>
                            <Maximize2 className="h-3 w-3 stroke-[1.5]" />
                            <span>입력창 일괄 크게 보기</span>
                          </>
                        )}
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
                          className="rounded-md border-hairline border-hold bg-hold-bg px-2 py-0.5 text-[12px] text-hold hover:opacity-80"
                        >
                          선택된 점검 어구: &quot;{highlightedTerm}&quot; ✕
                        </button>
                      )}
                      <span
                        className={`text-[12px] leading-[18px] font-medium ${
                          isBodyInRange ? "text-ink-muted" : "text-hold"
                        }`}
                      >
                        공백 포함 {bodyCharCount.toLocaleString()}자 (원문{" "}
                        {Array.from(
                          (data?.job.raw_text ?? "")
                            .replace(/[\u200B-\u200D\uFEFF]/g, "")
                            .replace(/\r?\n/g, "")
                        ).length.toLocaleString()}
                        자 · 목표 1,200~1,500자)
                      </span>
                    </div>
                  </div>

                  {showSideBySide ? (
                    <div className="space-y-3 flex-1">
                      {showInlineDiffHighlight &&
                        s5Output?.diffs &&
                        s5Output.diffs.length > 0 && (
                          <div className="rounded-md border-hairline border-info bg-info-bg p-3 space-y-1.5 resize-y overflow-auto">
                            <div className="text-[12px] font-semibold text-info">
                              📍 본문 내 교열 위치 하이라이트 미리보기
                            </div>
                            <div className="whitespace-pre-wrap text-[14px] leading-[24px] text-ink bg-surface p-3 rounded border-hairline border-line">
                              {renderTextWithDiffHighlights(body)}
                            </div>
                          </div>
                        )}
                      <div className="grid grid-cols-2 gap-3 flex-1 min-h-[420px]">
                        <div className="flex flex-col space-y-1">
                          <span className="text-[12px] font-semibold text-ink-muted">
                            [붙여넣은 보도자료 원문 (우측 하단 드래그로 크기 조절 가능)]
                          </span>
                          <pre
                            className={`w-full flex-1 resize-y overflow-y-auto whitespace-pre-wrap rounded-md border-hairline border-line bg-surface-subtle p-3 text-[14px] leading-[24px] text-ink-muted font-sans ${
                              tallParagraphs ? "min-h-[640px]" : "min-h-[420px]"
                            }`}
                          >
                            {(data?.job.raw_text ?? "").replace(
                              /[\u200B-\u200D\uFEFF]/g,
                              ""
                            )}
                          </pre>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-[12px] font-semibold text-primary">
                            [AI 교열·작성 기사 초안 (편집 및 크기 조절 가능)]
                          </span>
                          <textarea
                            id="articleBody"
                            rows={tallParagraphs ? 26 : 18}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className={`w-full flex-1 resize-y rounded-md border-hairline border-line bg-surface p-3 text-[15px] leading-[26px] font-normal text-ink focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                              tallParagraphs ? "min-h-[640px]" : "min-h-[420px]"
                            }`}
                          />
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
                              Boolean(d.original) && para.includes(d.original),
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
                          Math.ceil(Array.from(para).length / 55)
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
                            className={`rounded-md border-hairline p-3 space-y-2 transition-colors ${
                              isFocusedPara
                                ? "border-primary bg-info-bg"
                                : hasAnyHighlight
                                ? "border-info bg-surface-subtle"
                                : "border-line bg-surface-subtle"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex h-[22px] items-center rounded bg-primary-subtle px-2 text-[11px] font-semibold text-primary">
                                  {idx + 1}문단
                                  {isLead
                                    ? " (리드문)"
                                    : isClosing
                                    ? " (마무리/인용)"
                                    : ""}
                                </span>
                                <span className="text-[11px] text-ink-muted">
                                  {Array.from(para).length.toLocaleString()}자
                                </span>

                                {data?.job.mode === "comparative" &&
                                  ((data.competitors ?? []).some((c) =>
                                    para.includes(c.name)
                                  ) ||
                                    /(?:경쟁이\s*치열하게\s*전개|차별화를\s*꾀했다|차별점으로\s*꼽힌다|비교해\s*볼\s*때|기존\s*스크린|동종\s*라이프스타일|뉴미디어\s*콘텐츠\s*스튜디오)/.test(
                                      para
                                    )) && (
                                    <span className="inline-flex items-center gap-1 rounded border-hairline border-secondary bg-secondary-subtle px-2 py-0.5 text-[11px] font-semibold text-secondary">
                                      <span>📊 동종업계·경쟁사 비교·기획 문단</span>
                                    </span>
                                  )}

                                {/* 이 문단에 반영된 교열 내역 배지 표시 */}
                                {paraDiffs.map((pd) => (
                                  <span
                                    key={pd.diffIdx}
                                    className={`inline-flex items-center gap-1 rounded border-hairline px-2 py-0.5 text-[11px] font-semibold ${
                                      pd.isRestored
                                        ? "border-hold bg-hold-bg text-hold"
                                        : "border-pass bg-pass-bg text-pass"
                                    }`}
                                  >
                                    <MapPin className="h-3 w-3 stroke-[1.75]" />
                                    <span>
                                      [교열 {pd.diffIdx + 1}] {pd.original} →{" "}
                                      {pd.replacement}
                                      {pd.isRestored ? " (원문 복원됨)" : " 위치"}
                                    </span>
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  disabled={idx === 0}
                                  onClick={() => moveParagraph(idx, -1)}
                                  className="h-[24px] px-2 text-[11px] gap-1"
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
                                  className="h-[24px] px-2 text-[11px] gap-1"
                                >
                                  <ArrowDown className="h-3 w-3 stroke-[1.5]" />
                                  <span>아래로</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addParagraphBelow(idx)}
                                  className="h-[24px] px-2 text-[11px] gap-1"
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
                                  className="h-[24px] px-2 text-[11px] text-reject hover:bg-reject-bg hover:text-reject gap-1"
                                >
                                  <Trash2 className="h-3 w-3 stroke-[1.5]" />
                                  <span>삭제</span>
                                </Button>
                              </div>
                            </div>

                            {/* 문단 내 교열 위치 하이라이트 표시 영역 */}
                            {showInlineDiffHighlight && hasAnyHighlight && (
                              <div className="rounded border-hairline border-info bg-surface px-3 py-2 text-[14px] leading-[24px] text-ink">
                                <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-info">
                                  <span>
                                    📍 {idx + 1}문단 내 교열·점검 어구 위치 표시 (아래 입력창에서 직접 수정 가능)
                                  </span>
                                </div>
                                <p className="whitespace-pre-wrap">
                                  {renderTextWithDiffHighlights(para)}
                                </p>
                              </div>
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
                      {showInlineDiffHighlight &&
                        ((s5Output?.diffs && s5Output.diffs.length > 0) ||
                          highlightedTerm) && (
                          <div className="rounded-md border-hairline border-info bg-info-bg p-3 space-y-1.5 resize-y overflow-auto">
                            <div className="text-[12px] font-semibold text-info">
                              📍 본문 내 교열·점검 어구 위치 표시
                            </div>
                            <div className="whitespace-pre-wrap rounded border-hairline border-line bg-surface p-3 text-[15px] leading-[26px] text-ink">
                              {renderTextWithDiffHighlights(body)}
                            </div>
                          </div>
                        )}
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
                      className="h-[22px] px-2 text-[11px] text-primary"
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
                        className={`text-[11px] font-medium ${
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
                          className="h-[22px] px-2 text-[11px]"
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

        {/* 우측: 규정 체크 리포트 / 클레임 Ledger / 출처 목록 탭 (360px) */}
        {!wideEditorMode && (
        <aside className="w-[360px] shrink-0">
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
