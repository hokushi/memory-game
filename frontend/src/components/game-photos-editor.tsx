"use client";

import { useState } from "react";
import { PhotoSelectDialog } from "./photo-select-dialog";

type Props = {
  game: {
    id: number;
    name: string;
    size: number;
    createdAt: string;
    photoUrls: string[];
  };
};

// ゲームカードに置く「写真を追加」ボタン。
// 写真がまだ無いゲームにだけ表示する（保存はまるごと入れ替えなので
// 既に写真があるゲームの「変更」導線は今は出さない）。
export function GamePhotosEditor({ game }: Props) {
  const [open, setOpen] = useState(false);

  // 既に写真があるゲームには何も出さない
  if (game.photoUrls.length > 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium transition-colors hover:bg-black/[.04] dark:border-white/20 dark:hover:bg-white/[.06]"
      >
        写真を追加
      </button>

      {open && (
        <PhotoSelectDialog game={game} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
