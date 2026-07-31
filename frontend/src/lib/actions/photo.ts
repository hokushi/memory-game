"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

// 1ファイル分の署名付きアップロード情報
export type PhotoUpload = {
  // ブラウザがこの URL に直接 PUT して S3 にアップロードする
  url: string;
  // アップロード後、savePhotos に渡す S3 オブジェクトキー
  key: string;
};

export type PresignResult =
  | { ok: true; uploads: PhotoUpload[] }
  | { ok: false; error: string };

export type SaveResult = { ok: true } | { ok: false; error: string };

// access_token Cookie を backend に転送する共通ヘルパー。
// 未ログインなら /login へ。
async function authHeaders(): Promise<Record<string, string>> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    redirect("/login");
  }
  return {
    "Content-Type": "application/json",
    cookie: `access_token=${token}`,
  };
}

// 写真アップロード用の署名付き URL を backend に発行してもらう。
// contentTypes は各ファイルの MIME タイプ（"image/png" 等）。
export async function createPhotoUploadUrls(
  gameId: number,
  contentTypes: string[],
): Promise<PresignResult> {
  const headers = await authHeaders();

  try {
    const res = await fetch(`${API_BASE}/games/${gameId}/photos/presign`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        files: contentTypes.map((contentType) => ({ contentType })),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return {
        ok: false,
        error: data?.error ?? "アップロードURLの取得に失敗しました",
      };
    }

    const data = (await res.json()) as { uploads: PhotoUpload[] };
    return { ok: true, uploads: data.uploads };
  } catch {
    return { ok: false, error: "サーバーに接続できませんでした" };
  }
}

// アップロード済みのキーをゲームの写真として保存する。
export async function savePhotos(
  gameId: number,
  keys: string[],
): Promise<SaveResult> {
  const headers = await authHeaders();

  try {
    const res = await fetch(`${API_BASE}/games/${gameId}/photos`, {
      method: "POST",
      headers,
      body: JSON.stringify({ keys }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.error ?? "写真の保存に失敗しました" };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "サーバーに接続できませんでした" };
  }
}
