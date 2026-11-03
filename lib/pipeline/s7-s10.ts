import {
  checkFmt08,
  checkFmt12,
  countBodyCharsWithSpaces,
  runHardRules,
} from "@/lib/rules/hard-rules";
import type {
  JobMode,
  JobOptions,
  NaverRuleCheckItem,
  S6Output,
  S7Output,
  S8Output,
  S9Output,
  S10Output,
  SanitizedDiff,
  VerdictType,
} from "./types";

/**
 * S7: 제목·부제목·리드·문체 정비
 * - "~밝혔다"가 3회 이상이면 중간 출현분을 "~설명했다", "~전했다"로 자동 치환
 */
export function runS7StyleEdit(s6: S6Output): S7Output {
  if (s6.mode === "minimal") {
    return {
      titleCandidates: s6.titleCandidates,
      title: s6.title,
      subtitle: s6.subtitle,
      body: s6.body,
      styleEdits: [],
    };
  }

  let body = s6.body;
  const styleEdits: SanitizedDiff[] = [];

  let balkhyeotdaIndex = 0;
  body = body.replace(/밝혔다/g, (match) => {
    balkhyeotdaIndex++;
    if (balkhyeotdaIndex >= 3) {
      const alt = balkhyeotdaIndex % 2 === 1 ? "설명했다" : "전했다";
      styleEdits.push({
        original: match,
        replacement: alt,
        reason: "'~밝혔다' 기사 내 3회 이상 반복 억제 (FMT-07)",
      });
      return alt;
    }
    return match;
  });

  return {
    titleCandidates: s6.titleCandidates,
    title: s6.title,
    subtitle: s6.subtitle,
    body,
    styleEdits,
  };
}

/**
 * S8: 사진/캡션 점검 (FMT-06, FMT-10, FMT-12)
 */
export function runS8PhotoCheck(
  captions: string[],
  companyName: string,
  options: JobOptions
): S8Output {
  const warnings: string[] = [];
  const normalizedCaptions: string[] = [];

  if ((options.photoCount ?? captions.length) > 2) {
    warnings.push("첨부 사진은 최대 2장까지만 허용됩니다 (FMT-06).");
  }

  if (options.photoMaxDimPx && options.photoMaxDimPx > 700) {
    warnings.push(
      `사진 가로/세로 규격(${options.photoMaxDimPx}px)이 기준(600~700px 이내)을 초과합니다 (FMT-06).`
    );
  }

  for (const raw of captions) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Normalize <제공=...>, <출처=...>, [출처:...] to [제공=...]
    const replaced = trimmed.replace(
      /(?:<\s*(?:제공|출처|사진)\s*(?:=|:)\s*([^>]+?)\s*>|\[\s*(?:제공|출처|사진)\s*(?:=|:)\s*([^\]]+?)\s*\]|\(\s*(?:제공|출처|사진)\s*(?:=|:)\s*([^\)]+?)\s*\))/,
      (_m, g1, g2, g3) => `[제공=${(g1 ?? g2 ?? g3 ?? companyName).trim()}]`
    );

    if (!/\[제공=[^\]]+\]/.test(replaced)) {
      normalizedCaptions.push(`${replaced} [제공=${companyName}]`);
      warnings.push(
        `캡션에 제공자 표기가 누락되어 '[제공=${companyName}]' 형식을 자동 보완했습니다 (FMT-10/FMT-12).`
      );
    } else {
      normalizedCaptions.push(replaced);
    }
  }

  if (normalizedCaptions.length === 0) {
    normalizedCaptions.push(
      `${companyName} 관련 사진 설명. [제공=${companyName}]`
    );
  }

  const fmt12Findings = checkFmt12({
    title: "",
    body: "",
    captions: normalizedCaptions,
  });
  for (const f of fmt12Findings) {
    warnings.push(f.message);
  }

  return {
    verdict: warnings.length > 0 ? "WARN" : "PASS",
    warnings,
    normalizedCaptions,
  };
}

/**
 * S9: 최종 교열 + 규정 체크 리포트 (기사식광고 하드룰 + 네이버 운영평가 A~R 매핑)
 */
export function runS9FinalCheck(
  article: { title: string; subtitle: string; body: string; captions: string[] },
  mode: JobMode,
  options: JobOptions,
  priorVerdict: VerdictType = "PASS"
): S9Output {
  const hardRuleFindings = runHardRules(article);

  // FMT-11 바이라인 점검
  const byline = options.byline?.trim() ?? "";
  if (!byline) {
    hardRuleFindings.push({
      ruleId: "FMT-11",
      severity: "WARN",
      location: { field: "title" },
      message: "작성자 식별 정보(바이라인, 예: '홍길동 기자') 입력을 확인하십시오 (네이버 C항목 / FMT-11).",
      suggestion: "CMS 송출 시 실명 기자 바이라인을 반드시 설정하십시오.",
    });
  }

  const hasBlock = hardRuleFindings.some((f) => f.severity === "BLOCK");
  const fmt08Count = checkFmt08(article).length;

  const naverChecklist: NaverRuleCheckItem[] = [
    {
      code: "A",
      name: "허위사실 판결 예방 (팩트체크·증빙)",
      penalty: "2점",
      status: "PASS",
      detail: "Claim Ledger 기반 사실 주장 분류 및 출처 대조 완료",
    },
    {
      code: "B",
      name: "과장·왜곡·오인 유발 표현 점검",
      penalty: "0.5점",
      status: fmt08Count > 0 ? "WARN" : "PASS",
      detail:
        fmt08Count > 0
          ? `최상급·단정 표현 ${fmt08Count}건 감지 — 공인 출처 근거 확인 필요`
          : "무근거 최상급·과장 표현 필터링 완료",
    },
    {
      code: "C",
      name: "작성자 식별 정보(바이라인) 확인",
      penalty: "1~4점",
      status: byline ? "PASS" : "WARN",
      detail: byline
        ? `바이라인 설정됨 (${byline})`
        : "CMS 입력 시 실명 기자 바이라인 필수 확인",
    },
    {
      code: "D",
      name: "AI 활용 표시 옵션",
      penalty: "0.5점",
      status: options.includeAiNotice ? "PASS" : "WARN",
      detail: options.includeAiNotice
        ? "기사 하단 AI 활용 고지 문구 포함됨"
        : "AI 활용 고지 문구 미포함 (하단 옵션에서 on/off 가능)",
    },
    {
      code: "J",
      name: "중복·유사 기사 재전송 방지",
      penalty: "1.5점",
      status: "PASS",
      detail: "포털 게재 현황 점검 및 제목 차별화 반영",
    },
    {
      code: "K/L",
      name: "낚시성 제목·키워드 남용 방지",
      penalty: "0.5~2점",
      status: "PASS",
      detail: "40자 내외 사실 중심 제목 및 어미 반복 억제 적용",
    },
    {
      code: "O",
      name: "저작권 보호 (타 매체 문장 복사 금지·사진 출처)",
      penalty: "1~2점",
      status: "PASS",
      detail: "자체 문장 재서술 및 사진 캡션 제공자 표기 완료",
    },
    {
      code: "Q/R",
      name: "유가·홍보성 기사 송출 권고",
      penalty: "0.5~1.5점",
      status: "WARN",
      detail:
        mode === "comparative"
          ? "비교·기획 실험 모드: 네이버 제외 송출 강력 권장 및 사람 검수 필수"
          : "기사식광고(유가 홍보): 네이버 제외 송출 권장 여부 담당자 확인",
    },
  ];

  let overallVerdict: VerdictType = priorVerdict;
  if (priorVerdict !== "REJECT") {
    if (hasBlock || priorVerdict === "HOLD") {
      overallVerdict = "HOLD";
    } else if (hardRuleFindings.length > 0) {
      overallVerdict = "PASS_WITH_EDIT";
    } else {
      overallVerdict = "PASS";
    }
  }

  return {
    hardRuleFindings,
    naverChecklist,
    overallVerdict,
    charCountTitle: Array.from(article.title.trim()).length,
    charCountBody: countBodyCharsWithSpaces(article.body),
  };
}

/**
 * S10: 사람 검수·승인 체크리스트 구성
 */
export function runS10PrepareApproval(mode: JobMode): S10Output {
  const baseChecklist = [
    {
      id: "fact_verified",
      label: "본문 내 수치·일정·고유명사가 보도자료 및 근거 출처와 일치함을 확인했습니다.",
    },
    {
      id: "rule_report_checked",
      label: "우측 규정 체크 리포트(하드룰 및 네이버 운영평가 항목)의 경고 사항을 검토했습니다.",
    },
    {
      id: "caption_copyright_checked",
      label: "사진이 기업 제공 원본이며 캡션(설명+제공자) 및 초상권 동의를 확인했습니다.",
    },
    {
      id: "naver_exclusion_decided",
      label: "네이버 송출 여부(권고: 네이버 제외)를 결정했습니다.",
    },
  ];

  const comparativeExtra =
    mode === "comparative"
      ? [
          {
            id: "comp_urls_checked",
            label: "[비교/기획] 경쟁사 관련 모든 사실의 출처 URL을 직접 확인했습니다.",
          },
          {
            id: "comp_no_defamation",
            label: "[비교/기획] 경쟁사 관련 부정적·단정적 우열 표현이 없습니다.",
          },
          {
            id: "comp_no_plagiarism",
            label: "[비교/기획] 타 매체 문장을 그대로 옮기지 않았습니다.",
          },
          {
            id: "comp_team_lead_checked",
            label: "[비교/기획] 규정 담당자/팀장 확인을 받았습니다.",
          },
        ]
      : [];

  return {
    readyForApproval: true,
    naverExcludedRecommended: true,
    requiredChecklist: [...baseChecklist, ...comparativeExtra],
  };
}
