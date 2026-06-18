import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Memory Game
        </h1>
        <p className="text-balance text-base text-black/60 dark:text-white/60">
          アカウントを作成してゲームを始めましょう。
        </p>
      </div>

      <SignupForm />
    </main>
  );
}
