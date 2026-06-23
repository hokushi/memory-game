"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createGame } from "@/lib/actions/game";

const SIZES = [4, 6, 8] as const;

const createGameSchema = z.object({
  name: z
    .string()
    .min(1, "ゲーム名を入力してください")
    .max(50, "ゲーム名は50文字以内で入力してください"),
  size: z.union([z.literal(4), z.literal(6), z.literal(8)]),
});

type CreateGameValues = z.infer<typeof createGameSchema>;

export function CreateGameDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateGameValues>({
    resolver: zodResolver(createGameSchema),
    defaultValues: { name: "", size: 4 },
  });

  const selectedSize = watch("size");

  const close = () => {
    setOpen(false);
    reset();
  };

  const onSubmit = async (values: CreateGameValues) => {
    const result = await createGame(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("ゲームを作成しました");
    close();
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        ゲーム作成
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ゲーム作成"
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-lg flex-col gap-5 rounded-2xl border border-black/10 bg-white p-6 text-left shadow-xl dark:border-white/10 dark:bg-zinc-900 sm:p-8"
          >
            <h2 className="text-lg font-semibold">ゲーム作成</h2>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="flex flex-col gap-5"
            >
              {/* ゲーム名 */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="game-name" className="text-sm font-medium">
                  ゲーム名
                </label>
                <input
                  id="game-name"
                  type="text"
                  autoComplete="off"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                  className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-white/20"
                />
                {errors.name && (
                  <p
                    role="alert"
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* ボードサイズ */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">ボードサイズ</span>
                <div className="grid grid-cols-3 gap-2">
                  {SIZES.map((n) => {
                    const active = selectedSize === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setValue("size", n, { shouldValidate: true })
                        }
                        aria-pressed={active}
                        className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                          active
                            ? "border-foreground bg-foreground text-background"
                            : "border-black/15 hover:bg-black/[.04] dark:border-white/20 dark:hover:bg-white/[.06]"
                        }`}
                      >
                        {n}×{n}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/20 dark:hover:bg-white/[.06]"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
