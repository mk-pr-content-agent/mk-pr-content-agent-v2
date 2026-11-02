import type { S0Output, S1Output } from "./types";
import type { NormalizedSource } from "@/lib/llm/perplexity";

export function evaluateDedupeFromSources(
  s0: S0Output,
  sources: NormalizedSource[],
  threshold = 3
): S1Output {
  const newsSources = sources.filter(
    (s) =>
      /(?:news|mk\.co\.kr|hankyung|chosun|joongang|donga|yna\.co\.kr|edaily|mt\.co\.kr|sedaily|fnnews|heraldcorp)/i.test(
        s.url
      )
  );

  const duplicateCount = newsSources.length;
  const verdict = duplicateCount >= threshold ? "HOLD" : "PASS";

  return {
    duplicateCount,
    threshold,
    verdict,
    similarArticles: newsSources.map((s) => ({
      title: s.title,
      publisher: s.publisher,
      url: s.url,
      publishedAt: s.publishedAt,
    })),
    differentiationAdvice:
      duplicateCount > 0
        ? `기존 게재 기사(${duplicateCount}건)와 네이버 검색 시 겹치지 않도록 제목 어순과 핵심 키워드 배치를 차별화합니다.`
        : "동일 소재 중복 게재 기사가 기준(3건 미만) 이내로 확인되었습니다.",
    sources,
  };
}
