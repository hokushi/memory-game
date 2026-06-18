export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Memory Game
        </h1>
        <p className="text-balance text-base text-black/60 dark:text-white/60">
          神経衰弱。めくった 2 枚が揃えばペア成立、全ペアを揃えるとクリア。
        </p>
      </div>

      <button
        type="button"
        disabled
        className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background opacity-50"
      >
        ゲームを始める（準備中）
      </button>

      <p className="text-xs text-black/40 dark:text-white/40">
        フロント基盤セットアップ済み — ゲーム本体はこれから実装します。
      </p>
    </main>
  );
}
