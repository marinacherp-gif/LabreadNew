"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useOrderSession } from "@/context/OrderSessionContext";
import { formatPrice } from "@/lib/utils";

function pad(n: number) { return n.toString().padStart(2, "0"); }

export default function FirstItemModal({
  onContinueShopping,
  onGoToCheckout,
}: {
  onContinueShopping: () => void;
  onGoToCheckout: () => void;
}) {
  const { t } = useLanguage();
  const { cart, cartTotal, cartCount, dismissFirstItemModal, secondsRemaining } = useOrderSession();

  const latestItem = cart[cart.length - 1];
  if (!latestItem) return null;

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;

  const handleContinue = () => { dismissFirstItemModal(); onContinueShopping(); };
  const handleCheckout = () => { dismissFirstItemModal(); onGoToCheckout(); };

  return (
    <div className="absolute inset-x-0 bottom-[68px] z-30 flex flex-col justify-end pointer-events-none px-3">
      <div
        className="pointer-events-auto rounded-2xl p-4"
        style={{
          background: "white",
          boxShadow: "0 -1px 0 #F0DFB3, 0 -8px 40px rgba(61,34,0,0.15), 0 8px 24px rgba(61,34,0,0.1)",
        }}
      >
        {/* Item row */}
        <div className="flex items-center gap-3 mb-3">
          {/* Thumbnail */}
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-brand-50 relative">
            {latestItem.product.pictureUrl
              ? <img src={latestItem.product.pictureUrl} alt={latestItem.product.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-2xl">🍞</div>
            }
            {/* Green check */}
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-green-600 mb-0.5">{t.shop.firstItemTitle}</p>
            <p className="text-sm font-semibold text-brand-800 truncate">{latestItem.product.name}</p>
          </div>

          {/* Live timer */}
          <div className="flex-shrink-0 text-center bg-brand-50 rounded-xl px-3 py-2 border border-brand-100">
            <p className="text-[9px] text-brand-400 uppercase tracking-wide font-medium mb-0.5">
              {t.shop.sessionTimerLabel}
            </p>
            <p className="font-bold text-brand-700 text-sm tabular-nums leading-none">
              {pad(mins)}:{pad(secs)}
            </p>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-brand-500 text-[11px] leading-relaxed mb-3.5 px-0.5">
          {t.shop.firstItemSub}
        </p>

        {/* CTA buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={handleContinue}
            className="flex-1 py-3 rounded-xl font-semibold text-sm border border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100 active:scale-[0.97] transition-all"
          >
            {t.shop.continueShoppingBtn}
          </button>
          <button
            onClick={handleCheckout}
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 active:scale-[0.97] transition-all"
            style={{ background: "#3D2200", boxShadow: "0 4px 14px rgba(61,34,0,0.22)" }}
          >
            {t.shop.goToCheckoutBtn}
            {cartCount > 0 && (
              <span className="ms-1 opacity-70 font-normal">· {formatPrice(cartTotal)}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
