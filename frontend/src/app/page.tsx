import { serverGet } from "@/lib/server-api";
import { CreateGameDialog } from "@/components/create-game-dialog";
import { GameImageSlideshow } from "@/components/game-image-slideshow";

type Game = {
  id: number;
  name: string;
  size: number;
  createdAt: string;
};

// TODO: 本来は S3 の画像URL配列をゲームごとに API から受け取る。今はモック。
const MOCK_IMAGES = ["/mock-1.webp", "/mock-2.jpeg", "/mock-3.jpeg"];

export default async function Home() {
  // 未ログインのガードは middleware が担当（ここはログイン済み前提）
  const gamesRes = await serverGet<{ games: Game[] }>("/games");
  const games = gamesRes?.games ?? [];

  return (
    <main className="flex flex-1 flex-col p-8">
      {/* 画面左上: 見出し + 空メッセージ */}
      <div className="flex flex-col items-start gap-1 text-left">
        <h1 className="text-2xl font-bold tracking-tight">ゲーム一覧</h1>
        {games.length === 0 && (
          <p className="text-sm text-black/60 dark:text-white/60">
            まだゲームがありません。「ゲーム作成」から作りましょう。
          </p>
        )}
      </div>

      {/* 一覧と作成ボタン（上寄せで余白を詰める） */}
      <div className="flex flex-1 flex-col items-center justify-start gap-6 pt-4">
        {games.length > 0 && (
          <ul className="grid w-full max-w-7xl grid-cols-3 gap-6">
            {games.map((game) => (
              <li
                key={game.id}
                className="flex flex-col gap-3 rounded-lg border border-black/10 px-4 py-3 dark:border-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{game.name}</span>
                  <span className="text-sm text-black/60 dark:text-white/60">
                    {game.size}×{game.size}
                  </span>
                </div>
                <GameImageSlideshow images={MOCK_IMAGES} />
              </li>
            ))}
          </ul>
        )}
        <CreateGameDialog />
      </div>
    </main>
  );
}
