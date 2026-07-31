"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  gameName: string;
  size: number;
  // 種類ぶんの写真URL（枚数 = size*size/2）。各URLがペアの片方になる。
  photoUrls: string[];
};

type Card = {
  // React の key 兼カード識別子（山ごとに一意）
  key: number;
  // ペア識別子。同じ pairId の2枚が対になる。
  pairId: number;
  url: string;
};

// 写真URLから「1種類につき2枚」のカードの山を作ってシャッフルする。
function buildDeck(photoUrls: string[]): Card[] {
  const deck: Card[] = [];
  photoUrls.forEach((url, pairId) => {
    deck.push({ key: pairId * 2, pairId, url });
    deck.push({ key: pairId * 2 + 1, pairId, url });
  });

  // Fisher–Yates でシャッフル
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function MemoryBoard({ gameName, size, photoUrls }: Props) {
  const [deck, setDeck] = useState<Card[]>(() => buildDeck(photoUrls));
  // めくって表向きだが、まだ揃っていないカードの位置（最大2枚）
  const [flipped, setFlipped] = useState<number[]>([]);
  // 揃ったペアの pairId 集合
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  // 2枚判定中の入力ロック
  const [locked, setLocked] = useState(false);

  const totalPairs = photoUrls.length;
  const isCleared = matched.size === totalPairs;

  const handleFlip = (index: number) => {
    if (locked) return;
    if (flipped.length >= 2) return;
    if (flipped.includes(index)) return;
    if (matched.has(deck[index].pairId)) return;

    // 1枚目：めくるだけ
    if (flipped.length === 0) {
      setFlipped([index]);
      return;
    }

    // 2枚目：1手カウントして、入力をロックしつつ一致判定する
    const first = flipped[0];
    setFlipped([first, index]);
    setMoves((m) => m + 1);
    setLocked(true);

    if (deck[first].pairId === deck[index].pairId) {
      // 一致：少し見せてから「揃った」状態にする
      setTimeout(() => {
        setMatched((prev) => new Set(prev).add(deck[first].pairId));
        setFlipped([]);
        setLocked(false);
      }, 500);
    } else {
      // 不一致：少し見せてから伏せる
      setTimeout(() => {
        setFlipped([]);
        setLocked(false);
      }, 900);
    }
  };

  const restart = () => {
    setDeck(buildDeck(photoUrls));
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setLocked(false);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* ステータスバー */}
      <div className="flex w-full max-w-xl items-center justify-between text-sm">
        <span className="text-black/60 dark:text-white/60">
          {matched.size} / {totalPairs} ペア・{moves} 手
        </span>
        <button
          type="button"
          onClick={restart}
          className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium transition-colors hover:bg-black/[.04] dark:border-white/20 dark:hover:bg-white/[.06]"
        >
          リスタート
        </button>
      </div>

      {/* クリア表示 */}
      {isCleared && (
        <div className="w-full max-w-xl rounded-lg bg-green-100 px-4 py-3 text-center text-sm font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
          🎉 クリア！{moves} 手でそろえました
        </div>
      )}

      {/* 盤面 */}
      <div
        className="grid w-full max-w-xl gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {deck.map((card, i) => {
          const isMatched = matched.has(card.pairId);
          const isUp = isMatched || flipped.includes(i);

          return (
            <button
              key={card.key}
              type="button"
              onClick={() => handleFlip(i)}
              disabled={isUp || locked}
              aria-label={isUp ? `カード ${card.pairId + 1}` : "伏せたカード"}
              className={`relative aspect-square overflow-hidden rounded-lg border transition-all ${
                isUp
                  ? "border-black/10 dark:border-white/10"
                  : "cursor-pointer border-transparent bg-foreground/90 hover:bg-foreground"
              } ${isMatched ? "ring-2 ring-green-500" : ""}`}
            >
              {isUp ? (
                <Image
                  src={card.url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 25vw, 150px"
                  className={`object-cover ${isMatched ? "opacity-70" : ""}`}
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-background">
                  ?
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-black/40 dark:text-white/40">{gameName}</p>
    </div>
  );
}
