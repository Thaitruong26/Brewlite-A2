"use client";

import Image from "next/image";
import { useState } from "react";

export const FALLBACK_PRODUCT_IMAGE = "/img/ca-phe-sua.jpg";

export function ProductImage({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const imageSrc = !failed && src ? src : FALLBACK_PRODUCT_IMAGE;
  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={360}
      height={270}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      unoptimized
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
