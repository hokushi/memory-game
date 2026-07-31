import Link from "next/link";
import { serverGet } from "@/lib/server-api";

type Account = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export async function Header() {
  const [me] = await Promise.all([
    serverGet<{ account: Account }>("/account/me"),
  ]);

  const account = me?.account ?? null;

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-black/10 bg-background px-6 py-3 dark:border-white/10">
      <Link href="/" className="text-sm font-semibold">
        Memory Game
      </Link>
      {account && (
        <span className="text-sm text-black/70 dark:text-white/70">
          {account.name}
        </span>
      )}
    </header>
  );
}
