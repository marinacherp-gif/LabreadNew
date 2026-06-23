"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useOrderSession } from "@/context/OrderSessionContext";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export default function ExpiryWarningModal() {
  const { t } = useLanguage();
  const { warningSecondsRemaining, confirmPresence, resetSession } = useOrderSession();

  const mins = Math.floor(warningSecondsRemaining / 60);
  const secs = warningSecondsRemaining % 60;
  const isUrgent = warningSecondsRemaining < 30;
  const accentColor = isUrgent ? "#DC2626" : "#D97706";
  const accentBg    = isUrgent ? "#FEE2E2"  : "#FEF3C7";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-sm w-full text-center"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.35)" }}
      >
        {/* Animated pulse ring + icon */}
        <div className="relative flex justify-center mb-6">
          <div
            className="absolute w-20 h-20 rounded-full animate-ping opacity-20"
            style={{ background: accentColor }}
          />
          <div
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: accentBg }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                fill={accentColor} opacity="0.2"
              />
              <path
                d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke={accentColor} strokeWidth="1.5" fill="none"
              />
              <path d="M12 9v4M12 17h.01" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <h2 className="font-bold text-brand-800 text-xl mb-2">{t.shop.stillThereTitle}</h2>
        <p className="text-brand-500 text-sm leading-relaxed mb-5">{t.shop.stillThereSub}</p>

        {/* Big countdown */}
        <div
          className="text-[3.5rem] font-bold tabular-nums leading-none mb-7 transition-colors duration-300"
          style={{ color: accentColor, fontVariantNumeric: "tabular-nums" }}
        >
          {pad(mins)}:{pad(secs)}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-brand-100 mb-6 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(warningSecondsRemaining / 120) * 100}%`,
              background: accentColor,
            }}
          />
        </div>

        <button
          onClick={confirmPresence}
          className="w-full rounded-2xl py-4 font-bold text-base text-white hover:opacity-90 active:scale-[0.98] transition-all mb-3"
          style={{ background: "#3D2200", boxShadow: "0 4px 20px rgba(61,34,0,0.25)" }}
        >
          {t.shop.yesImHere}
        </button>

        <button
          onClick={() => resetSession()}
          className="w-full py-2.5 text-brand-400 text-sm font-medium hover:text-brand-600 transition-colors"
        >
          {t.shop.startOverBtn}
        </button>
      </div>
    </div>
  );
}
