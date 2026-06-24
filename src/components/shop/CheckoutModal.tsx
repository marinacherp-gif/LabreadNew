"use client";

import { useRef, useState, useEffect } from "react";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { getCookie, setCookie, COOKIE_CONSENT, COOKIE_NAME, COOKIE_PHONE } from "@/lib/cookies";

interface CartItem { product: Product; quantity: number; }

interface Props {
  cart: CartItem[];
  totalPrice: number;
  pickupDate: Date;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckoutModal({ cart, totalPrice, pickupDate, onClose, onSuccess }: Props) {
  const { t, lang } = useLanguage();
  const [name, setName]           = useState("");
  const [phone, setPhone]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");

  // Pre-fill from cookies if the user previously consented
  useEffect(() => {
    if (getCookie(COOKIE_CONSENT)) {
      const savedName  = getCookie(COOKIE_NAME);
      const savedPhone = getCookie(COOKIE_PHONE);
      if (savedName)  setName(savedName);
      if (savedPhone) setPhone(savedPhone);
    }
  }, []);
  const overlayRef = useRef<HTMLDivElement>(null);

  const locale = lang === "he" ? "he-IL" : "en-US";
  const pickupDateDisplay = new Intl.DateTimeFormat(locale, {
    weekday: "long", day: "numeric", month: "long",
  }).format(pickupDate);
  const pickupDateISO = [
    pickupDate.getFullYear(),
    String(pickupDate.getMonth() + 1).padStart(2, "0"),
    String(pickupDate.getDate()).padStart(2, "0"),
  ].join("-");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { setError(t.shop.errRequired); return; }

    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10 || !digits.startsWith("05")) {
      setError(t.shop.errPhone);
      return;
    }

    setError("");
    setSubmitting(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: name.trim(),
        clientPhone: phone.trim(),
        deliveryDate: pickupDateISO,
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      }),
    });

    if (res.ok) {
      if (getCookie(COOKIE_CONSENT)) {
        setCookie(COOKIE_NAME,  name.trim());
        setCookie(COOKIE_PHONE, phone.trim());
      }
      onSuccess();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t.shop.errGeneral);
    }
    setSubmitting(false);
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-end"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Sheet constrained to phone frame width */}
      <div className="relative w-full" style={{ maxWidth: 390 }}>
        <div
          className="bg-white rounded-t-3xl overflow-hidden"
          style={{ maxHeight: "92dvh", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-brand-200" />
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-brand-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-800">{t.shop.checkoutTitle}</h2>
            <button onClick={onClose} className="text-brand-400 hover:text-brand-700 text-xl leading-none">✕</button>
          </div>

          <div className="overflow-y-auto overflow-x-hidden" style={{ maxHeight: "calc(92dvh - 80px)" }}>
            {/* Order summary */}
            <div className="px-4 py-4 bg-brand-50 border-b border-brand-100">
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-3">{t.shop.yourOrder}</p>
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm py-1.5">
                  <span className="text-brand-700">{item.product.name} × {item.quantity}</span>
                  <span className="font-medium text-brand-800">
                    {formatPrice(Number(item.product.price) * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-brand-800 pt-3 mt-1 border-t border-brand-200">
                <span>{t.shop.total}</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-4 py-5 space-y-4">
              {error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1.5">
                  {t.shop.fullName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  required placeholder={t.shop.namePlaceholder}
                  className="w-full border border-brand-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-brand-50"
                />
              </div>

              {/* Phone — numeric only */}
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1.5">
                  {t.shop.phone} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9\- ]/g, "");
                    if (val.replace(/\D/g, "").length <= 10) setPhone(val);
                  }}
                  required
                  placeholder={t.shop.phonePlaceholder}
                  className="w-full border border-brand-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-brand-50"
                />
              </div>

              {/* Pickup date — read-only, sourced from session */}
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1.5">
                  {t.shop.deliveryDate}
                </label>
                <div
                  className="w-full border border-brand-200 rounded-xl px-4 py-2.5 text-sm text-brand-700 select-none"
                  style={{ background: "#F5F0E8", cursor: "default" }}
                >
                  {pickupDateDisplay}
                </div>
              </div>

              <button
                type="submit" disabled={submitting}
                className="w-full py-3.5 bg-brand-700 text-white rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors mt-1"
              >
                {submitting ? t.shop.placing : t.shop.placeOrder(formatPrice(totalPrice))}
              </button>

              <p className="text-xs text-brand-400 text-center">{t.shop.consent}</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
