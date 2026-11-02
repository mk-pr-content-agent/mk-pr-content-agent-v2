import { loadRejectMessages, loadRestrictedTopics } from "@/lib/rules/loader";
import type { RestrictedMatch, S3Output } from "./types";

interface KeywordRule {
  ruleId: string;
  category: string;
  keywords: RegExp;
  action: "REJECT" | "HOLD";
  rejectId: string;
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    ruleId: "RST-DOC1-02",
    category: "가상화폐(코인·NFT)·다단계·투자·사기",
    keywords: /(?:가상화폐|암호화폐|코인\s*상장|토큰\s*발행|다단계|네트워크\s*마케팅|원금\s*보장|수익률\s*보장|비상장주\s*투자\s*유도)/,
    action: "REJECT",
    rejectId: "REJ-04",
  },
  {
    ruleId: "RST-PROC-01",
    category: "투자/주식 (비상장주·IPO 상장 추진)",
    keywords: /(?:IPO\s*추진|기업공개\s*상장\s*추진|장외주식\s*매수|기업가치\s*부풀리기)/,
    action: "REJECT",
    rejectId: "REJ-04",
  },
  {
    ruleId: "RST-DOC1-01",
    category: "제한 업종 (성형·다이어트·담배·전자담배·불법의약품)",
    keywords: /(?:성형외과\s*시술\s*할인|단기간\s*다이어트\s*보조제|전자담배\s*액상\s*출시|비만\s*치료제\s*특가)/,
    action: "REJECT",
    rejectId: "REJ-03",
  },
  {
    ruleId: "RST-PROC-05",
    category: "회원권 판매·분양",
    keywords: /(?:클럽\s*회원권\s*판매|레지던스\s*분양\s*회원\s*모집|VIP\s*회원권\s*분양)/,
    action: "REJECT",
    rejectId: "REJ-04",
  },
  {
    ruleId: "RST-PROC-06",
    category: "미검증 바이오·의료관광",
    keywords: /(?:의료관광\s*패키지|줄기세포\s*완치|항암\s*특효\s*비법|검증되지\s*않은\s*치료\s*효과)/,
    action: "REJECT",
    rejectId: "REJ-05",
  },
  {
    ruleId: "RST-DOC1-04",
    category: "기부단체·기부 관련 (오픈 이슈 #3: 기본 HOLD)",
    keywords: /(?:기부금\s*전달식|성금\s*기탁|자선\s*기부\s*모금)/,
    action: "HOLD",
    rejectId: "REJ-03",
  },
  {
    ruleId: "RST-PROC-03",
    category: "부동산 분양 (공식 홈페이지·시공사 확인 필요)",
    keywords: /(?:아파트\s*분양|오피스텔\s*분양|민간임대\s*분양|견본주택\s*개관)/,
    action: "HOLD",
    rejectId: "REJ-03",
  },
];

export function runS3RestrictionScreen(rawText: string): S3Output {
  // Ensure YAML files are loaded and validated
  loadRestrictedTopics();
  const rejectMessages = loadRejectMessages().reject_messages;

  const matches: RestrictedMatch[] = [];

  for (const rule of KEYWORD_RULES) {
    const m = rule.keywords.exec(rawText);
    if (!m) continue;

    const matchedKeyword = m[0];
    const start = Math.max(0, m.index - 25);
    const end = Math.min(rawText.length, m.index + matchedKeyword.length + 25);
    const evidenceQuote = rawText.slice(start, end).replace(/\s+/g, " ").trim();

    const template =
      rejectMessages.find((r) => r.id === rule.rejectId)?.message ??
      "해당 소재(○○)는 기사식광고 게재 제한 소재에 해당하여 게재가 어렵습니다.";
    const formattedMessage = template.replace("○○", `${rule.category}: ${matchedKeyword}`);

    matches.push({
      ruleId: rule.ruleId,
      category: rule.category,
      matchedKeyword,
      evidenceQuote,
      action: rule.action,
      rejectMessage: formattedMessage,
    });
  }

  const hasReject = matches.some((m) => m.action === "REJECT");
  const hasHold = matches.some((m) => m.action === "HOLD");

  const verdict = hasReject ? "REJECT" : hasHold ? "HOLD" : "PASS";
  const primaryReject = matches.find((m) => m.action === "REJECT");

  return {
    verdict,
    matches,
    primaryRejectMessage: primaryReject?.rejectMessage,
  };
}
