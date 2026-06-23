"use client";

import { useState } from "react";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useOrderSession } from "@/context/OrderSessionContext";

interface Props {
  product: Product;
  currentQty: number;
  onClose: () => void;
  onGoToCheckout: () => void;
}

export default function ProductDetailSheet({ product, currentQty, onClose, onGoToCheckout }: Props) {
  const { t } = useLanguage();
  const { addItem, decrementItem, dismissFirstItemModal } = useOrderSession();
  const [localQty, setLocalQty] = useState(Math.max(currentQty, 1));
  const [phase, setPhase] = useState<"selecting" | "adding" | "added">("selecting");

  const handleAdd = async () => {
    setPhase("adding");
    const delta = localQty - currentQty;
    if (delta > 0) {
      for (let i = 0; i < delta; i++) {
        const ok = await addItem(product);
        if (!ok) { setPhase("selecting"); return; }
      }
    } else if (delta < 0) {
      for (let i = 0; i < Math.abs(delta); i++) {
        await decrementItem(product);
      }
    }
    dismissFirstItemModal();
    setPhase("added");
  };

  const totalPrice = formatPrice(Number(product.price) * localQty);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.52)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white w-full overflow-hidden"
        style={{
          borderRadius: "28px 28px 0 0",
          maxHeight: "88vh",
          maxWidth: 390,
          margin: "0 auto",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.28)",
        }}
      >
        {/* Image */}
        <div className="relative flex-shrink-0" style={{ height: 260 }}>
          {product.pictureUrl ? (
            <img src={product.pictureUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-brand-50 flex items-center justify-center" style={{ fontSize: "5rem" }}>🍞</div>
          )}

          {/* Close button — physical top-right regardless of dir */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/50"
            style={{ background: "rgba(0,0,0,0.35)", color: "white", fontSize: "1.375rem", lineHeight: 1, backdropFilter: "blur(4px)" }}
          >
            ×
          </button>

          {/* Cart badge when already in basket */}
          {currentQty > 0 && (
            <div
              className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full font-semibold"
              style={{ background: "#3D2200", color: "white", fontSize: "0.75rem", padding: "5px 10px" }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              ×{currentQty}
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 pt-5 pb-8" style={{ maxHeight: "calc(88vh - 260px)" }}>
          {phase === "added" ? (
            // ── Success state ──────────────────────────────────────────────────
            <div className="flex flex-col items-center text-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4 font-bold text-brand-700"
                style={{ background: "linear-gradient(135deg, #F0DFB3, #DEBB7A)", fontSize: "1.75rem" }}
              >
                ✓
              </div>
              <h3 className="font-bold text-brand-800 text-lg mb-1">{t.shop.addedMsg}</h3>
              <p className="text-brand-400 text-sm mb-8">{product.name}</p>
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-[0.98] hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#3D2200,#5C3310)", boxShadow: "0 4px 20px rgba(61,34,0,0.25)" }}
                >
                  {t.shop.continueShoppingBtn}
                </button>
                <button
                  onClick={onGoToCheckout}
                  className="w-full py-3.5 rounded-2xl font-semibold transition-all active:scale-[0.98] hover:bg-brand-50"
                  style={{ border: "1.5px solid #DEC89A", color: "#3D2200" }}
                >
                  {t.shop.finishOrder}
                </button>
              </div>
            </div>
          ) : (
            // ── Selecting state ────────────────────────────────────────────────
            <>
              {/* Dietary tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {product.isVegan && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0" }}>
                    {t.shop.tagVegan}
                  </span>
                )}
                {product.containsDairy && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "#EFF6FF", color: "#1E40AF", border: "1px solid #BFDBFE" }}>
                    {t.shop.tagDairy}
                  </span>
                )}
                {product.containsAllergens && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "#FFF7ED", color: "#9A3412", border: "1px solid #FDBA74" }}>
                    {t.shop.tagAllergens}
                  </span>
                )}
              </div>

              {/* Name */}
              <h2 className="font-bold text-brand-800 text-xl mb-2">{product.name}</h2>

              {/* Description */}
              {product.description && (
                <p className="text-brand-500 text-sm leading-relaxed mb-5">{product.description}</p>
              )}

              {/* Price + qty stepper */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-brand-700" style={{ fontSize: "1.5rem" }}>
                  {formatPrice(product.price)}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setLocalQty(q => Math.max(1, q - 1))}
                    disabled={localQty <= 1}
                    className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center hover:bg-brand-200 disabled:opacity-30 transition-colors"
                    style={{ fontSize: "1.25rem" }}
                  >
                    −
                  </button>
                  <span className="font-bold text-brand-800 text-xl w-7 text-center tabular-nums">{localQty}</span>
                  <button
                    onClick={() => setLocalQty(q => Math.min(product.stockAmount, q + 1))}
                    disabled={localQty >= product.stockAmount}
                    className="w-10 h-10 rounded-full bg-brand-700 text-white font-bold flex items-center justify-center hover:bg-brand-600 disabled:opacity-30 transition-colors"
                    style={{ fontSize: "1.25rem" }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Running total when qty > 1 */}
              <p className="text-brand-300 text-sm text-right mb-6" style={{ minHeight: "1.25rem" }}>
                {localQty > 1 ? totalPrice : ""}
              </p>

              {/* CTA */}
              <button
                onClick={handleAdd}
                disabled={phase === "adding"}
                className="w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#3D2200,#5C3310)", boxShadow: "0 4px 20px rgba(61,34,0,0.25)" }}
              >
                {phase === "adding" ? "…" : t.shop.addToBasket}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
