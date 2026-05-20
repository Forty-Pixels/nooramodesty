"use client";

import Image from "next/image";
import { StringInputProps } from "sanity";

function isImageUrl(url: string) {
  return /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url);
}

export function PaymentSlipPreview(props: StringInputProps) {
  const url = typeof props.value === "string" ? props.value : "";

  if (!url) {
    return <input readOnly value="No payment slip uploaded" style={{ width: "100%", padding: 8 }} />;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {isImageUrl(url) ? (
        <div style={{ position: "relative", width: "100%", maxWidth: 420, aspectRatio: "4 / 3", border: "1px solid #ddd" }}>
          <Image src={url} alt="Payment slip" fill style={{ objectFit: "contain" }} sizes="420px" />
        </div>
      ) : (
        <a href={url} target="_blank" rel="noreferrer">
          Open payment slip
        </a>
      )}
      <input readOnly value={url} style={{ width: "100%", padding: 8 }} />
    </div>
  );
}
