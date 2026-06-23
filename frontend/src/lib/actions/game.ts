"use server";

import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

export type CreateGameInput = {
  name: string;
  size: number;
};

export type CreateGameResult = { ok: true } | { ok: false; error: string };

// ゲーム作成の Server Action。
// サーバー側で access_token Cookie を backend に転送して POST する。
export async function createGame(
  input: CreateGameInput,
): Promise<CreateGameResult> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    return { ok: false, error: "認証が必要です" };
  }

  try {
    const res = await fetch(`${API_BASE}/games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `access_token=${token}`,
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.error ?? "ゲームの作成に失敗しました" };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "サーバーに接続できませんでした" };
  }
}
