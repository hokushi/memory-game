"use client";

import { useState } from "react";
import Link from "next/link";

export type BoardCard = {
  position: number;
  matched: boolean;
  pairKey: number | null;
};

export type BoardView = {
  size: number;
  completed: boolean;
  pendingFlipPosition: number | null;
  cards: BoardCard[];
};

type FlipResponse =
  | { status: "pending"; position: number; pairKey: number }
  | { status: "mismatch"; positions: [number, number]; pairKeys: [number, number] }
  | {
      status: "matched";
      positions: [number, number];
      pairKey: number;
      completed: boolean;
    };

type RestartResponse = { board: BoardView };

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

// 写真アップロード未実装のため、pairKey ごとに色を割り当てて見分けられるようにする
const PAIR_COLORS = [
  "bg-red-200 dark:bg-red-900",
  "bg-orange-200 dark:bg-orange-900",
  "bg-amber-200 dark:bg-amber-900",
  "bg-lime-200 dark:bg-lime-900",
  "bg-emerald-200 dark:bg-emerald-900",
  "bg-cyan-200 dark:bg-cyan-900",
  "bg-blue-200 dark:bg-blue-900",
  "bg-violet-200 dark:bg-violet-900",
  "bg-fuchsia-200 dark:bg-fuchsia-900",
  "bg-pink-200 dark:bg-pink-900",
  "bg-rose-200 dark:bg-rose-900",
  "bg-teal-200 dark:bg-teal-900",
  "bg-sky-200 dark:bg-sky-900",
  "bg-indigo-200 dark:bg-indigo-900",
  "bg-yellow-200 dark:bg-yellow-900",
  "bg-stone-300 dark:bg-stone-700",
  "bg-slate-300 dark:bg-slate-700",
  "bg-gray-300 dark:bg-gray-700",
  "bg-zinc-300 dark:bg-zinc-700",
  "bg-neutral-300 dark:bg-neutral-700",
  "bg-green-200 dark:bg-green-900",
  "bg-purple-200 dark:bg-purple-900",
  "bg-red-300 dark:bg-red-800",
  "bg-blue-300 dark:bg-blue-800",
  "bg-lime-300 dark:bg-lime-800",
  "bg-amber-300 dark:bg-amber-800",
  "bg-cyan-300 dark:bg-cyan-800",
  "bg-violet-300 dark:bg-violet-800",
  "bg-pink-300 dark:bg-pink-800",
  "bg-teal-300 dark:bg-teal-800",
  "bg-emerald-300 dark:bg-emerald-800",
  "bg-orange-300 dark:bg-orange-800",
];

export function GameBoard({
  gameId,
  initialBoard,
}: {
  gameId: string;
  initialBoard: BoardView;
}) {
  const [cards, setCards] = useState<BoardCard[]>(initialBoard.cards);
  const [completed, setCompleted] = useState(initialBoard.completed);
  // リクエスト中・不一致を見せている間はカードを押せないようにする
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFlip = async (position: number) => {
    const card = cards.find((c) => c.position === position);
    if (!card || card.matched || card.pairKey !== null || locked || completed) {
      return;
    }

    setLocked(true);
    setError(null);

    const res = await fetch(`${API_BASE}/games/${gameId}/flip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ position }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "操作に失敗しました");
      setLocked(false);
      return;
    }

    const result = (await res.json()) as FlipResponse;

    if (result.status === "pending") {
      setCards((prev) =>
        prev.map((c) =>
          c.position === result.position ? { ...c, pairKey: result.pairKey } : c,
        ),
      );
      setLocked(false);
      return;
    }

    if (result.status === "matched") {
      setCards((prev) =>
        prev.map((c) =>
          result.positions.includes(c.position)
            ? { ...c, matched: true, pairKey: result.pairKey }
            : c,
        ),
      );
      setCompleted(result.completed);
      setLocked(false);
      return;
    }

    // mismatch: 一瞬だけ2枚とも見せてから伏せ直す
    const [posA, posB] = result.positions;
    const [keyA, keyB] = result.pairKeys;
    setCards((prev) =>
      prev.map((c) =>
        c.position === posA
          ? { ...c, pairKey: keyA }
          : c.position === posB
            ? { ...c, pairKey: keyB }
            : c,
      ),
    );

    setTimeout(() => {
      setCards((prev) =>
        prev.map((c) =>
          (c.position === posA || c.position === posB) && !c.matched
            ? { ...c, pairKey: null }
            : c,
        ),
      );
      setLocked(false);
    }, 800);
  };

  const handleRestart = async () => {
    // 進行中の場合は誤操作で消さないよう確認する
    if (!completed && !window.confirm("最初からやり直しますか？ 現在の進行状況は失われます。")) {
      return;
    }

    setLocked(true);
    setError(null);

    const res = await fetch(`${API_BASE}/games/${gameId}/restart`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "やり直しに失敗しました");
      setLocked(false);
      return;
    }

    const { board } = (await res.json()) as RestartResponse;
    setCards(board.cards);
    setCompleted(board.completed);
    setLocked(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-md items-center justify-center gap-3">
        <Link
          href="/"
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-opacity hover:opacity-90 ${
            completed
              ? "bg-foreground text-background"
              : "border border-black/15 dark:border-white/20"
          }`}
        >
          {completed ? "ホームに戻る" : "中断してホームに戻る"}
        </Link>
        <button
          type="button"
          onClick={handleRestart}
          disabled={locked}
          className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/[.06]"
        >
          やり直す
        </button>
      </div>

      {completed && (
        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
          クリア！🎉
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${initialBoard.size}, minmax(0, 1fr))` }}
      >
        {cards.map((card) => {
          const faceUp = card.pairKey !== null;
          return (
            <button
              key={card.position}
              type="button"
              disabled={card.matched || locked || completed}
              onClick={() => handleFlip(card.position)}
              className={`flex aspect-square w-14 items-center justify-center rounded-lg border text-sm font-semibold transition-colors sm:w-20 ${
                card.matched
                  ? "border-emerald-500/50 opacity-50"
                  : "border-black/15 dark:border-white/20"
              } ${
                faceUp
                  ? (PAIR_COLORS[card.pairKey! % PAIR_COLORS.length] ?? "")
                  : "bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
              }`}
            >
              {faceUp ? card.pairKey : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
