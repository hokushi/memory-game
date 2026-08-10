"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const signupSchema = z
  .object({
    name: z
      .string()
      .min(1, "アカウント名を入力してください")
      .max(50, "アカウント名は50文字以内で入力してください"),
    email: z
      .string()
      .min(1, "メールアドレスを入力してください")
      .email("メールアドレスの形式が正しくありません"),
    password: z.string().min(8, "パスワードは8文字以上で入力してください"),
    passwordConfirm: z.string().min(1, "確認用パスワードを入力してください"),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    message: "パスワードが一致しません",
    path: ["passwordConfirm"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

// 確認コードは Cognito が発行する 6 桁の数字。
const confirmSchema = z.object({
  code: z
    .string()
    .min(1, "確認コードを入力してください")
    .regex(/^[0-9]{6}$/, "確認コードは6桁の数字です"),
});

type ConfirmFormValues = z.infer<typeof confirmSchema>;

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  // 確認コードの送信先。null でない = 作成が済み、確認待ちの状態。
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", passwordConfirm: "" },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setServerError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        // メール重複は該当フィールドにエラー表示
        if (res.status === 409) {
          setError("email", {
            message: data?.error ?? "このメールアドレスは既に登録されています",
          });
          return;
        }
        if (res.status === 400) {
          setError("password", {
            message: data?.error ?? "パスワードが要件を満たしていません",
          });
          return;
        }
        setServerError(data?.error ?? "登録に失敗しました");
        return;
      }

      const data = (await res.json()) as { confirmationRequired?: boolean };

      // 確認コードの入力が必要なら、そのまま案内を出す。
      // ここでログイン画面へ送っても、未確認のうちはログインできない。
      if (data.confirmationRequired) {
        setPendingEmail(values.email);
        return;
      }

      router.push("/login");
    } catch {
      setServerError("サーバーに接続できませんでした");
    }
  };

  if (pendingEmail) {
    return <ConfirmationNotice email={pendingEmail} />;
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-black/10 bg-white/80 p-6 text-left shadow-xl ring-1 ring-black/5 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:ring-white/5 sm:p-8"
    >
      <h2 className="text-lg font-semibold">アカウント作成</h2>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          アカウント名
        </label>
        <input
          id="name"
          type="text"
          autoComplete="username"
          aria-invalid={!!errors.name}
          {...register("name")}
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20"
        />
        {errors.name && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          メールアドレス
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20"
        />
        {errors.email && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          パスワード
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register("password")}
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20"
        />
        {errors.password && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="passwordConfirm" className="text-sm font-medium">
          パスワード（確認）
        </label>
        <input
          id="passwordConfirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.passwordConfirm}
          {...register("passwordConfirm")}
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20"
        />
        {errors.passwordConfirm && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {errors.passwordConfirm.message}
          </p>
        )}
      </div>

      {serverError && (
        <p
          role="alert"
          className="text-center text-xs text-red-600 dark:text-red-400"
        >
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? "作成中…" : "アカウントを作成"}
      </button>

      <p className="text-center text-xs text-black/60 dark:text-white/60">
        すでにアカウントをお持ちの方は{" "}
        <Link
          href="/login"
          className="font-medium underline underline-offset-2"
        >
          ログイン
        </Link>
      </p>
    </form>
  );
}

// アカウント作成後、確認コードを入力してもらう画面。
// この時点ではアカウントは未確認（UNCONFIRMED）で、まだログインできない。
function ConfirmationNotice({ email }: { email: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmFormValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { code: "" },
  });

  const onSubmit = async (values: ConfirmFormValues) => {
    setServerError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: values.code }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        // コード違い(400) と 期限切れ(410) はコード欄に出す
        if (res.status === 400 || res.status === 410) {
          setError("code", {
            message: data?.error ?? "確認コードが正しくありません",
          });
          return;
        }
        // 既に確認済み(409) はエラーではなく完了として扱う
        if (res.status === 409) {
          setConfirmed(true);
          return;
        }
        setServerError(data?.error ?? "確認に失敗しました");
        return;
      }

      setConfirmed(true);
    } catch {
      setServerError("サーバーに接続できませんでした");
    }
  };

  if (confirmed) {
    return (
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-black/10 bg-white/80 p-6 text-left shadow-xl ring-1 ring-black/5 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:ring-white/5 sm:p-8">
        <h2 className="text-lg font-semibold">登録が完了しました</h2>
        <p className="text-sm text-black/70 dark:text-white/70">
          アカウントが有効になりました。ログインしてゲームを始めましょう。
        </p>
        <Link
          href="/login"
          className="rounded-full bg-foreground px-6 py-3 text-center text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          ログインへ
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-black/10 bg-white/80 p-6 text-left shadow-xl ring-1 ring-black/5 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:ring-white/5 sm:p-8"
    >
      <h2 className="text-lg font-semibold">確認コードを入力</h2>

      <p className="text-sm text-black/70 dark:text-white/70">
        <span className="font-medium break-all">{email}</span>{" "}
        宛に6桁の確認コードを送りました。
      </p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="code" className="text-sm font-medium">
          確認コード
        </label>
        <input
          id="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          aria-invalid={!!errors.code}
          {...register("code")}
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-center text-lg tracking-[0.4em] outline-none focus:border-foreground dark:border-white/20"
        />
        {errors.code && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {errors.code.message}
          </p>
        )}
      </div>

      {serverError && (
        <p
          role="alert"
          className="text-center text-xs text-red-600 dark:text-red-400"
        >
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? "確認中…" : "登録を完了する"}
      </button>

      <p className="text-xs text-black/60 dark:text-white/60">
        コードを入力するまでアカウントは有効になりません。メールが見つからない場合は迷惑メールフォルダもご確認ください。
      </p>
    </form>
  );
}
