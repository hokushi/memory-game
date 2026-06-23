import { cookies } from "next/headers";

// サーバーコンポーネント専用。
// 受け取ったリクエストの access_token Cookie を backend に転送して GET する。
// 未ログイン・失敗時は null を返す（呼び出し側で握りつぶせる）。

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

export async function serverGet<T>(path: string): Promise<T | null> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { cookie: `access_token=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
