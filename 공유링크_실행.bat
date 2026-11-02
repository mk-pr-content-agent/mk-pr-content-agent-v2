@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================================
echo [매경 PR사업팀 콘텐츠 작성 에이전트] 서버 및 외부 공유 링크(Cloudflare) 실행기
echo ============================================================================
echo.
echo 1. Next.js 프로덕션 서버(포트 3000)를 백그라운드에서 시작합니다...
start "MK-PR-Server" cmd /c "npm run start"
timeout /t 4 /nobreak >nul
echo.
echo 2. 외부 공유용 보안 링크(trycloudflare.com)를 생성합니다...
echo    아래 출력되는 https://xxxx.trycloudflare.com 주소를 복사해 공유하세요!
echo    (창을 닫지 않고 최소화해 두시면 공유 링크가 계속 유지됩니다)
echo.
"C:\Users\user\.gemini\antigravity\brain\27bd5fb7-1bc4-4a5f-9b02-b2b6757f1a70\scratch\cloudflared.exe" tunnel --url http://localhost:3000
pause
