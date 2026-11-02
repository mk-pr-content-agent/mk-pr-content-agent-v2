import { loadRejectMessages } from "@/lib/rules/loader";
import type { S0Output, S2Output } from "./types";
import type { NormalizedSource } from "@/lib/llm/perplexity";

export function evaluateCompanyVerification(
  s0: S0Output,
  rawText: string,
  sources: NormalizedSource[]
): S2Output {
  const rejectMessages = loadRejectMessages().reject_messages;
  const rejNoHomepage =
    rejectMessages.find((r) => r.id === "REJ-01")?.message ??
    "공식 홈페이지가 확인되지 않아 게재가 어렵습니다. 공식 홈페이지 확인 후 다시 요청해 주시기 바랍니다.";
  const rejUnverified =
    rejectMessages.find((r) => r.id === "REJ-02")?.message ??
    "기업 실체와 공식 채널 확인이 어려워 게재가 어렵습니다.";

  // 원문에 명시적으로 "홈페이지 없음", "SNS만 운영", "인스타그램 계정만" 등이 있는 경우 REJECT
  const explicitSnsOnly =
    /(?:공식\s*홈페이지(?:는|가)?\s*없|홈페이지\s*미보유|SNS\s*계정만|인스타그램(?:으로)?만\s*운영|블로그만\s*운영)/.test(
      rawText
    );

  if (explicitSnsOnly) {
    return {
      hasOfficialHomepage: false,
      snsOnly: true,
      verdict: "REJECT",
      rejectCode: "REJ-01",
      rejectMessage: rejNoHomepage,
      businessVerifiedSummary: `${s0.companyName}: 공식 홈페이지가 확인되지 않고 SNS 채널만 존재하는 것으로 감지되어 반려 대상입니다.`,
      sources,
    };
  }

  if (/(?:유령\s*회사|홈페이지\s*접속\s*불가|폐업\s*의심)/.test(rawText)) {
    return {
      hasOfficialHomepage: false,
      snsOnly: false,
      verdict: "REJECT",
      rejectCode: "REJ-02",
      rejectMessage: rejUnverified,
      businessVerifiedSummary: `${s0.companyName}: 공식 홈페이지 접속 불가 또는 기업 실체 확인 불가 사유가 감지되었습니다.`,
      sources,
    };
  }

  const officialSource = sources.find(
    (s) =>
      !/instagram\.com|facebook\.com|blog\.naver\.com|youtube\.com|tiktok\.com/i.test(
        s.url
      )
  );

  return {
    hasOfficialHomepage: true,
    homepageUrl: officialSource?.url,
    snsOnly: false,
    verdict: "PASS",
    businessVerifiedSummary: `${s0.companyName}의 사업 실체 및 공식 채널이 확인되었습니다.`,
    sources,
  };
}
