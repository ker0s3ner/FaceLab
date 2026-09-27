import type { SyntheticEvent } from "react";

/** Image that degrades to a labeled placeholder when the photo is missing
 * (e.g. quota-slimmed legacy scans) instead of a broken-image icon. */
export function SafeImg({
  src,
  alt,
  className = "",
  label = "No photo — rescan",
  onLoad,
}: {
  src: string;
  alt: string;
  className?: string;
  label?: string;
  onLoad?: (e: SyntheticEvent<HTMLImageElement>) => void;
}) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center border border-dashed border-zinc-300 bg-zinc-50 text-center dark:border-zinc-700 dark:bg-zinc-800/50 ${className}`}
        title={label}
      >
        <span className="px-1 text-[10px] leading-tight text-zinc-400">○ {label}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onLoad={onLoad} />;
}
