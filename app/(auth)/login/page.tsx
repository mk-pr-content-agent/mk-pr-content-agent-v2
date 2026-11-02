"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        setError(data.error ?? "이메일 또는 비밀번호가 올바르지 않습니다.");
        setLoading(false);
        return;
      }

      router.push("/jobs");
      router.refresh();
    } catch {
      setError("서버와 통신할 수 없습니다. 잠시 후 다시 시도해 주십시오.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-subtle p-6">
      <Card className="w-[400px] p-0 overflow-hidden">
        <div className="bg-surface-subtle px-6 py-4 border-b-hairline border-line">
          <h1 className="text-[20px] leading-[28px] font-semibold text-ink">
            매경 PR사업팀 콘텐츠 작성 에이전트
          </h1>
          <p className="mt-1 text-[12px] leading-[18px] text-ink-muted">
            사내 계정으로 로그인해 주십시오.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border-hairline border-reject bg-reject-bg px-3 py-2 text-[12px] leading-[18px] text-reject"
            >
              <XCircle className="h-4 w-4 shrink-0 mt-0.5 stroke-[1.5]" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@mk.co.kr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
