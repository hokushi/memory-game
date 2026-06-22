"use client";

import { useState } from "react";
import Link from "next/link";
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

export function SignupForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", passwordConfirm: "" },
  });

  const onSubmit = async (values: SignupFormValues) => {
    // TODO: バックエンド（Fastify）の登録 API ができたら差し替える
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSubmittedEmail(values.email);
  };

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

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? "作成中…" : "アカウントを作成"}
      </button>

      {submittedEmail && (
        <p
          role="status"
          className="text-center text-xs text-green-600 dark:text-green-400"
        >
          {submittedEmail} でアカウントを作成しました（仮）
        </p>
      )}

      <p className="text-center text-xs text-black/60 dark:text-white/60">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="font-medium underline underline-offset-2">
          ログイン
        </Link>
      </p>
    </form>
  );
}
