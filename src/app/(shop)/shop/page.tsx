"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useOrderSession, type CartItem } from "@/context/OrderSessionContext";
import CheckoutModal from "@/components/shop/CheckoutModal";
import CookieBanner from "@/components/shop/CookieBanner";
import DateSelectionPrompt from "@/components/shop/DateSelectionPrompt";
import ExpiryWarningModal from "@/components/shop/ExpiryWarningModal";
import FirstItemModal from "@/components/shop/FirstItemModal";
import ProductDetailSheet from "@/components/shop/ProductDetailSheet";

type Tab          = "home" | "shop" | "hours" | "cart";
type ShopFilter   = "all" | "BREAD" | "PASTRY";
type CheckoutState = "idle" | "checkout" | "success";
type Availability  = "ok" | "date_unavailable" | "out_of_stock";
type BakeryInfo   = {
  activeAnnouncements?: { id: string; text: string }[];
  workingHours?: Record<string, string>;
};

const OWNER_PHONE = "054-528-6797";

const DAY_ORDER = ["SUN","MON","TUE","WED","THU","FRI","SAT"] as const;
const DAYS_NUM = { SUN:0, MON:1, TUE:2, WED:3, THU:4, FRI:5, SAT:6 };

function todayDayCode() {
  return DAY_ORDER[new Date().getDay()];
}

function formatOrderDate(date: Date, lang: string) {
  const locale = lang === "he" ? "he-IL" : "en-US";
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" }).format(date);
}

function productAvailability(p: Product, dayCode: string | null): Availability {
  if (!dayCode) return "ok"; // no date yet → show everything normally on home
  if (!p.availableDays.includes(dayCode)) return "date_unavailable";
  if (p.stockAmount <= 0) return "out_of_stock";
  return "ok";
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);
const IconShop = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {/* Bread loaf dome */}
    <path d="M5 13c0-4.4 3.1-8 7-8s7 3.6 7 8"/>
    {/* Score line on dome */}
    <path d="M9.5 13a3.5 3.5 0 0 1 5 0"/>
    {/* Base of loaf */}
    <rect x="3" y="13" width="18" height="5" rx="1.5"/>
  </svg>
);
const IconClock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v5l3.5 3.5"/>
  </svg>
);
const IconCart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

// ─── Bottom Nav ────────────────────────────────────────────────────────────────

function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const { t } = useLanguage();
  const { cartCount } = useOrderSession();

  const items: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "home",  label: t.shop.tabHome,  icon: <IconHome /> },
    { id: "shop",  label: t.shop.tabShop,  icon: <IconShop /> },
    { id: "hours", label: t.shop.tabHours, icon: <IconClock /> },
    { id: "cart",  label: t.shop.cartTab,  icon: <IconCart /> },
  ];

  return (
    <nav
      className="flex-shrink-0 bg-white border-t border-brand-100"
      style={{ boxShadow: "0 -1px 0 #F0DFB3, 0 -4px 24px rgba(61,34,0,0.07)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-[60px]">
        {items.map(({ id, icon, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex-1 relative flex flex-col items-center justify-center gap-[3px] transition-colors duration-150 ${isActive ? "text-brand-700" : "text-brand-300"}`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full bg-brand-600" style={{ width: 28, height: 3 }} />
              )}
              <span className="relative">
                {icon}
                {id === "cart" && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 text-white font-bold rounded-full flex items-center justify-center"
                    style={{ fontSize: 9, minWidth: 16, height: 16, padding: "0 3px", background: "#3D2200" }}>
                    {cartCount}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, lineHeight: 1 }}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Availability Badge ────────────────────────────────────────────────────────

function AvailBadge({ av }: { av: Availability }) {
  const { t } = useLanguage();
  if (av === "ok") return null;
  const label = av === "date_unavailable" ? t.shop.notAvailableOnDate : t.shop.outOfStockBadge;
  const bg    = av === "date_unavailable" ? "#F5F5F5"  : "#FEF3C7";
  const color = av === "date_unavailable" ? "#737373"  : "#92400E";
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full leading-none"
      style={{ background: bg, color, border: `1px solid ${av === "date_unavailable" ? "#E5E5E5" : "#FDE68A"}` }}>
      {label}
    </span>
  );
}

// ─── Shop Product Row ─────────────────────────────────────────────────────────

function ShopProductRow({ product, cartItem, availability, onClick }: {
  product: Product;
  cartItem?: CartItem;
  availability: Availability;
  onClick: () => void;
}) {
  const { t } = useLanguage();
  const qty    = cartItem?.quantity ?? 0;
  const canAdd = availability === "ok";

  return (
    <button
      onClick={canAdd ? onClick : undefined}
      disabled={!canAdd}
      className="w-full flex gap-3 bg-white rounded-2xl p-4 text-start transition-all active:scale-[0.98]"
      style={{
        opacity: canAdd ? 1 : 0.55,
        boxShadow: "0 1px 3px rgba(61,34,0,0.06)",
        cursor: canAdd ? "pointer" : "default",
      }}
    >
      {/* Text side */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Dietary + availability tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          <AvailBadge av={availability} />
          {product.isVegan && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0" }}>
              {t.shop.tagVegan}
            </span>
          )}
          {product.containsDairy && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#EFF6FF", color: "#1E40AF", border: "1px solid #BFDBFE" }}>
              {t.shop.tagDairy}
            </span>
          )}
          {product.containsAllergens && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#FFF7ED", color: "#9A3412", border: "1px solid #FDBA74" }}>
              {t.shop.tagAllergens}
            </span>
          )}
        </div>

        <h3 className="font-semibold text-brand-800 text-sm leading-snug mb-1">{product.name}</h3>

        {product.description && (
          <p className="text-brand-400 text-xs leading-relaxed mb-2 line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="font-bold text-brand-700" style={{ fontSize: "0.9375rem" }}>
            {formatPrice(product.price)}
          </span>

          {canAdd && qty === 0 && (
            <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center flex-shrink-0"
              style={{ fontSize: "1.25rem", lineHeight: 1, fontWeight: 300 }}>
              +
            </div>
          )}
          {canAdd && qty > 0 && (
            <div className="flex items-center gap-1 rounded-full font-semibold flex-shrink-0"
              style={{ background: "#3D2200", color: "white", fontSize: "0.7rem", padding: "4px 10px" }}>
              <span>×{qty}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>{formatPrice(Number(product.price) * qty)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Image */}
      <div className="flex-shrink-0 rounded-xl overflow-hidden bg-brand-50" style={{ width: 86, height: 86 }}>
        {product.pictureUrl
          ? <img src={product.pictureUrl} alt={product.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center" style={{ fontSize: "2rem" }}>🍞</div>
        }
      </div>
    </button>
  );
}

// ─── Shop View ────────────────────────────────────────────────────────────────

function ShopView({ products, filter, onFilterChange, onSelectProduct }: {
  products: Product[];
  filter: ShopFilter;
  onFilterChange: (f: ShopFilter) => void;
  onSelectProduct: (product: Product) => void;
}) {
  const { t } = useLanguage();
  const { cart, orderDayCode } = useOrderSession();

  const active   = products.filter(p => p.isActive);
  const filtered = active.filter(p => filter === "all" ? true : p.category === filter);

  const counts: Record<ShopFilter, number> = {
    all:    active.length,
    BREAD:  active.filter(p => p.category === "BREAD").length,
    PASTRY: active.filter(p => p.category === "PASTRY").length,
  };

  // Split into orderable and not orderable based on selected date
  const withAv = filtered.map(p => ({
    product: p,
    av: productAvailability(p, orderDayCode),
    cartItem: cart.find(i => i.product.id === p.id),
  }));

  const available   = withAv.filter(x => x.av === "ok");
  const unavailable = withAv.filter(x => x.av !== "ok");

  const filterDefs: { id: ShopFilter; label: string }[] = [
    { id: "all",    label: t.shop.filterAll },
    { id: "BREAD",  label: t.shop.tabBreads },
    { id: "PASTRY", label: t.shop.tabPastries },
  ];

  return (
    <div className="flex flex-col">
      {/* Filter bar */}
      <div className="sticky top-0 z-10 px-4 py-3"
        style={{ background: "rgba(250,246,236,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(222,187,122,0.25)" }}>
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {filterDefs.map(({ id, label }) => {
            const isActive = filter === id;
            const count    = counts[id];
            return (
              <button key={id} onClick={() => onFilterChange(id)}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 flex-shrink-0"
                style={{
                  padding: "7px 16px",
                  background: isActive ? "#3D2200" : "white",
                  color: isActive ? "white" : "#7B4A1E",
                  border: isActive ? "1.5px solid #3D2200" : "1.5px solid #DEC89A",
                  boxShadow: isActive ? "0 2px 8px rgba(61,34,0,0.2)" : "0 1px 2px rgba(61,34,0,0.04)",
                }}>
                <span>{label}</span>
                {count > 0 && (
                  <span className="text-[11px] font-semibold rounded-full leading-none"
                    style={{
                      padding: "2px 6px",
                      background: isActive ? "rgba(255,255,255,0.18)" : "#F0DFB3",
                      color: isActive ? "rgba(255,255,255,0.9)" : "#7B4A1E",
                    }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product list */}
      <div className="px-4 pt-3 pb-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">🌾</div>
            <p className="font-semibold text-brand-700 text-sm mb-1">{t.shop.nothingToday}</p>
            <p className="text-brand-400 text-xs">{t.shop.nothingTodaySub}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Available on selected date */}
            {available.length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-1 pb-0.5">
                  <p className="text-[11px] font-semibold text-brand-400 uppercase tracking-widest whitespace-nowrap">
                    {t.shop.availableToday}
                  </p>
                  <span className="flex-1 h-px rounded-full" style={{ background: "linear-gradient(to right, #DEC89A55, transparent)" }} />
                </div>
                {available.map(({ product, av, cartItem }) => (
                  <ShopProductRow key={product.id} product={product} cartItem={cartItem} availability={av} onClick={() => onSelectProduct(product)} />
                ))}
              </>
            )}

            {/* Not available on selected date / out of stock */}
            {unavailable.length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-4 pb-0.5">
                  <p className="text-[11px] font-semibold text-brand-400 uppercase tracking-widest whitespace-nowrap">
                    {t.shop.comingOtherDays}
                  </p>
                  <span className="flex-1 h-px bg-brand-100 rounded-full" />
                </div>
                {unavailable.map(({ product, av, cartItem }) => (
                  <ShopProductRow key={product.id} product={product} cartItem={cartItem} availability={av} onClick={() => onSelectProduct(product)} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inline Date Selector (home screen) ──────────────────────────────────────

function DateSelectorRow({ disabled = false }: { disabled?: boolean }) {
  const { t, lang } = useLanguage();
  const { orderDate, openDatePicker } = useOrderSession();
  const hasDate = !!orderDate;

  return (
    <button
      onClick={disabled ? undefined : openDatePicker}
      disabled={disabled}
      className="w-full flex items-center gap-3 rounded-2xl px-4 py-4 text-start active:scale-[0.98] transition-all"
      style={{
        background: hasDate ? "linear-gradient(135deg,#3D2200,#5C3310)" : "white",
        border: `1.5px solid ${hasDate ? "transparent" : "#DEC89A"}`,
        boxShadow: hasDate ? "0 4px 20px rgba(61,34,0,0.2)" : "0 1px 4px rgba(61,34,0,0.08)",
        cursor: disabled ? "default" : undefined,
        opacity: disabled ? 0.7 : undefined,
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: hasDate ? "rgba(255,255,255,0.12)" : "#F0DFB3" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={hasDate ? "rgba(255,255,255,0.85)" : "#7B4A1E"}
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold mb-0.5"
          style={{ color: hasDate ? "rgba(255,255,255,0.6)" : "#9A6028" }}>
          {t.shop.pickupDateLabel}
        </p>
        <p className="font-semibold text-sm truncate"
          style={{ color: hasDate ? "white" : "#3D2200" }}>
          {hasDate ? formatOrderDate(orderDate!, lang) : t.shop.selectOrderDate}
        </p>
      </div>
      {hasDate ? (
        <span className="flex-shrink-0 text-xs font-medium"
          style={{ color: "rgba(255,255,255,0.55)" }}>
          {t.shop.changeDate}
        </span>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C49A45"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0"
          style={{ transform: lang === "he" ? "scaleX(-1)" : "none" }}>
          <path d="M9 18l6-6-6-6"/>
        </svg>
      )}
    </button>
  );
}

// ─── Home View ────────────────────────────────────────────────────────────────

function HomeView({ announcements, checkoutInProgress = false }: {
  announcements?: { id: string; text: string }[];
  checkoutInProgress?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center pb-8">

      {/* ── Hero ── */}
      <div className="relative w-full" style={{ height: 320 }}>
        {/* Baguette background */}
        <img
          src="/baguette.jpeg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center 25%" }}
        />
        {/* Gradient: dark band over text zone, fades to page bg at bottom */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(10,3,0,0.35) 0%, rgba(8,2,0,0.62) 38%, rgba(8,2,0,0.60) 68%, rgba(8,2,0,0.25) 86%, rgba(250,246,236,1) 100%)",
          }}
        />
        {/* Logo + text — one centered column, anchored near the top */}
        <div className="absolute left-1/2 -translate-x-1/2 z-10 flex flex-col items-center" style={{ top: 36 }}>
          <div
            className="rounded-[22px] overflow-hidden mb-4"
            style={{
              width: 84,
              height: 84,
              boxShadow: "0 6px 28px rgba(61,34,0,0.28), 0 0 0 3px rgba(250,246,236,0.9)",
            }}
          >
            <img src="/labread_logo.jpg" alt="Labread" className="w-full h-full object-cover" />
          </div>
          <p className="font-bold text-white text-lg text-center leading-snug mb-1.5 px-6"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 2px 12px rgba(0,0,0,0.6)" }}>
            {t.shop.heroCopy1}
          </p>
          <p className="text-sm text-center leading-relaxed px-8"
            style={{ color: "rgba(255,255,255,0.92)", textShadow: "0 1px 3px rgba(0,0,0,0.85), 0 2px 10px rgba(0,0,0,0.55)", maxWidth: 280 }}>
            {t.shop.heroCopy2}
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 w-full flex flex-col items-center" style={{ paddingTop: 24 }}>

        {/* Admin announcements */}
        {announcements?.map(ann => (
          <div key={ann.id}
            className="w-full flex gap-2.5 items-start rounded-2xl px-4 py-3 text-sm mb-3 border"
            style={{ background: "#FFFBEB", borderColor: "#FDE68A", color: "#78350F" }}>
            <span className="flex-shrink-0 mt-0.5">📢</span>
            <p className="leading-relaxed">{ann.text}</p>
          </div>
        ))}

        {/* Inline pickup date selector */}
        <div className="w-full mt-1">
          <DateSelectorRow disabled={checkoutInProgress} />
        </div>
      </div>

    </div>
  );
}

// ─── Cart View ────────────────────────────────────────────────────────────────

function CartView({ onCheckout }: { onCheckout: () => void }) {
  const { t } = useLanguage();
  const { cart, cartTotal, addItem, decrementItem } = useOrderSession();

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5" style={{ background: "#F0DFB3" }}>
          <IconCart />
        </div>
        <h2 className="font-bold text-brand-800 text-lg mb-2">{t.shop.cartEmpty}</h2>
        <p className="text-brand-400 text-sm leading-relaxed max-w-xs">{t.shop.cartEmptySub}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-8">
      <h2 className="font-bold text-brand-800 text-lg mb-5">{t.shop.yourOrder}</h2>
      <div className="space-y-2.5 mb-5">
        {cart.map(item => (
          <div key={item.product.id} className="flex items-center gap-3 bg-white rounded-2xl p-3.5" style={{ boxShadow: "0 1px 3px rgba(61,34,0,0.06)" }}>
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-brand-50">
              {item.product.pictureUrl
                ? <img src={item.product.pictureUrl} alt={item.product.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl">🍞</div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand-800 text-sm truncate">{item.product.name}</p>
              <p className="text-brand-500 text-sm mt-0.5">{formatPrice(Number(item.product.price) * item.quantity)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => decrementItem(item.product)} className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold hover:bg-brand-200 flex items-center justify-center transition-colors text-base leading-none">−</button>
              <span className="w-5 text-center font-semibold text-brand-800 text-sm">{item.quantity}</span>
              <button onClick={() => addItem(item.product)} className="w-7 h-7 rounded-full bg-brand-700 text-white font-bold hover:bg-brand-600 flex items-center justify-center transition-colors text-base leading-none">+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 mb-5" style={{ boxShadow: "0 1px 3px rgba(61,34,0,0.06)" }}>
        <div className="flex justify-between font-bold text-brand-800">
          <span>{t.shop.total}</span>
          <span>{formatPrice(cartTotal)}</span>
        </div>
      </div>

      <button onClick={onCheckout}
        className="w-full bg-brand-700 text-white rounded-2xl py-4 font-bold hover:bg-brand-600 active:scale-[0.98] transition-all"
        style={{ boxShadow: "0 4px 20px rgba(61,34,0,0.25)" }}>
        {t.shop.placeOrder(formatPrice(cartTotal))}
      </button>
    </div>
  );
}

// ─── Hours View ───────────────────────────────────────────────────────────────

function HoursView({ bakeryInfo }: { bakeryInfo: BakeryInfo | null }) {
  const { t } = useLanguage();
  const hasHours = bakeryInfo?.workingHours && Object.values(bakeryInfo.workingHours).some(Boolean);

  return (
    <div className="px-4 pt-6 pb-8">
      <h2 className="font-bold text-brand-800 text-lg mb-5 text-center">{t.shop.openingHoursTitle}</h2>
      {!hasHours ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#F0DFB3" }}>
            <IconClock />
          </div>
          <p className="text-brand-400 text-sm">{t.shop.placeholderSub}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden border border-brand-100" style={{ boxShadow: "0 2px 16px rgba(61,34,0,0.06)" }}>
          {DAY_ORDER.map((day, i) => {
            const hours = bakeryInfo!.workingHours![day];
            return (
              <div key={day} className={`flex items-center justify-between px-5 py-4 ${i < DAY_ORDER.length - 1 ? "border-b border-brand-50" : ""}`}>
                <span className="font-medium text-brand-700 text-sm">{t.settings.dayLabels[day]}</span>
                <span className={`text-sm ${hours ? "text-brand-600 font-medium" : "text-brand-300"}`}>
                  {hours || t.shop.closedDay}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ShopPage() {
  const { t, lang, setLang, dir } = useLanguage();
  const session = useOrderSession();

  const [tab, setTab]             = useState<Tab>("home");
  const [shopFilter, setShopFilter] = useState<ShopFilter>("all");
  const [checkout, setCheckout]   = useState<CheckoutState>("idle");
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [products, setProducts]   = useState<Product[]>([]);
  const [bakeryInfo, setBakeryInfo] = useState<BakeryInfo | null>(null);
  const [selectedShopProduct, setSelectedShopProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetch("/api/catalog")
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : []));
    fetch("/api/public/bakery-info")
      .then(r => r.json())
      .then(setBakeryInfo)
      .catch(() => null);
  }, []);

  return (
    <div className="flex items-center justify-center"
      style={{ background: "radial-gradient(ellipse at 30% 10%, #3D1800 0%, #0D0500 65%, #060200 100%)", minHeight: "100dvh", overflowX: "hidden" }}>

      <div className="relative flex flex-col bg-brand-50 w-full overflow-hidden"
        dir={dir}
        style={{
          maxWidth: 390,
          height: "min(100dvh, 844px)",
          borderRadius: "clamp(0px, calc((100vw - 392px) * 9999), 44px)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 32px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}>

        {/* ── Top Bar ── */}
        <header className="flex-shrink-0 bg-white border-b border-brand-100"
          style={{ boxShadow: "0 1px 0 #F0DFB3", paddingTop: "env(safe-area-inset-top)" }}>
          <div className="flex items-center justify-between px-4 h-14 gap-2">
            {/* Left: logo + date chip */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-bold text-brand-800 tracking-wide flex-shrink-0" style={{ fontSize: "1.1rem" }}>LABREAD</span>
              <img src="/labread_logo.jpg" alt="" className="rounded-lg flex-shrink-0" style={{ width: 26, height: 26, objectFit: "cover" }} />
              {session.orderDate && checkout === "idle" && (
                <button onClick={session.openDatePicker}
                  className="flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100 active:scale-95 transition-all min-w-0 max-w-[130px]"
                  style={{ fontSize: "0.7rem", padding: "4px 8px", fontWeight: 500 }}>
                  <span className="truncate">{formatOrderDate(session.orderDate, lang)}</span>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              )}
            </div>

            {/* Right: lang switcher */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setLang(lang === "he" ? "en" : "he")}
                className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 text-brand-700 font-medium hover:bg-brand-100 active:scale-95 transition-all"
                style={{ fontSize: "0.8125rem", padding: "6px 10px" }}>
                <span style={{ fontSize: "0.95rem", lineHeight: 1 }}>{lang === "he" ? "🇮🇱" : "🇬🇧"}</span>
                <span>{lang === "he" ? "עב" : "EN"}</span>
              </button>
            </div>
          </div>

          {/* Reserve error toast (inline under header) */}
          {session.reserveError && (
            <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
              style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}>
              <span className="text-base leading-none">⚠️</span>
              <span className="flex-1 text-xs font-medium">{t.shop.reserveErrMsg}</span>
              <button onClick={session.clearReserveError} className="text-red-400 hover:text-red-600 font-bold text-base leading-none">×</button>
            </div>
          )}
        </header>

        {/* ── Scrollable Content ── */}
        <main className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" } as CSSProperties}>
          {tab === "home" && (
            <HomeView
              announcements={bakeryInfo?.activeAnnouncements}
              checkoutInProgress={checkout === "checkout"}
            />
          )}
          {tab === "shop" && (
            <ShopView
              products={products}
              filter={shopFilter}
              onFilterChange={setShopFilter}
              onSelectProduct={setSelectedShopProduct}
            />
          )}
          {tab === "hours" && <HoursView bakeryInfo={bakeryInfo} />}
          {tab === "cart"  && <CartView onCheckout={() => setCheckout("checkout")} />}
        </main>

        {/* ── Bottom Nav ── */}
        <BottomNav active={tab} onChange={setTab} />

        {/* ── Cookie consent banner ── */}
        <CookieBanner />

        {/* ── First Item Modal (suppressed when product sheet is open) ── */}
        {session.showFirstItemModal && !selectedShopProduct && (
          <FirstItemModal
            onContinueShopping={() => session.dismissFirstItemModal()}
            onGoToCheckout={() => { session.dismissFirstItemModal(); setTab("cart"); }}
          />
        )}
      </div>

      {/* ── Fixed overlays (viewport-level) ── */}

      {/* Product detail sheet */}
      {selectedShopProduct && (
        <ProductDetailSheet
          product={selectedShopProduct}
          currentQty={session.cart.find(i => i.product.id === selectedShopProduct.id)?.quantity ?? 0}
          onClose={() => setSelectedShopProduct(null)}
          onGoToCheckout={() => { setSelectedShopProduct(null); setTab("cart"); }}
        />
      )}

      {/* Date selection sheet */}
      {session.showDatePicker && (
        <DateSelectionPrompt
          workingHours={bakeryInfo?.workingHours ?? {}}
          onClose={session.closeDatePicker}
          expiredMode={session.cartExpiredNotice}
          onDateSelected={() => setTab("shop")}
        />
      )}

      {/* Expiry warning */}
      {session.status === "expiry_warning" && <ExpiryWarningModal />}

      {/* Checkout modal */}
      {checkout === "checkout" && (
        <CheckoutModal
          cart={session.cart}
          totalPrice={session.cartTotal}
          pickupDate={session.orderDate!}
          onClose={() => setCheckout("idle")}
          onSuccess={() => {
            session.clearCartAfterOrder();
            setCheckout("success");
            setTab("home");
          }}
        />
      )}

      {/* Success screen */}
      {checkout === "success" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center" style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 text-brand-700 font-bold text-2xl"
              style={{ background: "linear-gradient(135deg, #F0DFB3, #DEBB7A)" }}>
              ✓
            </div>
            <h2 className="font-bold text-brand-800 text-xl mb-2">{t.shop.successTitle}</h2>
            <p className="text-brand-400 text-sm mb-4 leading-relaxed">{t.shop.successMsg}</p>

            {/* Payment notice */}
            <div className="rounded-2xl px-4 py-4 mb-6 text-start space-y-3"
              style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA" }}>
              <p className="text-sm leading-relaxed" style={{ color: "#9A3412" }}>
                {t.shop.paymentNotice}
              </p>

              {/* Phone + copy */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-lg tracking-wide" style={{ color: "#7C2D12" }}>
                  {OWNER_PHONE}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(OWNER_PHONE).then(() => {
                      setPhoneCopied(true);
                      setTimeout(() => setPhoneCopied(false), 2000);
                    });
                  }}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    background: phoneCopied ? "#DCFCE7" : "white",
                    border: `1.5px solid ${phoneCopied ? "#86EFAC" : "#FED7AA"}`,
                    color: phoneCopied ? "#15803D" : "#9A3412",
                  }}
                >
                  {phoneCopied ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {t.shop.copiedPhone}
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      {t.shop.copyPhone}
                    </>
                  )}
                </button>
              </div>

              {/* Open Bit */}
              <a
                href="bit://"
                className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-bold transition-all active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg,#00B050,#00D462)", color: "white", boxShadow: "0 3px 12px rgba(0,180,80,0.35)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                {t.shop.openBit}
              </a>

              <p className="text-xs text-center" style={{ color: "#C2410C" }}>{t.shop.paymentThanks}</p>
            </div>
            <button onClick={() => setCheckout("idle")} className="w-full bg-brand-700 text-white rounded-2xl py-3.5 font-bold hover:bg-brand-600 active:scale-[0.98] transition-all">
              {t.shop.backToShop}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
