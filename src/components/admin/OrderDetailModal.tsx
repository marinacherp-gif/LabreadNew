"use client";

import { useEffect, useRef, useState } from "react";
import type { OrderWithItems, OrderStatus, PaymentStatus } from "@/types";
import { STATUS_COLORS, RATING_COLORS } from "@/types";
import { formatDate, formatPrice } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  orderId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function OrderDetailModal({ orderId, onClose, onUpdated }: Props) {
  const { t } = useLanguage();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const statusLabel = (s: OrderStatus) => ({ OPEN: t.orders.statusOpen, PAUSED: t.orders.statusPaused, DONE: t.orders.statusDone, CANCELED: t.orders.statusCanceled }[s]);
  const ratingLabel = (r: string) => ({ FIRST_TIMER: t.orders.ratingFirstTimer, CASUAL: t.orders.ratingCasual, FREQUENT: t.orders.ratingFrequent }[r] ?? r);
  const paymentLabel = (p: string) => p === "PAID" ? t.orders.paymentPaid : t.orders.paymentNotPaid;

  useEffect(() => {
    if (!orderId) { setOrder(null); return; }
    setLoading(true);
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => setOrder(d))
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!orderId) return null;

  async function patchOrder(data: { status?: OrderStatus; paymentStatus?: PaymentStatus }) {
    if (!order) return;
    setSaving(true);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrder((prev) => prev ? { ...prev, ...updated } : prev);
      onUpdated();
    }
    setSaving(false);
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-brand-800">
            {t.orders.detailTitle} {order ? <span className="text-gray-400 text-sm font-mono">#{order.id.slice(-8)}</span> : ""}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
        </div>

        {loading && (
          <div className="px-6 py-12 text-center text-gray-400">{t.orders.loadingOrders}</div>
        )}

        {!loading && order && (
          <div className="px-6 py-5 space-y-5">
            {/* Client info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t.orders.detailClient}</p>
                <p className="font-medium text-brand-800">{order.clientName}</p>
                <a
                  href={`https://wa.me/${order.clientPhone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:underline"
                >
                  {order.clientPhone}
                </a>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t.orders.detailRating}</p>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${RATING_COLORS[order.clientRating]}`}>
                  {ratingLabel(order.clientRating)}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t.orders.detailDelivery}</p>
                <p className="font-medium">{formatDate(order.deliveryDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t.orders.detailOrderedAt}</p>
                <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
              </div>
            </div>

            {/* Status + Payment */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t.orders.detailOrderStatus}</p>
                <select
                  value={order.status}
                  disabled={saving}
                  onChange={(e) => patchOrder({ status: e.target.value as OrderStatus })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {(["OPEN", "PAUSED", "DONE", "CANCELED"] as OrderStatus[]).map((s) => (
                    <option key={s} value={s}>{statusLabel(s)}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t.orders.detailPayment}</p>
                <button
                  disabled={saving}
                  onClick={() =>
                    patchOrder({
                      paymentStatus: order.paymentStatus === "PAID" ? "NOT_PAID" : "PAID",
                    })
                  }
                  className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors border ${
                    order.paymentStatus === "PAID"
                      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  }`}
                >
                  {paymentLabel(order.paymentStatus)} {saving ? "..." : t.orders.detailClickToggle}
                </button>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">{t.orders.detailItems}</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="pb-2 font-medium">{t.orders.detailProduct}</th>
                    <th className="pb-2 font-medium text-right">{t.orders.detailPrice}</th>
                    <th className="pb-2 font-medium text-right">{t.orders.detailQty}</th>
                    <th className="pb-2 font-medium text-right">{t.orders.detailSubtotal}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="py-2 text-gray-800">{item.product.name}</td>
                      <td className="py-2 text-right text-gray-600">{formatPrice(item.priceAtPurchase)}</td>
                      <td className="py-2 text-right text-gray-600">{item.quantity}</td>
                      <td className="py-2 text-right font-medium text-brand-800">
                        {formatPrice(Number(item.priceAtPurchase) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="pt-3 text-right font-semibold text-gray-700">{t.orders.detailTotal}</td>
                    <td className="pt-3 text-right font-bold text-brand-700 text-base">
                      {formatPrice(order.totalPrice)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
