"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Game } from "@/lib/actions/game";
import { createPhotoUploadUrls, savePhotos } from "@/lib/actions/photo";

type Props = {
  game: Game;
  onClose: () => void;
};

type Selected = {
  file: File;
  url: string;
};

export function PhotoSelectDialog({ game, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  // 選択した写真のリスト
  const [photos, setPhotos] = useState<Selected[]>([]);
  // アップロード中フラグ（二重送信防止 & ボタンの状態表示）
  const [isUploading, setIsUploading] = useState(false);

  // 神経衰弱なのでカードはペア。size×size 枚のカード = (size*size)/2 種類の写真が要る。
  const requiredCount = (game.size * game.size) / 2;
  const isFull = photos.length >= requiredCount;

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    // 必要枚数を超えないよう、残り枚数までで切り捨てる
    const remaining = requiredCount - photos.length;
    const picked = Array.from(files)
      .slice(0, Math.max(0, remaining))
      .map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));
    setPhotos((prev) => [...prev, ...picked]);
    // 同じファイルを選び直せるように value をリセット
    e.target.value = "";
  };

  const handleConfirm = async () => {
    if (isUploading) return;
    setIsUploading(true);

    // 署名時とアップロード時で Content-Type を一致させる必要があるので、
    // ここで一度だけ確定させて両方で使い回す。
    const contentTypes = photos.map(
      (p) => p.file.type || "application/octet-stream",
    );

    try {
      // 1. backend から署名付きアップロード URL を取得
      const presign = await createPhotoUploadUrls(game.id, contentTypes);
      if (!presign.ok) {
        toast.error(presign.error);
        return;
      }

      // 2. 各ファイルを S3 に直接 PUT（バイナリは backend を経由しない）
      await Promise.all(
        presign.uploads.map(async (upload, i) => {
          const res = await fetch(upload.url, {
            method: "PUT",
            headers: { "Content-Type": contentTypes[i] },
            body: photos[i].file,
          });
          if (!res.ok) {
            throw new Error(`S3 へのアップロードに失敗しました (${res.status})`);
          }
        }),
      );

      // 3. アップロード済みのキーを backend に保存
      const keys = presign.uploads.map((u) => u.key);
      const saved = await savePhotos(game.id, keys);
      if (!saved.ok) {
        toast.error(saved.error);
        return;
      }

      toast.success(`${photos.length}枚を保存しました`);
      // 一覧に新しい写真を反映させる
      router.refresh();
      onClose();
    } catch {
      toast.error("写真のアップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="写真を選択"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[80vh] w-full max-w-3xl flex-col gap-5 rounded-2xl border border-black/10 bg-white p-6 text-left shadow-xl dark:border-white/10 dark:bg-zinc-900 sm:p-8"
      >
        {/* ヘッダー */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">写真を選択</h2>
            <p className="text-sm text-black/60 dark:text-white/60">
              {game.name}（{game.size}×{game.size}）・{requiredCount}枚必要
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded-full p-1 text-xl leading-none text-black/50 transition-colors hover:bg-black/[.06] dark:text-white/50 dark:hover:bg-white/[.08]"
          >
            ×
          </button>
        </div>

        {/* 選択した写真のプレビュー領域 */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-black/10 p-4 dark:border-white/10">
          {photos.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-black/40 dark:text-white/40">
              下の「写真選択」から写真を追加してください
            </div>
          ) : (
            <ul className="grid grid-cols-4 gap-3 sm:grid-cols-5">
              {photos.map((photo, i) => (
                <li
                  key={i}
                  className="aspect-square overflow-hidden rounded-lg"
                >
                  {/* blob URL のプレビューなので next/image ではなく img を使う */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={`選択した写真 ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* フッター: 左に枚数、右に「写真選択」「写真確定」 */}
        <div className="flex items-center justify-between">
          <span className="text-xs">
            <span className="text-black/60 dark:text-white/60">
              {photos.length} / {requiredCount} 枚
            </span>
            {isFull && (
              <span className="ml-2 text-red-600 dark:text-red-400">
                これ以上追加できません
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePick}
              className="hidden"
            />
            {/* 写真選択: セカンダリ（枠線）。何度も押して追加する */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isFull}
              className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium transition-colors hover:bg-black/[.04] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/[.06]"
            >
              写真選択
            </button>
            {/* 写真確定: プライマリ（塗り）。必要枚数が揃うまで無効 */}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isFull || isUploading}
              className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? "アップロード中…" : "写真確定"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
