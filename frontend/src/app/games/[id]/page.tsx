import { notFound } from "next/navigation";
import { serverGet } from "@/lib/server-api";
import { GameBoard, type BoardView } from "@/components/game-board";

export default async function GamePlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await serverGet<{ board: BoardView }>(`/games/${id}/board`);
  if (!res) {
    notFound();
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8">
      <h1 className="text-2xl font-bold tracking-tight">
        {res.board.size}×{res.board.size} 神経衰弱
      </h1>
      <GameBoard gameId={id} initialBoard={res.board} />
    </main>
  );
}
