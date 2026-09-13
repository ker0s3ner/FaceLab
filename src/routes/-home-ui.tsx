import { type ReactNode } from "react";

export { bylineCredits } from "./-home-assets";

export function CtaButton({
  children,
  href,
  className,
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`
        group inline-flex items-center justify-center gap-2.5 font-medium
        bg-zinc-900 dark:bg-white text-white dark:text-zinc-900
        px-8 py-3.5 rounded-full
        hover:bg-zinc-800 dark:hover:bg-zinc-200
        transition-colors duration-200
        cursor-pointer
        ${className ?? ""}
      `}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
        aria-hidden
      >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </a>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`text-[10px] tracking-[0.28em] uppercase text-zinc-400 dark:text-zinc-500 font-mono ${className ?? ""}`}
    >
      {children}
    </p>
  );
}

export function SectionDivider() {
  return <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-800" aria-hidden />;
}

export function SectionTitle({ eyebrow, title }: { eyebrow?: ReactNode; title: ReactNode }) {
  return (
    <div className="text-center">
      {eyebrow && <div className="flex justify-center mb-3">{eyebrow}</div>}
      <h2 className="brand-display text-3xl md:text-5xl lg:text-6xl tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
    </div>
  );
}

export function SubCopy({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`text-base md:text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed ${className ?? ""}`}
    >
      {children}
    </p>
  );
}

export function ActionRow({ action, note }: { action: ReactNode; note?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-6 mt-12">
      <div className="flex justify-center">{action}</div>
      {note && <p className="text-xs text-zinc-400 dark:text-zinc-500 tracking-wide">{note}</p>}
    </div>
  );
}

export function EvidenceCard({
  eyebrow,
  title,
  body,
  accent = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-2 text-left p-6 sm:p-8 border-x border-zinc-200 dark:border-zinc-800 min-w-0">
      <Eyebrow>{eyebrow}</Eyebrow>
      <p className="brand-display text-2xl sm:text-3xl tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md">{body}</p>
    </div>
  );
}

export function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-center gap-2 text-zinc-400 dark:text-zinc-500 text-xs tracking-widest uppercase font-mono">
      <span className="text-zinc-200 dark:text-zinc-700">{label}</span>
      <span>→</span>
      <span className="text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}
