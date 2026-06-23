"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useOrderSession, type CartItem } from "@/context/OrderSessionContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface AvailableDate { date: Date; dayCode: string; hours: string; }

function getAvailableDates(workingHours: Record<string, string>): AvailableDate[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result: AvailableDate[] = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const code = DAY_CODES[d.getDay()];
    const hrs = workingHours[code];
    if (hrs) result.push({ date: d, dayCode: code, hours: hrs });
  }
  return result;
}

function isTomorrow(date: Date) {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  t.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime() === t.getTime();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DateSelectionPrompt({
  workingHours,
  onClose,
  expiredMode = false,
  onDateSelected,
}: {
  workingHours: Record<string, string>;
  onClose: () => void;
  expiredMode?: boolean;
  onDateSelected?: () => void;
}) {
  const { t, lang } = useLanguage();
  const { selectDate, confirmDateChange, cart } = useOrderSession();

  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const [conflicts, setConflicts]     = useState<CartItem[]>([]);

  const locale = lang === "he" ? "he-IL" : "en-US";
  const dates  = getAvailableDates(workingHours);

  async function handleDateClick(date: Date) {
    if (cart.length === 0) {
      await selectDate(date);
      onDateSelected?.();
      return;
    }
    const newDayCode   = DAY_CODES[date.getDay()];
    const conflicting  = cart.filter(item => !item.product.availableDays.includes(newDayCode));
    if (conflicting.length === 0) {
      confirmDateChange(date, []);
      onDateSelected?.();
    } else {
      setPendingDate(date);
      setConflicts(conflicting);
    }
  }

  function cancelConflict() {
    setPendingDate(null);
    setConflicts([]);
  }

  const pendingDateFormatted = pendingDate
    ? new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(pendingDate)
    : "";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        style={{ backdropFilter: "blur(3px)" }}
        onClick={pendingDate ? cancelConflict : onClose}
      />

      {/* Width-constrained wrapper */}
      <div className="relative w-full" style={{ maxWidth: 390 }}>
        <div
          className="bg-white rounded-t-[2rem] overflow-hidden"
          style={{ maxHeight: "90dvh", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-brand-200" />
          </div>

          {pendingDate ? (
            /* ── Conflict confirmation ── */
            <div className="px-5 pt-3 pb-6">
              {/* Icon + title */}
              <div className="text-center mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA" }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <h2 className="font-bold text-brand-800 text-lg mb-1.5">
                  {t.shop.dateChangeTitle(pendingDateFormatted)}
                </h2>
                <p className="text-brand-500 text-sm leading-relaxed">
                  {t.shop.dateChangeBody}
                </p>
              </div>

              {/* Conflicting items list */}
              <div className="space-y-2 mb-6">
                {conflicts.map(item => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 border"
                    style={{ background: "#FFF7ED", borderColor: "#FED7AA" }}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-brand-50">
                      {item.product.pictureUrl
                        ? <img src={item.product.pictureUrl} alt={item.product.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg">🍞</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-brand-800 text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-brand-400 mt-0.5">× {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <button
                onClick={cancelConflict}
                className="w-full py-3.5 rounded-xl text-sm font-semibold mb-2.5"
                style={{ color: "#5C3310", border: "1.5px solid #DEC89A", background: "#FAF6EC" }}
              >
                {t.shop.dateChangeKeep}
              </button>
              <button
                onClick={() => { confirmDateChange(pendingDate, conflicts); onDateSelected?.(); }}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#3D2200,#5C3310)", boxShadow: "0 4px 16px rgba(61,34,0,0.25)" }}
              >
                {t.shop.dateChangeConfirm}
              </button>
            </div>
          ) : (
            /* ── Normal date selection ── */
            <>
              {/* Expired notice banner */}
              {expiredMode && (
                <div className="mx-5 mt-3 flex gap-2.5 items-start rounded-2xl px-4 py-3 text-sm border"
                  style={{ background: "#FFF7ED", borderColor: "#FED7AA", color: "#9A3412" }}>
                  <span className="text-lg leading-none flex-shrink-0">⏱</span>
                  <div>
                    <p className="font-semibold mb-0.5">{t.shop.cartExpiredTitle}</p>
                    <p className="text-xs leading-relaxed opacity-80">{t.shop.cartExpiredMsg}</p>
                  </div>
                </div>
              )}

              {/* Logo + header */}
              <div className="text-center px-6 pt-4 pb-5">
                <div
                  className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4"
                  style={{ boxShadow: "0 6px 20px rgba(196,149,69,0.3)" }}
                >
                  <img src="/labread_logo.jpg" alt="Labread" className="w-full h-full object-cover" />
                </div>
                <h2 className="font-bold text-brand-800 text-xl mb-1.5">{t.shop.selectOrderDate}</h2>
                <p className="text-brand-400 text-sm">{t.shop.selectDateSub}</p>
              </div>

              {/* Date list */}
              <div className="px-5 overflow-y-auto scrollbar-none" style={{ maxHeight: "52dvh" }}>
                {dates.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="text-4xl mb-3">🌙</div>
                    <p className="font-semibold text-brand-700 text-sm mb-1">{t.shop.nothingToday}</p>
                    <p className="text-brand-400 text-xs">{t.shop.placeholderSub}</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 pb-6">
                    {dates.map(({ date, hours }, idx) => {
                      const weekday   = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
                      const dayMonth  = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" }).format(date);
                      const monthAbbr = new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
                      const isFirst   = idx === 0;
                      const isTom     = isTomorrow(date);

                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => handleDateClick(date)}
                          className="w-full flex items-center gap-3.5 rounded-2xl p-3.5 text-start active:scale-[0.98] transition-all"
                          style={{
                            background: isFirst ? "linear-gradient(135deg,#3D2200,#5C3310)" : "#FAF6EC",
                            border: `1.5px solid ${isFirst ? "transparent" : "#F0DEB8"}`,
                            boxShadow: isFirst ? "0 4px 20px rgba(61,34,0,0.2)" : "0 1px 3px rgba(61,34,0,0.05)",
                          }}
                        >
                          {/* Day number badge */}
                          <div
                            className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center"
                            style={{ background: isFirst ? "rgba(255,255,255,0.12)" : "#F0DFB3" }}
                          >
                            <span className="text-[10px] font-medium leading-none uppercase tracking-wide"
                              style={{ color: isFirst ? "rgba(255,255,255,0.6)" : "#9A6028" }}>
                              {monthAbbr}
                            </span>
                            <span className="text-[1.35rem] font-bold leading-tight"
                              style={{ color: isFirst ? "white" : "#3D2200" }}>
                              {date.getDate()}
                            </span>
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="font-semibold text-sm leading-snug"
                                style={{ color: isFirst ? "white" : "#2C1800" }}>
                                {weekday}
                              </span>
                              {isTom && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full leading-none"
                                  style={{
                                    background: isFirst ? "rgba(255,255,255,0.18)" : "#3D2200",
                                    color: isFirst ? "rgba(255,255,255,0.9)" : "white",
                                  }}>
                                  {lang === "he" ? "מחר" : "Tomorrow"}
                                </span>
                              )}
                            </div>
                            <span className="text-xs leading-none"
                              style={{ color: isFirst ? "rgba(255,255,255,0.55)" : "#A07030" }}>
                              {dayMonth}
                            </span>
                          </div>

                          {/* Hours */}
                          <span className="flex-shrink-0 text-sm font-medium tabular-nums"
                            style={{ color: isFirst ? "rgba(255,255,255,0.8)" : "#7B4A1E" }}>
                            {hours}
                          </span>

                          {/* Chevron */}
                          <svg width="14" height="14" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor"
                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            className="flex-shrink-0"
                            style={{ color: isFirst ? "rgba(255,255,255,0.4)" : "#C49A45",
                                     transform: lang === "he" ? "scaleX(-1)" : "none" }}>
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
