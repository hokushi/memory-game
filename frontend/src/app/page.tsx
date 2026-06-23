"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

type Account = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export default function Home() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/account/me`, {
          credentials: "include",
        });
        if (!res.ok) {
          // 未ログイン → ログイン画面へ
          router.replace("/login");
          return;
        }
        const data = await res.json();
        setAccount(data.account);
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 text-sm text-black/50 dark:text-white/50">
        読み込み中…
      </main>
    );
  }

  // リダイレクト中
  if (!account) return null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Memory Game
      </h1>
      <p className="text-balance text-base text-black/60 dark:text-white/60">
        ようこそ {account.name} さん。ゲーム本体はこれから実装します。
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
