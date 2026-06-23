"use client";

import { useOrderSession } from "@/context/OrderSessionContext";

function pad(n: number) { return n.toString().padStart(2, "0"); }

export default function SessionTimerBadge() {
  const { status, secondsRemaining } = useOrderSession();

  if (status !== "active" && status !== "expiry_warning") return null;

  const mins     = Math.floor(secondsRemaining / 60);
  const secs     = secondsRemaining % 60;
  const isUrgent = secondsRemaining < 60;
  const isWarn   = secondsRemaining < 5 * 60;

  const color = isUrgent ? "#DC2626" : isWarn ? "#D97706" : "#3D2200";
  const bg    = isUrgent ? "#FEE2E2" : isWarn ? "#FEF3C7" : "#F0DFB3";

  return (
    <div
      className="flex items-center gap-1.5 rounded-full font-semibold transition-colors duration-700"
      style={{ background: bg, color, padding: "5px 10px", fontSize: "0.8rem" }}
    >
      <svg
        width="11" height="11" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        className={isUrgent ? "animate-pulse" : ""}
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l2.5 2.5" />
      </svg>
      <span className="tabular-nums">{pad(mins)}:{pad(secs)}</span>
    </div>
  );
}
