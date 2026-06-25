"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SWITCH_INTERVAL_MS = 3000;

export function GameImageSlideshow({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, SWITCH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-64 w-full overflow-hidden rounded-md bg-black/5 dark:bg-white/5">
        <Image
          key={images[index]}
          src={images[index]}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 28rem"
          className="object-cover"
        />
      </div>

      {/* どの画像かを示すドット */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {images.map((src, i) => (
            <span
              key={src}
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === index
                  ? "bg-foreground"
                  : "bg-black/20 dark:bg-white/20"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
