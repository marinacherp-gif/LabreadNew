"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getCookie, setCookie, COOKIE_CONSENT } from "@/lib/cookies";

export default function CookieBanner() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getCookie(COOKIE_CONSENT)) setVisible(true);
  }, []);

  if (!visible) return null;

  function accept() {
    setCookie(COOKIE_CONSENT, "1", 365);
    setVisible(false);
  }

  return (
    <div className="absolute inset-x-0 bottom-[60px] z-20 px-3 pb-2 pointer-events-none">
      <div
        className="pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3"
        style={{
          background: "rgba(30,14,0,0.93)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 -2px 0 rgba(222,187,122,0.15), 0 8px 32px rgba(0,0,0,0.35)",
        }}
      >
        <span className="text-lg flex-shrink-0 mt-0.5">🍪</span>
        <p className="flex-1 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
          {t.shop.cookieMsg}
        </p>
        <button
          onClick={accept}
          className="flex-shrink-0 text-xs font-bold rounded-xl px-3 py-1.5 transition-colors hover:opacity-90 active:scale-95"
          style={{ background: "#DEC89A", color: "#1E0E00" }}
        >
          {t.shop.cookieAccept}
        </button>
      </div>
    </div>
  );
}
