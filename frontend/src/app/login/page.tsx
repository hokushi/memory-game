import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Memory Game
        </h1>
        <p className="text-balance text-base text-black/60 dark:text-white/60">
          神経衰弱。ログインしてゲームを始めましょう。
        </p>
      </div>

      <LoginForm />
    </main>
  );
}
