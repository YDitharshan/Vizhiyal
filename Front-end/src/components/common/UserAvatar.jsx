// UserAvatar — shows uploaded photo or first-letter initial fallback
// Props:
//   src       — image URL (string | null | undefined)
//   name      — display name used for the initial and color (string)
//   size      — diameter in px (number, default 32)
//   className — extra Tailwind classes for the outer element (string)
//   imgClass  — extra Tailwind classes added only to the <img> (string)

import { useState } from "react";

// Ten distinct, accessible background colours
const PALETTE = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-cyan-600",
];

function pickColor(name) {
  const code = (name || "?").toUpperCase().charCodeAt(0);
  return PALETTE[code % PALETTE.length];
}

export default function UserAvatar({
  src,
  name = "?",
  size = 32,
  className = "",
  imgClass  = "",
}) {
  const [imgError, setImgError] = useState(false);

  const initial  = (name || "?")[0].toUpperCase();
  const bg       = pickColor(name);
  const fontSize = Math.max(Math.round(size * 0.42), 10);
  const style    = { width: size, height: size, minWidth: size, minHeight: size, fontSize };

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        className={`rounded-full object-cover ${imgClass} ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      style={style}
      className={`rounded-full flex items-center justify-center font-semibold text-white select-none flex-shrink-0 ${bg} ${className}`}
    >
      {initial}
    </div>
  );
}
