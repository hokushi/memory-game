import Link from "next/link";
import { notFound } from "next/navigation";
import { serverGet } from "@/lib/server-api";
import { MemoryBoard } from "@/components/memory-board";

type Game = {
  id: number;
  name: string;
  size: number;
  createdAt: string;
  photoUrls: string[];
};

export default async function PlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await serverGet<{ game: Game }>(`/games/${id}`);
  // 存在しない・他人のゲーム・未ログインなどは 404 扱い
  if (!res?.game) notFound();

  const game = res.game;
  // 神経衰弱はペアなので必要な種類数 = マス数 / 2
  const requiredCount = (game.size * game.size) / 2;
  const photos = game.photoUrls.slice(0, requiredCount);
  const playable = photos.length === requiredCount;

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">{game.name}</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {game.size}×{game.size}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium transition-colors hover:bg-black/[.04] dark:border-white/20 dark:hover:bg-white/[.06]"
        >
          一覧へ戻る
        </Link>
      </div>

      {playable ? (
        <MemoryBoard
          gameName={game.name}
          size={game.size}
          photoUrls={photos}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-black/60 dark:text-white/60">
            写真が足りないため、まだプレイできません（{requiredCount}枚必要）。
          </p>
          <Link
            href="/"
            className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            一覧で写真を追加する
          </Link>
        </div>
      )}
    </main>
  );
}
