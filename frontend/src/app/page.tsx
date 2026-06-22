export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Memory Game
      </h1>
      <p className="text-balance text-base text-black/60 dark:text-white/60">
        ログイン済み。ゲーム本体はこれから実装します。
      </p>
      <button
        type="button"
        disabled
        className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background opacity-50"
      >
        ゲームを始める（準備中）
      </button>
    </main>
  );
}
