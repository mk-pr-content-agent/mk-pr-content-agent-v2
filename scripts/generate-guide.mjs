import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.resolve("public/guide");
const IMG_DIR = path.join(OUT_DIR, "images");

fs.mkdirSync(IMG_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve);
      this.ws.addEventListener("error", reject);
    });
    this.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data.toString());
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function capturePng(cdp, filename, clip = null) {
  const params = { format: "png", captureBeyondViewport: false };
  if (clip) {
    params.clip = { ...clip, scale: 1 };
  }
  const { data } = await cdp.send("Page.captureScreenshot", params);
  const filePath = path.join(IMG_DIR, filename);
  fs.writeFileSync(filePath, Buffer.from(data, "base64"));
  console.log("Captured:", filePath);
}

async function evalJs(cdp, expression) {
  const res = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return res?.result?.value;
}

async function main() {
  const userDataDir = path.resolve(".tmp-chrome-guide");
  fs.mkdirSync(userDataDir, { recursive: true });

  const chrome = spawn(
    CHROME_PATH,
    [
      "--headless=new",
      "--remote-debugging-port=9233",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=${userDataDir}`,
      "--window-size=1600,1000",
    ],
    { stdio: "ignore" }
  );

  try {
    let versionInfo = null;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch("http://127.0.0.1:9233/json/list");
        const targets = await res.json();
        versionInfo = targets.find((t) => t.type === "page");
        if (versionInfo) break;
      } catch {
        // wait
      }
      await sleep(500);
    }

    if (!versionInfo) {
      throw new Error("Failed to connect to headless Chrome on 9233");
    }

    const cdp = new CDPClient(versionInfo.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1600,
      height: 1000,
      deviceScaleFactor: 1.5,
      mobile: false,
    });

    // 1. 홈 화면 (작업 목록 대시보드)
    await cdp.send("Page.navigate", { url: `${BASE_URL}/jobs` });
    await sleep(2500);
    await capturePng(cdp, "01-home-dashboard.png");

    // 2. API 키 설정 · 토큰 내역 모달 열기
    await evalJs(
      cdp,
      `(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const apiBtn = btns.find(b => b.textContent && b.textContent.includes("API 키 설정"));
        if (apiBtn) apiBtn.click();
      })()`
    );
    await sleep(800);
    await capturePng(cdp, "02-api-modal.png");

    // 3. 새 보도자료 작업 생성 페이지 (/jobs/new) - 상단
    await cdp.send("Page.navigate", { url: `${BASE_URL}/jobs/new` });
    await sleep(2000);
    await evalJs(
      cdp,
      `(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const sampleBtn = btns.find(b => b.textContent && b.textContent.includes("예시 3"));
        if (sampleBtn) sampleBtn.click();
        window.scrollTo(0, 0);
      })()`
    );
    await sleep(600);
    await capturePng(cdp, "03-new-job-top.png");

    // 4. 새 보도자료 작업 생성 페이지 (/jobs/new) - 하단 옵션 및 실행 버튼
    await evalJs(cdp, `window.scrollTo(0, 520)`);
    await sleep(500);
    await capturePng(cdp, "04-new-job-options.png");

    // 5. 기사 초안 작성·검수 페이지 (/jobs/458e4a3a-fe1c-40b6-95a9-78e8cb97de5e - ㈜낫소 비교·기획 모드)
    const jobUrl = `${BASE_URL}/jobs/458e4a3a-fe1c-40b6-95a9-78e8cb97de5e`;
    await cdp.send("Page.navigate", { url: jobUrl });
    await sleep(2800);
    await evalJs(cdp, `window.scrollTo(0, 0)`);
    await sleep(400);
    await capturePng(cdp, "05-workbench-overview.png");

    // 6. 본문 문단별 블록 에디터 + 인라인 교열 하이라이트 + 비교·기획 문단 배지
    await evalJs(cdp, `window.scrollTo(0, 620)`);
    await sleep(500);
    await capturePng(cdp, "06-body-paragraphs.png");

    // 7. 원문과 나란히 비교 보기 화면
    await evalJs(
      cdp,
      `(() => {
        window.scrollTo(0, 380);
        const btns = Array.from(document.querySelectorAll("button"));
        const sideBtn = btns.find(b => b.textContent && b.textContent.includes("원문과 나란히 비교 보기"));
        if (sideBtn) sideBtn.click();
      })()`
    );
    await sleep(600);
    await capturePng(cdp, "07-side-by-side.png");

    // 다시 단일 편집기로 복귀
    await evalJs(
      cdp,
      `(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const sideBtn = btns.find(b => b.textContent && b.textContent.includes("단일 편집기로 보기"));
        if (sideBtn) sideBtn.click();
      })()`
    );
    await sleep(400);

    // 8. 우측 탭: 증빙·팩트 탭
    await evalJs(
      cdp,
      `(() => {
        window.scrollTo(0, 0);
        const btns = Array.from(document.querySelectorAll("button"));
        const claimTab = btns.find(b => b.textContent && b.textContent.includes("증빙·팩트("));
        if (claimTab) claimTab.click();
      })()`
    );
    await sleep(500);
    await capturePng(cdp, "08-right-claims-tab.png");

    // 9. 우측 탭: 출처 탭
    await evalJs(
      cdp,
      `(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const srcTab = btns.find(b => b.textContent && b.textContent.includes("출처("));
        if (srcTab) srcTab.click();
      })()`
    );
    await sleep(500);
    await capturePng(cdp, "09-right-sources-tab.png");

    // 10. 하단 사진 캡션 + S10 승인 체크리스트 + CMS 복사 버튼 영역
    await evalJs(
      cdp,
      `(() => {
        window.scrollTo(0, document.body.scrollHeight);
      })()`
    );
    await sleep(600);
    await capturePng(cdp, "10-approval-cms-copy.png");

    cdp.close();
  } finally {
    chrome.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
