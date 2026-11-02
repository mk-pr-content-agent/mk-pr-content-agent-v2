import type { S0Output, S4Output } from "./types";
import type { NormalizedSource } from "@/lib/llm/perplexity";

const MAJOR_CORP_REGEX =
  /(?:삼성전자|SK하이닉스|현대자동차|LG전자|네이버|카카오|포스코|롯데그룹|한화그룹|신세계)/g;

export function runS4FactCheck(
  s0: S0Output,
  rawText: string,
  sources: NormalizedSource[] = []
): S4Output {
  const evidenceRequiredList: string[] = [];

  for (const claim of s0.claims) {
    if (claim.status === "evidence_required" && claim.evidenceRequest) {
      evidenceRequiredList.push(`${claim.evidenceRequest} (관련 문장: "${claim.text.slice(0, 45)}...")`);
    }
  }

  const majorCorpMatches = Array.from(new Set(rawText.match(MAJOR_CORP_REGEX) ?? []));
  const hasMajorCorpMention = majorCorpMatches.length > 0;

  if (hasMajorCorpMention) {
    evidenceRequiredList.push(
      `특정 대기업(${majorCorpMatches.join(", ")}) 실명 노출: 해당 기업과 사전 협의된 사실인지 확인 요청 필요 (PRD F5)`
    );
  }

  const verdict = evidenceRequiredList.length > 0 ? "HOLD" : "PASS";

  return {
    claims: s0.claims,
    evidenceRequiredList,
    hasMajorCorpMention,
    verdict,
    sources,
  };
}
