import {
  loadBannedWords,
  loadHardRules,
  type BannedWordsData,
  type RuleDefinition,
  type RuleSeverity,
} from "./loader";

export interface ArticleInput {
  title: string;
  subtitle?: string;
  body: string;
  captions: string[];
}

export interface FindingLocation {
  field: "title" | "subtitle" | "body" | "caption";
  index?: number;
  matchedText?: string;
  start?: number;
  end?: number;
}

export interface RuleFinding {
  ruleId: string;
  severity: RuleSeverity;
  location: FindingLocation;
  message: string;
  suggestion?: string;
}

export interface HardRuleConfigOverrides {
  titleMinChars?: number;
  titleMaxChars?: number;
  bodyMinChars?: number;
  bodyMaxChars?: number;
  maxBalkhyeotdaCount?: number;
  pyeongToSqmFactor?: number;
  superlativeSeverity?: RuleSeverity;
}

function getRuleMeta(
  rulesMap: Map<string, RuleDefinition>,
  ruleId: string
): RuleDefinition {
  const rule = rulesMap.get(ruleId);
  if (!rule) {
    throw new Error(`Rule definition not found in YAML for ${ruleId}`);
  }
  return rule;
}

function getNumberParam(
  rule: RuleDefinition,
  key: string,
  fallback: number
): number {
  const val = rule.params?.[key];
  return typeof val === "number" ? val : fallback;
}

interface TextSegment {
  field: "title" | "subtitle" | "body" | "caption";
  index?: number;
  text: string;
}

function getSegments(article: ArticleInput): TextSegment[] {
  const segments: TextSegment[] = [
    { field: "title", text: article.title },
  ];
  if (article.subtitle && article.subtitle.trim().length > 0) {
    segments.push({ field: "subtitle", text: article.subtitle });
  }
  segments.push({ field: "body", text: article.body });
  article.captions.forEach((cap, idx) => {
    segments.push({ field: "caption", index: idx, text: cap });
  });
  return segments;
}

/**
 * FMT-01: 전화번호·홈페이지 주소·종목코드·QR코드 노출 불가 (BLOCK)
 */
export function checkFmt01(
  article: ArticleInput,
  rulesMap = loadHardRules()
): RuleFinding[] {
  const rule = getRuleMeta(rulesMap, "FMT-01");
  const findings: RuleFinding[] = [];

  const phoneRegex =
    /(?:(?:\+82[-\s]?)?0\d{1,2}[-\s)\.]+\d{3,4}[-\s\.]\d{4}|\b1[568]\d{2}[-\s]\d{4}\b)/g;
  const urlRegex =
    /(?:https?:\/\/[^\s<>)"']+|www\.[^\s<>)"']+|\b[a-zA-Z0-9-]+\.(?:co\.kr|or\.kr|go\.kr|ac\.kr|ne\.kr|kr|com|net|org|io|ai|biz)(?:\/[^\s<>)"']*)?)/gi;
  const stockCodeRegex =
    /(?:[\(\[\s](?:[A-Z]?\d{6})(?:[\)\]\s,\.]|$)|종목\s*코드\s*[:：]?\s*[A-Z]?\d{6})/g;
  const qrCodeRegex = /(?:QR\s*코드|큐알\s*코드)/gi;

  for (const seg of getSegments(article)) {
    const patterns: Array<{ regex: RegExp; label: string; suggestion: string }> = [
      {
        regex: phoneRegex,
        label: "전화번호",
        suggestion: "전화번호를 삭제하거나 '공식 채널을 통해 문의'로 대체하십시오.",
      },
      {
        regex: urlRegex,
        label: "홈페이지 주소(URL)",
        suggestion: "URL을 삭제하고 '공식 홈페이지에서 확인' 형태로 표기하십시오.",
      },
      {
        regex: stockCodeRegex,
        label: "종목코드",
        suggestion: "상장 종목코드 표기를 삭제하십시오.",
      },
      {
        regex: qrCodeRegex,
        label: "QR코드 안내",
        suggestion: "QR코드 관련 안내 문구를 삭제하십시오.",
      },
    ];

    for (const { regex, label, suggestion } of patterns) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(seg.text)) !== null) {
        const matchedText = match[0].trim();
        findings.push({
          ruleId: rule.id,
          severity: rule.severity,
          location: {
            field: seg.field,
            index: seg.index,
            matchedText,
            start: match.index,
            end: match.index + match[0].length,
          },
          message: `${rule.message} (${label}: "${matchedText}")`,
          suggestion,
        });
      }
    }
  }

  return findings;
}

/**
 * FMT-02: 면적은 평 대신 ㎡ (예: 100평 → 330㎡ 또는 330㎡(100평))
 */
export function checkFmt02(
  article: ArticleInput,
  rulesMap = loadHardRules(),
  overrides?: HardRuleConfigOverrides
): RuleFinding[] {
  const rule = getRuleMeta(rulesMap, "FMT-02");
  const factor =
    overrides?.pyeongToSqmFactor ??
    getNumberParam(rule, "pyeongToSqmFactor", 3.3058);
  const findings: RuleFinding[] = [];

  const pyeongRegex = /(\d+(?:,\d{3})*(?:\.\d+)?)\s*평(?!\s*균|\s*가|\s*점|\s*판|\s*일|\s*소|\s*생|\s*화|\s*등|\s*방|\s*면|\s*야|\s*택|\s*창|\s*양)/g;

  for (const seg of getSegments(article)) {
    pyeongRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pyeongRegex.exec(seg.text)) !== null) {
      const fullMatch = match[0];
      const rawNumber = match[1].replace(/,/g, "");
      const pyeongVal = parseFloat(rawNumber);
      if (Number.isNaN(pyeongVal)) continue;

      const prefix = seg.text.slice(Math.max(0, match.index - 25), match.index);
      const suffix = seg.text.slice(
        match.index + fullMatch.length,
        match.index + fullMatch.length + 10
      );

      // 이미 "330㎡(100평)" 또는 "330제곱미터(100평)" 형태로 병기된 경우는 통과
      const isAlreadyPairedWithSqm =
        /(?:\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:㎡|m²|제곱미터)\s*\(\s*(?:약\s*)?$/i.test(
          prefix
        ) && /^\s*\)/.test(suffix);

      if (isAlreadyPairedWithSqm) {
        continue;
      }

      // 1평 ≈ 3.3058㎡이나 기사 관행 및 PRD 예시("100평 → 330㎡")에 맞춰
      // 100평 단위 이상 정수는 3.3배 정수 환산(또는 반올림)을 함께 안내
      const sqmStandard = Math.round(pyeongVal * 3.3);
      const sqmExact = Math.round(pyeongVal * factor);
      const primarySqm =
        pyeongVal % 10 === 0 ? sqmStandard : sqmExact;

      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        location: {
          field: seg.field,
          index: seg.index,
          matchedText: fullMatch,
          start: match.index,
          end: match.index + fullMatch.length,
        },
        message: `${rule.message} (감지: "${fullMatch}")`,
        suggestion: `${primarySqm}㎡ 또는 ${primarySqm}㎡(${fullMatch})`,
      });
    }
  }

  return findings;
}

/**
 * FMT-03: 상세 주소(번지) 표기 제한 → "OO동 일대"
 */
export function checkFmt03(
  article: ArticleInput,
  rulesMap = loadHardRules()
): RuleFinding[] {
  const rule = getRuleMeta(rulesMap, "FMT-03");
  const findings: RuleFinding[] = [];

  // 지번 주소: "역삼동 123-45", "역삼동 123번지", "역삼동 산 12-3"
  const jibunRegex =
    /([가-힣0-9]+(?:동|읍|면|리))\s+(?:산\s*)?\d+(?:-\d+)?(?:\s*번지)?(?!\s*일대|\s*개|\s*명|\s*원|\s*년|\s*월|\s*일|\s*시|\s*분|\s*층|\s*호|\s*%)/g;

  // 도로명 상세 주소: "테헤란로 152", "강남대로 396번길 12", "연무장길 45"
  // 뒤에 조사/위치어가 오거나 번호에 하이픈/번길/번지가 결합된 실제 도로명 주소만 매칭 ("토대로 2단계" 등 일반 부사 오탐 방지)
  const roadAddressRegex =
    /([가-힣0-9]{2,}(?:대로|번길|로|길))\s+(\d+(?:-\d+)?(?:\s*번길\s*\d+(?:-\d+)?)?)(?=\s*(?:에|에서|일대|소재|위치|인근|\)|,|·|\.|$))(?!\s*(?:단계|차|회|번|개|명|원|년|월|일|시|분|초|층|호|%|배|위|점|건|편|장|권|기|세|대))/g;

  for (const seg of getSegments(article)) {
    jibunRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = jibunRegex.exec(seg.text)) !== null) {
      const dongName = match[1];
      const matchedText = match[0];
      // Exclude cases like "1동 203호" (apartment building dong)
      if (/^\d+동$/.test(dongName)) continue;

      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        location: {
          field: seg.field,
          index: seg.index,
          matchedText,
          start: match.index,
          end: match.index + matchedText.length,
        },
        message: `${rule.message} (감지: "${matchedText}")`,
        suggestion: `${dongName} 일대`,
      });
    }

    roadAddressRegex.lastIndex = 0;
    while ((match = roadAddressRegex.exec(seg.text)) !== null) {
      const roadName = match[1];
      const matchedText = match[0];
      // Exclude non-address phrases like "최초로 100", "토대로 2", "새로 20", "진로 1"
      if (
        /(?:토대로|바탕으로|기반으로|중심으로|대상으로|목적으로|일환으로|계기로|최초로|새로|따로|실제로|추가로|차례로|통로|경로|진로|선로|항로|활주로|회로|피로|근로|노후로|비율로|규모로|수준으로)$/.test(
          roadName
        ) ||
        roadName.length < 3
      ) {
        continue;
      }

      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        location: {
          field: seg.field,
          index: seg.index,
          matchedText,
          start: match.index,
          end: match.index + matchedText.length,
        },
        message: `${rule.message} (감지: "${matchedText}")`,
        suggestion: `상세 도로명 건물번호 대신 'OO동 일대'로 표기하십시오.`,
      });
    }
  }

  return findings;
}

/**
 * FMT-04: 제목 40자 내외 (28~45자 통과, 범위 밖 WARN)
 */
export function checkFmt04(
  article: ArticleInput,
  rulesMap = loadHardRules(),
  overrides?: HardRuleConfigOverrides
): RuleFinding[] {
  const rule = getRuleMeta(rulesMap, "FMT-04");
  const minChars =
    overrides?.titleMinChars ?? getNumberParam(rule, "minChars", 28);
  const maxChars =
    overrides?.titleMaxChars ?? getNumberParam(rule, "maxChars", 45);

  const title = article.title.trim();
  const len = Array.from(title).length;

  if (len < minChars || len > maxChars) {
    return [
      {
        ruleId: rule.id,
        severity: rule.severity,
        location: {
          field: "title",
          matchedText: title,
          start: 0,
          end: title.length,
        },
        message: `${rule.message} (현재 ${len}자, 기준 ${minChars}~${maxChars}자)`,
        suggestion:
          len < minChars
            ? `제목에 기업명·핵심 행위·수치를 보강해 ${minChars}~${maxChars}자로 맞추십시오.`
            : `제목을 간결하게 줄여 ${maxChars}자 이내로 맞추십시오.`,
      },
    ];
  }

  return [];
}

/**
 * 공백 포함 본문 글자 수 계산 헬퍼
 * - 줄바꿈(\r\n, \n)은 단락 구분이므로 제외하고, 문장 내 한글/영문/숫자/공백/문장부호는 모두 1자로 계산
 */
export function countBodyCharsWithSpaces(body: string): number {
  const normalized = body.replace(/\r?\n/g, "");
  return Array.from(normalized).length;
}

/**
 * FMT-05: 본문 공백 포함 1,200~1,500자 목표 (범위 밖 WARN)
 */
export function checkFmt05(
  article: ArticleInput,
  rulesMap = loadHardRules(),
  overrides?: HardRuleConfigOverrides
): RuleFinding[] {
  const rule = getRuleMeta(rulesMap, "FMT-05");
  const minChars =
    overrides?.bodyMinChars ?? getNumberParam(rule, "minChars", 1200);
  const maxChars =
    overrides?.bodyMaxChars ?? getNumberParam(rule, "maxChars", 1500);

  const charCount = countBodyCharsWithSpaces(article.body);

  if (charCount < minChars || charCount > maxChars) {
    return [
      {
        ruleId: rule.id,
        severity: rule.severity,
        location: {
          field: "body",
          start: 0,
          end: article.body.length,
        },
        message: `${rule.message} (현재 공백 포함 ${charCount}자, 목표 ${minChars}~${maxChars}자)`,
        suggestion:
          charCount < minChars
            ? `본문 분량이 부족합니다(현재 ${charCount}자). 사업 배경·세부 내용 등을 보강해 ${minChars}자 이상으로 작성하십시오.`
            : `본문 분량이 초과되었습니다(현재 ${charCount}자). 불필요한 수식어를 줄여 ${maxChars}자 이내로 조정하십시오.`,
      },
    ];
  }

  return [];
}

/**
 * FMT-07: 문체: 홍보체("자랑합니다" 등) 금지, "~밝혔다" 반복 억제(기본 3회 이상 시 WARN)
 */
export function checkFmt07(
  article: ArticleInput,
  rulesMap = loadHardRules(),
  bannedWords: BannedWordsData = loadBannedWords(),
  overrides?: HardRuleConfigOverrides
): RuleFinding[] {
  const rule = getRuleMeta(rulesMap, "FMT-07");
  const maxBalkhyeotda =
    overrides?.maxBalkhyeotdaCount ??
    getNumberParam(rule, "maxBalkhyeotdaCount", 3);
  const findings: RuleFinding[] = [];

  for (const seg of getSegments(article)) {
    for (const promo of bannedWords.promotional_tones) {
      let startIdx = 0;
      while (startIdx < seg.text.length) {
        const idx = seg.text.indexOf(promo.term, startIdx);
        if (idx === -1) break;
        findings.push({
          ruleId: rule.id,
          severity: rule.severity,
          location: {
            field: seg.field,
            index: seg.index,
            matchedText: promo.term,
            start: idx,
            end: idx + promo.term.length,
          },
          message: `홍보체 표현("${promo.term}")이 사용되었습니다.`,
          suggestion: promo.replacement
            ? `"${promo.term}" → "${promo.replacement}"`
            : `"${promo.term}" 문구를 삭제하십시오.`,
        });
        startIdx = idx + promo.term.length;
      }
    }
  }

  const balkhyeotdaRegex = /밝혔다/g;
  const matches = Array.from(article.body.matchAll(balkhyeotdaRegex));
  if (matches.length >= maxBalkhyeotda) {
    const thirdMatch = matches[maxBalkhyeotda - 1];
    findings.push({
      ruleId: rule.id,
      severity: rule.severity,
      location: {
        field: "body",
        matchedText: "밝혔다",
        start: thirdMatch?.index ?? 0,
        end: (thirdMatch?.index ?? 0) + 3,
      },
      message: `본문 내 '~밝혔다'가 ${matches.length}회 반복되었습니다 (허용 기준: ${maxBalkhyeotda - 1}회 이하).`,
      suggestion:
        "리드와 말미 인용 외에는 '~했다', '~설명했다', '~전했다' 등으로 치환하십시오.",
    });
  }

  return findings;
}

/**
 * FMT-08: 최상급·단정 표현 (세계 최고, 최대, 유일, 독보적 등) - /data/banned-words.yaml에서 로드
 */
export function checkFmt08(
  article: ArticleInput,
  rulesMap = loadHardRules(),
  bannedWords: BannedWordsData = loadBannedWords(),
  overrides?: HardRuleConfigOverrides
): RuleFinding[] {
  const rule = getRuleMeta(rulesMap, "FMT-08");
  const severity = overrides?.superlativeSeverity ?? rule.severity;
  const findings: RuleFinding[] = [];

  for (const seg of getSegments(article)) {
    const matchedRanges: Array<[number, number]> = [];

    // 긴 표현부터 우선 매칭하여 중복 검출 방지 (예: "국내 최대 규모" vs "국내 최대" / "최대 규모")
    const sortedTerms = [...bannedWords.superlative_terms].sort(
      (a, b) => b.term.length - a.term.length
    );

    for (const item of sortedTerms) {
      let startIdx = 0;
      while (startIdx < seg.text.length) {
        const idx = seg.text.indexOf(item.term, startIdx);
        if (idx === -1) break;
        const endIdx = idx + item.term.length;

        const overlaps = matchedRanges.some(
          ([s, e]) => idx < e && endIdx > s
        );
        if (!overlaps) {
          matchedRanges.push([idx, endIdx]);
          findings.push({
            ruleId: rule.id,
            severity,
            location: {
              field: seg.field,
              index: seg.index,
              matchedText: item.term,
              start: idx,
              end: endIdx,
            },
            message: `${rule.message} (감지: "${item.term}")`,
            suggestion: `공인 출처 근거가 없다면 "${item.suggestion}" 등으로 완화하거나 삭제하십시오.`,
          });
        }
        startIdx = endIdx;
      }
    }
  }

  return findings;
}

/**
 * FMT-12: 사진 캡션은 '설명 + 제공자' 구조, 괄호 형식은 CMS 기본형으로 통일
 */
export function checkFmt12(
  article: ArticleInput,
  rulesMap = loadHardRules()
): RuleFinding[] {
  const rule = getRuleMeta(rulesMap, "FMT-12");
  const findings: RuleFinding[] = [];

  const providerTagRegex =
    /(?:<\s*(?:제공|출처|사진)\s*(?:=|:)\s*([^>]+?)\s*>|\[\s*(?:제공|출처|사진)\s*(?:=|:)\s*([^\]]+?)\s*\]|\(\s*(?:제공|출처|사진)\s*(?:=|:)\s*([^\)]+?)\s*\))/;

  article.captions.forEach((rawCaption, index) => {
    const caption = rawCaption.trim();
    if (!caption) {
      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        location: {
          field: "caption",
          index,
          matchedText: "",
          start: 0,
          end: 0,
        },
        message: "사진 캡션이 비어 있습니다. '설명 + [제공=기관명]' 구조로 입력하십시오.",
        suggestion: "사진 설명 문구. [제공=기관명]",
      });
      return;
    }

    const match = providerTagRegex.exec(caption);
    if (!match) {
      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        location: {
          field: "caption",
          index,
          matchedText: caption,
          start: 0,
          end: caption.length,
        },
        message: `사진 캡션에 제공자 표기가 누락되었습니다. (감지: "${caption}")`,
        suggestion: `${caption} [제공=기관명]`,
      });
      return;
    }

    const providerTag = match[0];
    const providerName = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    const descriptionPart = caption.replace(providerTag, "").trim();

    if (descriptionPart.length < 2) {
      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        location: {
          field: "caption",
          index,
          matchedText: caption,
          start: 0,
          end: caption.length,
        },
        message: `사진 캡션에 사진 설명이 누락되고 제공자(${providerTag})만 표기되어 있습니다.`,
        suggestion: `(행사·인물·장면 설명) [제공=${providerName}]`,
      });
      return;
    }

    const canonicalTag = `[제공=${providerName}]`;
    if (providerTag !== canonicalTag) {
      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        location: {
          field: "caption",
          index,
          matchedText: providerTag,
          start: match.index,
          end: match.index + providerTag.length,
        },
        message: `사진 캡션 제공자 괄호 형식이 기본형(${canonicalTag})과 다릅니다 (감지: "${providerTag}").`,
        suggestion: `${descriptionPart} ${canonicalTag}`,
      });
    }
  });

  return findings;
}

/**
 * 전체 하드룰(FMT-01, 02, 03, 04, 05, 07, 08, 12) 일괄 실행
 */
export function runHardRules(
  article: ArticleInput,
  overrides?: HardRuleConfigOverrides
): RuleFinding[] {
  const rulesMap = loadHardRules();
  const bannedWords = loadBannedWords();

  return [
    ...checkFmt01(article, rulesMap),
    ...checkFmt02(article, rulesMap, overrides),
    ...checkFmt03(article, rulesMap),
    ...checkFmt04(article, rulesMap, overrides),
    ...checkFmt05(article, rulesMap, overrides),
    ...checkFmt07(article, rulesMap, bannedWords, overrides),
    ...checkFmt08(article, rulesMap, bannedWords, overrides),
    ...checkFmt12(article, rulesMap),
  ];
}
