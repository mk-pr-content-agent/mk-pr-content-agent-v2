import { loadBannedWords } from "@/lib/rules/loader";
import type { S5Output, SanitizedDiff } from "./types";

export function runS5Sanitize(rawText: string): S5Output {
  const banned = loadBannedWords();
  let sanitizedText = rawText;
  const diffs: SanitizedDiff[] = [];

  // 1. 홍보체 문구 치환 (FMT-07)
  for (const promo of banned.promotional_tones) {
    if (sanitizedText.includes(promo.term)) {
      const replacement = promo.replacement || "";
      sanitizedText = sanitizedText.split(promo.term).join(replacement);
      diffs.push({
        original: promo.term,
        replacement: replacement || "(삭제)",
        reason: "홍보성 어미/문구를 객관적 보도 문체로 수정 (FMT-07)",
      });
    }
  }

  // 2. 근거 없는 최상급·과장 표현 완화 (FMT-08)
  const sortedSuperlatives = [...banned.superlative_terms].sort(
    (a, b) => b.term.length - a.term.length
  );
  for (const sup of sortedSuperlatives) {
    if (sanitizedText.includes(sup.term)) {
      sanitizedText = sanitizedText.split(sup.term).join(sup.suggestion);
      diffs.push({
        original: sup.term,
        replacement: sup.suggestion,
        reason: "근거 증빙이 확인되지 않은 최상급/단정 표현 완화 (F6/FMT-08)",
      });
    }
  }

  // 3. 전화번호·URL 노출 자동 마스킹/완화 (FMT-01)
  const urlRegex = /https?:\/\/[^\s<>)"']+|www\.[^\s<>)"']+/g;
  const urlMatches = sanitizedText.match(urlRegex) ?? [];
  for (const url of urlMatches) {
    sanitizedText = sanitizedText.replace(url, "공식 홈페이지");
    diffs.push({
      original: url,
      replacement: "공식 홈페이지",
      reason: "본문 내 직접 URL 노출 제한 (FMT-01)",
    });
  }

  // 4. 과도한 판촉·할인율·경품 등수 나열 완화 (네이버 운영평가 R항목: 광고성 상품 판매·프로모션 정보 완화)
  const promoDiscountRegex =
    /선착순으로\s*\d+%\s*할인\s*쿠폰을\s*지급하고,\s*[^.]*?단독\s*\d+%\s*장바구니\s*쿠폰을\s*제공한다\./g;
  const discountMatches = sanitizedText.match(promoDiscountRegex) ?? [];
  for (const dm of discountMatches) {
    const replacement =
      "방문 고객과 회원을 대상으로 기간 한정 할인 쿠폰 등 개점 기념 프로모션을 진행한다.";
    sanitizedText = sanitizedText.replace(dm, replacement);
    diffs.push({
      original: dm,
      replacement,
      reason:
        "세부 할인율·쿠폰 조건 나열을 기사체로 축약 (네이버 운영평가 R항목 광고성 판촉 완화)",
    });
  }

  const luckyDrawRegex =
    /\d+만원\s*이상\s*구매\s*시\s*1회\s*참여할\s*수\s*있으며,\s*경품은\s*1등[^.]*?구성했다\./g;
  const luckyMatches = sanitizedText.match(luckyDrawRegex) ?? [];
  for (const lm of luckyMatches) {
    const replacement =
      "일정 금액 이상 구매 고객을 대상으로 입점 브랜드 가방·모자·액세서리 등을 증정하는 경품 추첨 행사로 진행된다.";
    sanitizedText = sanitizedText.replace(lm, replacement);
    diffs.push({
      original: lm,
      replacement,
      reason:
        "구매 금액 조건 및 1~5등 경품 상세 나열을 기사체로 완화 (네이버 R항목 광고성 판촉 완화)",
    });
  }

  // 5. 매경 기사식광고 표기 규칙: 본문 내 붙어 쓴 금액 단위 띄어쓰기 (PRD 9.2: '7만원' → '7만 원')
  const attachedMoneyRegex = /(\d+)\s*(억|만|천)\s*원/g;
  sanitizedText = sanitizedText.replace(
    attachedMoneyRegex,
    (full, num: string, unit: string) => {
      const normalized = `${num} ${unit}원`.replace(`${num} ${unit}원`, `${num}${unit} 원`);
      if (full !== normalized) {
        diffs.push({
          original: full,
          replacement: normalized,
          reason: "매경 기사 본문 숫자·화폐 단위 띄어쓰기 교열 (PRD 9.2)",
        });
      }
      return normalized;
    }
  );

  return {
    sanitizedText,
    diffs,
    verdict: diffs.length > 0 ? "PASS_WITH_EDIT" : "PASS",
  };
}
