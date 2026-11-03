import { describe, it, expect } from "vitest";
import { runS0Extract } from "@/lib/pipeline/s0-extract";
import { evaluateDedupeFromSources } from "@/lib/pipeline/s1-dedupe";
import { evaluateCompanyVerification } from "@/lib/pipeline/s2-company";
import { runS3RestrictionScreen } from "@/lib/pipeline/s3-restrict";
import { runS4FactCheck } from "@/lib/pipeline/s4-factcheck";
import { runS5Sanitize } from "@/lib/pipeline/s5-sanitize";
import {
  runS6WriteArticle,
  convertRawNoteToMkStyleSentence,
} from "@/lib/pipeline/s6-write";
import {
  runS7StyleEdit,
  runS8PhotoCheck,
  runS9FinalCheck,
  runS10PrepareApproval,
} from "@/lib/pipeline/s7-s10";

describe("Pipeline Stages S0~S10 (M3~M6)", () => {
  it("extracts company, numbers, dates, and claims in S0", () => {
    const raw = `㈜낫소(대표 김철수)가 10월 21일 서울 강남구에서 이동형 스크린 파크골프 부스를 출시하고 매출 34억 원을 달성했다고 밝혔다.`;
    const s0 = runS0Extract(raw);
    expect(s0.companyName).toContain("낫소");
    expect(s0.representativeName).toBe("김철수");
    expect(s0.numbers).toContain("34억 원");
    expect(s0.dates).toContain("10월 21일");
    expect(s0.claims.length).toBeGreaterThanOrEqual(1);
  });

  it("evaluates duplicate count threshold (< 3 PASS, >= 3 HOLD) in S1", () => {
    const s0 = runS0Extract("낫소 스크린 파크골프 출시");
    const passRes = evaluateDedupeFromSources(s0, [
      { url: "https://www.mk.co.kr/news/1", title: "기사1" },
      { url: "https://www.hankyung.com/news/2", title: "기사2" },
    ]);
    expect(passRes.verdict).toBe("PASS");

    const holdRes = evaluateDedupeFromSources(s0, [
      { url: "https://www.mk.co.kr/news/1", title: "기사1" },
      { url: "https://www.hankyung.com/news/2", title: "기사2" },
      { url: "https://www.chosun.com/news/3", title: "기사3" },
    ]);
    expect(holdRes.verdict).toBe("HOLD");
  });

  it("rejects SNS-only or missing homepage companies in S2", () => {
    const raw =
      "메타뷰티는 현재 공식 홈페이지는 없으며 인스타그램으로만 운영 중이다.";
    const s0 = runS0Extract(raw, "메타뷰티");
    const s2 = evaluateCompanyVerification(s0, raw, []);
    expect(s2.verdict).toBe("REJECT");
    expect(s2.rejectMessage).toContain("공식 홈페이지가 확인되지 않아");
  });

  it("detects restricted topics (REJECT for crypto/MLM, HOLD for real estate/donation) in S3", () => {
    const rejectRes = runS3RestrictionScreen(
      "당사는 가상화폐 코인 상장과 다단계 네트워크 마케팅 회원 모집을 시작한다."
    );
    expect(rejectRes.verdict).toBe("REJECT");
    expect(rejectRes.matches.length).toBeGreaterThanOrEqual(1);

    const holdRes = runS3RestrictionScreen(
      "이번 행사는 연말 자선 기부금 전달식과 함께 아파트 분양 견본주택 개관을 기념해 열렸다."
    );
    expect(holdRes.verdict).toBe("HOLD");
  });

  it("flags major corporation mentions and patent/metric claims in S4", () => {
    const raw =
      "테크원은 신규 특허를 획득했으며 삼성전자와 협력해 매출 34억 원을 달성했다고 밝혔다.";
    const s0 = runS0Extract(raw, "테크원");
    const s4 = runS4FactCheck(s0, raw);
    expect(s4.hasMajorCorpMention).toBe(true);
    expect(s4.verdict).toBe("HOLD");
    expect(s4.evidenceRequiredList.some((x) => x.includes("삼성전자"))).toBe(
      true
    );
  });

  it("sanitizes promotional tones and superlatives with diffs in S5", () => {
    const raw =
      "당사는 세계 최고 수준의 품질을 자랑합니다. 자세한 내용은 https://example.com 에서 확인하세요.";
    const s5 = runS5Sanitize(raw);
    expect(s5.verdict).toBe("PASS_WITH_EDIT");
    expect(s5.sanitizedText).not.toContain("자랑합니다");
    expect(s5.sanitizedText).not.toContain("세계 최고");
    expect(s5.sanitizedText).not.toContain("https://example.com");
    expect(s5.diffs.length).toBeGreaterThanOrEqual(3);
  });

  it("writes 1,200~1,500 char draft and runs S7~S10 cleanly", () => {
    const raw = `스포츠용품 전문기업 ㈜낫소가 고화질 그래픽과 정밀 센서 기술을 적용한 이동형 스크린 파크골프 부스를 선보이며 시장 확대에 나선다.`;
    const s0 = runS0Extract(raw, "㈜낫소");
    const s5 = runS5Sanitize(s0.normalizedText);
    const s6 = runS6WriteArticle("ad_article", s0, s5, {
      byline: "이경섭 기자",
    });
    const s7 = runS7StyleEdit(s6);
    const s8 = runS8PhotoCheck(s6.captions, s0.companyName, {});
    const s9 = runS9FinalCheck(
      {
        title: s7.title,
        subtitle: s7.subtitle,
        body: s7.body,
        captions: s8.normalizedCaptions,
      },
      "ad_article",
      { byline: "이경섭 기자" }
    );
    const s10 = runS10PrepareApproval("comparative");

    expect(s9.charCountBody).toBeGreaterThanOrEqual(1200);
    expect(s9.charCountBody).toBeLessThanOrEqual(1500);
    expect(s10.requiredChecklist.length).toBe(8);
  });

  it("extracts '무신사' (not secondary IP '한국야구위원회') and preserves all paragraphs with promotional diffs", () => {
    const musinsaRaw = `무신사가 가방과 모자를 전문으로 선보이는 편집숍 '무신사 백 & 캡클럽(MUSINSA BAG & CAP CLUB)' 2호점을 오는 23일 롯데몰 벨리타운 청량리점에 연다. 서울숲 1호점에 이은 매장으로, 무신사 백 & 캡클럽이 대형 유통 채널에 입점하는 것은 이번이 처음이다.

\u200d

무신사 백 & 캡클럽은 온라인에서 인기를 끈 가방과 모자를 직접 착용해 보고 고를 수 있는 오프라인 매장이다. 트렌디한 디자인과 합리적인 가격을 갖춘 일상용 액세서리를 중심으로 아동부터 성인까지 아우르는 94개 브랜드를 한곳에 모았다.

\u200d

매장은 롯데몰 벨리타운 청량리점 신관 2층에 약 125㎡(약 38평) 규모로 들어선다.

\u200d

47브랜드(47 Brand)와 디오디, 로아앤제인, 브라운브레스 키즈는 이번 매장을 통해 무신사 백 & 캡클럽에 새롭게 입점한다. 드라마 '신병4'와 대한민국 육군, 로블록스, 도미노피자, 한국야구위원회(KBO) 등 대중에게 친숙한 지식재산(IP) 굿즈도 함께 판매한다.

\u200d

무신사는 백 & 캡클럽 2호점 개점을 기념해 다양한 할인 혜택을 마련했다. 개점 첫 주말인 23일부터 25일까지 선착순으로 50% 할인 쿠폰을 지급하고, 다음 달 19일까지 무신사 회원이라면 누구나 쓸 수 있는 청량리점 단독 15% 장바구니 쿠폰을 제공한다.

\u200d

개점 첫 주말에는 럭키 드로도 진행한다. 7만원 이상 구매 시 1회 참여할 수 있으며, 경품은 1등 잔스포츠 가방, 2등 뉴에라 모자, 3등 몽벨 선글라스, 4등 하울린·퍼글러 키링, 5등 무신사 리유저블 백으로 구성했다.

\u200d

무신사 관계자는 "최근 가방과 모자는 패션 스타일을 완성하는 액세서리로 주목받으며 20~30대 고객의 필수 아이템으로 자리 잡고 있다"라며 "무신사 백 & 캡클럽 롯데몰 벨리타운 청량리점이 패션 액세서리 트렌드를 한눈에 살펴볼 수 있는 공간이 될 것으로 기대한다"라고 말했다.`;

    const s0 = runS0Extract(musinsaRaw);
    expect(s0.companyName).toBe("무신사");

    const s5 = runS5Sanitize(s0.normalizedText);
    expect(s5.diffs.length).toBeGreaterThanOrEqual(2);

    const s6 = runS6WriteArticle("ad_article", s0, s5, {});
    expect(s6.title).toContain("무신사");
    expect(s6.title).not.toContain("한국야구위원회");
    expect(s6.body).toContain("47브랜드");
    expect(s6.body).toContain("무신사 관계자는");
  });

  it("writes clean comparative article for '낫소' with real industry competitors and closing quote last", () => {
    const nassauRaw = `스포츠용품 전문기업 ㈜낫소가 고화질 그래픽과 정밀 센서 기술을 적용한 이동형 스크린 파크골프 부스를 선보이며 지자체와 공공기관, 주민복지시설 등을 대상으로 사업 확대에 나섰다.

이번 이동형 스크린 파크골프 부스는 화면과 센서, 타석, 외부 프레임을 하나로 결합한 일체형 구조로 설계돼 별도의 대규모 인테리어 공사 없이도 실내 공간에 간편하게 설치할 수 있는 것이 특징이다.

낫소 관계자는 “이동형 스크린 파크골프 부스는 공간 제약을 줄이면서도 실제 필드에 가까운 몰입감을 구현한 제품”이라며 “지자체와 복지시설을 중심으로 보급을 확대해 시니어와 지역 주민의 여가 복지 향상에 기여하겠다”라고 말했다.

1971년 창립한 낫소는 올해 창립 55주년을 맞은 스포츠용품 전문기업으로, 축구공·배구공·테니스공 등 다양한 스포츠용품을 개발 및 생산해 왔다.`;

    const s0 = runS0Extract(nassauRaw);
    const s5 = runS5Sanitize(s0.normalizedText);
    const s6 = runS6WriteArticle(
      "comparative",
      s0,
      s5,
      {},
      [],
      [
        {
          name: "isplus.com",
          summary:
            "... 1971년 창립한 낫소는... ### 낫소, 생활체육 접근성 높인다",
          sourceUrl: "https://isplus.com/article/1",
          selected: true,
        },
        {
          name: "v.daum.net",
          summary: "### 낫소 이동형 스크린 파크골프 부스 출사표...",
          sourceUrl: "https://v.daum.net/v/1",
          selected: true,
        },
      ]
    );

    expect(s6.body).not.toContain("isplus.com");
    expect(s6.body).not.toContain("v.daum.net");
    expect(s6.body).not.toContain("[출처#");
    expect(s6.body).not.toContain("###");
    expect(s6.body).toContain("골프존");
    expect(s6.body).toContain("카카오VX");

    const paras = s6.body.split("\n\n");
    const lastPara = paras[paras.length - 1] ?? "";
    expect(lastPara).toContain("낫소 관계자는");
    expect(lastPara).toContain("라고 말했다.");
  });

  it("supports Mode 1 (minimal) preserving original paragraphs, generating 3-version sentence proofread suggestions and company/revenue fact memos", () => {
    const raw = `대한민국 스포츠 브랜드 ㈜낫소가 약 10평 규모의 실내 공간에 설치할 수 있는 이동형 스크린 파크골프 부스를 세계 최초로 선보이며 시장 확대에 나선다고 밝혔다.

이번 부스는 초고속 카메라 센서와 4K 그래픽 엔진을 적용해 생동감 있는 필드를 구현한 것이 특징이다.

낫소 관계자는 "지자체와 복지시설을 중심으로 보급을 확대해 생활체육 저변을 넓히겠다"고 밝혔다.`;

    const s0 = runS0Extract(raw, "㈜낫소");
    const s5 = runS5Sanitize(s0.normalizedText);
    const s6Minimal = runS6WriteArticle("minimal", s0, s5, {}, []);
    const s7Minimal = runS7StyleEdit(s6Minimal);

    expect(s6Minimal.mode).toBe("minimal");
    expect(s7Minimal.body).toBe(s6Minimal.body);
    // Original paragraph order is preserved in Mode 1
    const minimalParas = s6Minimal.body.split("\n\n");
    expect(minimalParas.length).toBe(3);
    expect(minimalParas[0]).toContain("이동형 스크린 파크골프 부스");
    expect(minimalParas[1]).toContain("초고속 카메라 센서");
    expect(minimalParas[2]).toContain("낫소 관계자는");

    // Sentence proofread suggestions (red-line targets with 3 alternatives each)
    expect(s6Minimal.sentenceSuggestions).toBeDefined();
    expect(s6Minimal.sentenceSuggestions!.length).toBeGreaterThanOrEqual(2);
    for (const sug of s6Minimal.sentenceSuggestions!) {
      expect(sug.alternatives.length).toBe(3);
      expect(sug.selectedAlternativeId).toBeNull();
    }

    // Company fact memos (including company profile & revenue)
    expect(s6Minimal.factMemos).toBeDefined();
    expect(s6Minimal.factMemos!.length).toBeGreaterThanOrEqual(4);
    const categories = s6Minimal.factMemos!.map((m) => m.category);
    expect(categories).toContain("기업 기본 정보");
    expect(categories).toContain("매출액·실적 정보");

    // Raw note converter for fact notepad
    const converted = convertRawNoteToMkStyleSentence(
      "2025년 연 매출액 480억 원을 기록했습니다",
      "㈜낫소"
    );
    expect(converted).toContain("480억 원");
    expect(converted.endsWith("했다.")).toBe(true);
  });

  it("supports Mode 2 (rewrite) reordering middle paragraphs and expanding article body", () => {
    const raw = `국민대학교 기후변화대응사업단은 오는 11월 12일 서울 성북구 본부관에서 글로벌 산학협력 포럼을 개최한다고 밝혔다.

이번 포럼은 대학생과 청년 연구자들에게 탄소중립 정책 수립 및 ESG 경영 실무 역량을 교육하기 위해 마련됐다.

행사에서는 국내 주요 기후테크 기업 및 연구기관 전문가들이 참여해 탄소배출권 거래제도와 순환경제 비즈니스 모델에 관한 주제 발표를 진행한다.

국민대 관계자는 "인문사회와 이공계를 아우르는 융합형 교육과정을 통해 실무형 그린 인재를 양성하겠다"고 말했다.`;

    const s0 = runS0Extract(raw, "국민대학교");
    const s5 = runS5Sanitize(s0.normalizedText);
    const s6Rewrite = runS6WriteArticle("rewrite", s0, s5, {}, []);

    expect(s6Rewrite.mode).toBe("rewrite");
    expect(s6Rewrite.body.length).toBeGreaterThan(raw.length);
    const rewriteParas = s6Rewrite.body.split("\n\n");
    expect(rewriteParas.length).toBeGreaterThanOrEqual(4);
  });
});
