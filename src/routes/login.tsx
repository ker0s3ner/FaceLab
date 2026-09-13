import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex" }],
  }),
  beforeLoad: () => {
    const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const source = sp?.get("source");
    const qs = source ? `?source=${encodeURIComponent(source)}` : "";
    throw redirect({ to: `/auth${qs}` as any });
  },
});
