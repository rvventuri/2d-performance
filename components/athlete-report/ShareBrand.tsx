"use client";

import Image from "next/image";
import { APP_NAME } from "@/lib/branding";

export const SHARE_BRAND = {
  name: "2D Performance",
  logoSrc: "/logo2d.jpg",
} as const;

export function ShareBrand({
  size = 28,
  showAppNameFallback = false,
  textClassName,
}: {
  size?: number;
  showAppNameFallback?: boolean;
  textClassName?: string;
}) {
  const name = SHARE_BRAND.name || (showAppNameFallback ? APP_NAME : "");
  return (
    <div className="flex items-center gap-2">
      <Image
        src={SHARE_BRAND.logoSrc}
        alt={name || APP_NAME}
        width={size}
        height={size}
        className="rounded-md"
        priority
      />
      {name ? (
        <span className={textClassName ?? "font-heading font-bold text-sm text-foreground"}>
          {name}
        </span>
      ) : null}
    </div>
  );
}
