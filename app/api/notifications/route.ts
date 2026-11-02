import { desc, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const items = db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.created_at))
    .all();

  return NextResponse.json({ notifications: items });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string };
  if (body.id) {
    db.update(notifications)
      .set({ read_at: new Date().toISOString() })
      .where(eq(notifications.id, body.id))
      .run();
  }

  return NextResponse.json({ ok: true });
}
