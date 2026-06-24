"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OrderWithItems, OrderStatus, PaymentStatus, ClientRating } from "@/types";
import { ORDER_STATUSES, STATUS_COLORS, RATING_COLORS } from "@/types";
import { formatDate, formatPrice, todayISO } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

const PAYMENT_STATUSES: PaymentStatus[] = ["PAID", "NOT_PAID"];
const DEFAULT_STATUSES: OrderStatus[] = ["OPEN", "PAUSED"];

// Icons as inline SVG to avoid adding a library
function IconCalendar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gray-400 shrink-0">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IconDownload() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IconChevron({ expanded, rtl = false }: { expanded: boolean; rtl?: boolean }) {
  const base = "shrink-0 text-gray-400 transition-transform duration-150";
  const rotation = expanded ? "rotate-90" : "";
  const mirror = rtl ? "scale-x-[-1]" : "";
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={`${base} ${mirror} ${rotation}`}
    >
      <path d="M9 18l6-6-6-6"/>
    </svg>
  );
}

export default function OrdersGrid() {
  const { t, dir } = useLanguage();
  const rtl = dir === "rtl";
  const today = todayISO();

  const [from, setFrom]       = useState("");
  const [to, setTo]           = useState("");
  const [statuses, setStatuses]         = useState<OrderStatus[]>(DEFAULT_STATUSES);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([]);
  const [search, setSearch]   = useState("");
  const [phone, setPhone]     = useState("");

  const [orders, setOrders]   = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [markingDone, setMarkingDone] = useState(false);

  const [summaryOpen, setSummaryOpen] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Aggregate items across non-cancelled orders for the production summary
  type SummaryEntry = { productId: string; name: string; pictureUrl: string | null; totalQty: number; totalValue: number };
  const summary = useMemo<SummaryEntry[]>(() => {
    const map = new Map<string, SummaryEntry>();
    for (const order of orders) {
      if (order.status === "CANCELED") continue;
      for (const item of order.orderItems) {
        const key = item.product.id;
        const entry = map.get(key);
        if (entry) {
          entry.totalQty   += item.quantity;
          entry.totalValue += Number(item.priceAtPurchase) * item.quantity;
        } else {
          map.set(key, {
            productId:  item.product.id,
            name:       item.product.name,
            pictureUrl: (item.product as { pictureUrl?: string | null }).pictureUrl ?? null,
            totalQty:   item.quantity,
            totalValue: Number(item.priceAtPurchase) * item.quantity,
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
  }, [orders]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      ...(from && { from }),
      ...(to && { to }),
      statuses: statuses.join(","),
      ...(paymentStatuses.length > 0 && { paymentStatuses: paymentStatuses.join(",") }),
      ...(search && { search }),
      ...(phone && { phone }),
    });
    try {
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [from, to, statuses, paymentStatuses, search, phone]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggleStatus(s: OrderStatus) {
    setStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function togglePaymentStatus(s: PaymentStatus) {
    setPaymentStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected(selected.size === orders.length ? new Set() : new Set(orders.map((o) => o.id)));
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const allExpanded = orders.length > 0 && orders.every((o) => expandedIds.has(o.id));

  function expandAll() { setExpandedIds(new Set(orders.map((o) => o.id))); }
  function collapseAll() { setExpandedIds(new Set()); }
  function expandSelected() {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      selected.forEach((id) => next.add(id));
      return next;
    });
  }
  function collapseSelected() {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      selected.forEach((id) => next.delete(id));
      return next;
    });
  }

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setOpenDropdownId(null);
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
  }

  async function handlePaymentToggle(orderId: string, current: "PAID" | "NOT_PAID") {
    const next = current === "PAID" ? "NOT_PAID" : "PAID";
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: next }),
    });
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, paymentStatus: next } : o));
  }

  async function handleBulkDone() {
    const ids = selected.size > 0 ? Array.from(selected) : orders.map((o) => o.id);
    if (ids.length === 0) return;
    if (!confirm(t.orders.confirmMarkDone(ids.length))) return;
    setMarkingDone(true);
    await fetch("/api/orders/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status: "DONE" }),
    });
    setMarkingDone(false);
    setSelected(new Set());
    fetchOrders();
  }

  function handleExport() {
    const params = new URLSearchParams();
    if (selected.size > 0) {
      params.set("ids", Array.from(selected).join(","));
    } else {
      params.set("from", from);
      params.set("to", to);
      if (statuses.length) params.set("statuses", statuses.join(","));
      if (search) params.set("search", search);
      if (phone) params.set("phone", phone);
    }
    window.open(`/api/orders/export?${params}`, "_blank");
  }

  const countByStatus = Object.fromEntries(
    ORDER_STATUSES.map((s) => [s, orders.filter((o) => o.status === s).length])
  );

  const allSelected  = orders.length > 0 && selected.size === orders.length;
  const someSelected = selected.size > 0 && !allSelected;
  const hasSelection = selected.size > 0;

  const statusLabel = (s: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      OPEN: t.orders.statusOpen,
      PAUSED: t.orders.statusPaused,
      DONE: t.orders.statusDone,
      CANCELED: t.orders.statusCanceled,
    };
    return map[s];
  };

  const ratingLabel = (r: ClientRating) => ({
    FIRST_TIMER: t.orders.ratingFirstTimer,
    CASUAL: t.orders.ratingCasual,
    FREQUENT: t.orders.ratingFrequent,
  }[r]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "#3D2200" }}>{t.orders.title}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t.orders.subtitle}</p>
      </div>

    <div className="space-y-3">

      {/* ── Filter toolbar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 space-y-3">

        {/* Row 1: date range + search fields */}
        <div className="flex flex-wrap gap-2">

          {/* Date range — unified control */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden text-sm divide-x divide-gray-200 min-w-0">
            <div className="flex items-center gap-2 px-3 py-2">
              <IconCalendar />
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="bg-transparent outline-none text-gray-700 text-sm w-32"
              />
            </div>
            <span className="px-2.5 text-gray-300 text-base select-none">→</span>
            <div className="flex items-center px-3 py-2">
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="bg-transparent outline-none text-gray-700 text-sm w-32"
              />
            </div>
          </div>

          {/* Today quick filter */}
          {(() => {
            const isToday = from === today && to === today;
            return (
              <button
                onClick={() => isToday ? (setFrom(""), setTo("")) : (setFrom(today), setTo(today))}
                style={isToday ? { backgroundColor: '#8B5A2B', color: '#fff', borderColor: '#8B5A2B' } : undefined}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                  isToday
                    ? "shadow-sm"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {t.orders.today}
              </button>
            );
          })()}

          {/* Search inputs */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 min-w-[160px] flex-1">
            <IconSearch />
            <input
              type="text"
              placeholder={t.orders.searchName}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full"
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 min-w-[150px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gray-400 shrink-0">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.24 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.59a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/>
            </svg>
            <input
              type="text"
              placeholder={t.orders.searchPhone}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full"
            />
          </div>

          {/* Export button — top right */}
          <button
            onClick={handleExport}
            disabled={loading}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-brand-200 text-brand-700 hover:bg-brand-50 disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            <IconDownload />
            {t.orders.export}
          </button>
        </div>

        {/* Row 2: status + payment pill chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-medium mr-1">{t.orders.status}</span>
          {ORDER_STATUSES.map((s) => {
            const active = statuses.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                style={active ? { backgroundColor: '#8B5A2B', color: '#fff', borderColor: '#8B5A2B' } : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? "shadow-sm"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: active ? 'rgba(255,255,255,0.7)' : '#D1D5DB' }}
                />
                {statusLabel(s)} ({countByStatus[s] ?? 0})
              </button>
            );
          })}

          <span className="w-px h-4 bg-gray-200 mx-1" />
          <span className="text-xs text-gray-400 font-medium mr-1">{t.orders.colPayment}</span>
          {PAYMENT_STATUSES.map((s) => {
            const active = paymentStatuses.includes(s);
            const label = s === "PAID" ? t.orders.paymentPaid : t.orders.paymentNotPaid;
            return (
              <button
                key={s}
                onClick={() => togglePaymentStatus(s)}
                style={active ? { backgroundColor: '#8B5A2B', color: '#fff', borderColor: '#8B5A2B' } : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? "shadow-sm"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: active ? 'rgba(255,255,255,0.7)' : '#D1D5DB' }}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Contextual selection bar (appears when rows are checked) ── */}
      {hasSelection && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-brand-700 text-white rounded-2xl shadow-md animate-in fade-in">
          <span className="text-sm font-semibold tabular-nums">
            {t.orders.selectedCount(selected.size)}
          </span>
          <span className="w-px h-4 bg-white/20" />
          <button
            onClick={handleBulkDone}
            disabled={markingDone}
            className="flex items-center gap-1.5 text-sm font-medium bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            <IconCheck />
            {markingDone ? t.orders.markingDone : t.orders.markDone(selected.size)}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-sm font-medium bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors"
          >
            <IconDownload />
            {t.orders.exportCount(selected.size)}
          </button>
          {(() => {
            const allSelectedExpanded = Array.from(selected).every((id) => expandedIds.has(id));
            return (
              <button
                onClick={allSelectedExpanded ? collapseSelected : expandSelected}
                className="flex items-center gap-1.5 text-sm font-medium bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors"
              >
                <IconChevron expanded={allSelectedExpanded} rtl={rtl} />
                {allSelectedExpanded ? t.orders.collapse : t.orders.expand}
              </button>
            );
          })()}
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-white/60 hover:text-white text-lg leading-none transition-colors"
            title={t.orders.clearSelection}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Results count (when nothing selected) ── */}
      {!hasSelection && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-gray-400">
            {loading ? t.orders.loadingOrders : t.orders.orderCount(orders.length)}
          </p>
          <div className="flex items-center gap-3">
            {orders.length > 0 && (
              <button
                onClick={allExpanded ? collapseAll : expandAll}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                <IconChevron expanded={allExpanded} rtl={rtl} />
                {allExpanded ? t.orders.collapseAll : t.orders.expandAll}
              </button>
            )}
            {orders.length > 0 && (
              <button
                onClick={handleBulkDone}
                disabled={loading || markingDone}
                className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-800 disabled:opacity-40 transition-colors"
              >
                <IconCheck />
                {t.orders.markAllDone}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Production Summary ── */}
      {!loading && orders.length > 0 && (
        <div className="bg-white rounded-2xl border border-brand-100 overflow-hidden" style={{ boxShadow: "0 1px 6px rgba(61,34,0,0.07)" }}>
          {/* Header — always visible, click to toggle */}
          <button
            onClick={() => setSummaryOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-brand-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base leading-none">📋</span>
              <span className="font-semibold text-brand-800 text-sm">{t.orders.summaryTitle}</span>
              <span className="text-xs text-gray-400">
                {t.orders.summarySubtitle(
                  summary.length,
                  summary.reduce((s, e) => s + e.totalQty, 0),
                )}
              </span>
            </div>
            <IconChevron expanded={summaryOpen} rtl={rtl} />
          </button>

          {/* Collapsible body */}
          {summaryOpen && (
            summary.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-gray-400">{t.orders.summaryEmpty}</p>
            ) : (
              <>
                {summary.map((entry) => (
                  <div
                    key={entry.productId}
                    className="flex items-center gap-3 px-4 py-3.5 border-t border-gray-100"
                  >
                    {/* Product photo */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-brand-50">
                      {entry.pictureUrl
                        ? <img src={entry.pictureUrl} alt={entry.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xl leading-none">🍞</div>
                      }
                    </div>

                    {/* Name + qty — grouped as one unit */}
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-gray-900 text-sm truncate">{entry.name}</span>
                      <span
                        className="flex-shrink-0 text-sm font-bold tabular-nums rounded-full px-2.5 py-0.5"
                        style={{ background: "#F0DFB3", color: "#5C3310" }}
                      >
                        ×{entry.totalQty}
                      </span>
                    </div>

                    {/* Total value — secondary */}
                    <span className="flex-shrink-0 text-sm tabular-nums text-gray-400 text-end w-14">
                      {formatPrice(entry.totalValue)}
                    </span>
                  </div>
                ))}

                {/* Footer total */}
                <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                  <span className="text-xs text-gray-400">{t.orders.total}</span>
                  <span className="font-bold text-gray-900 text-sm tabular-nums">
                    {formatPrice(summary.reduce((s, e) => s + e.totalValue, 0))}
                  </span>
                </div>
              </>
            )
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleSelectAll}
                    className="rounded accent-brand-700"
                  />
                </th>
                {[t.orders.colClient, t.orders.colPhone, t.orders.colDelivery, t.orders.colTotal, t.orders.colPayment, t.orders.colStatus].map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i === 3 ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                      <span className="text-sm">{t.orders.loadingOrders}</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400 text-sm">
                    {t.orders.noOrders}
                  </td>
                </tr>
              )}

              {!loading && orders.map((order) => {
                const isExpanded = expandedIds.has(order.id);
                return (
                  <Fragment key={order.id}>
                    <tr
                      onClick={() => toggleExpand(order.id)}
                      className={`transition-colors cursor-pointer group ${
                        selected.has(order.id)
                          ? "bg-brand-50"
                          : isExpanded
                          ? "bg-amber-50/50"
                          : "hover:bg-gray-50/80"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selected.has(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded accent-brand-700"
                        />
                      </td>

                      {/* Name + chevron */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <IconChevron expanded={isExpanded} rtl={rtl} />
                          <span className="font-medium text-gray-900">{order.clientName}</span>
                        </div>
                      </td>

                      {/* Phone — WhatsApp link */}
                      <td className="px-4 py-3.5">
                        <a
                          href={`https://wa.me/${order.clientPhone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-green-700 hover:text-green-900 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.122 1.522 5.854L.057 23.707l5.985-1.573A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.016-1.375l-.36-.213-3.731.981.997-3.638-.235-.374A9.817 9.817 0 0 1 2.182 12C2.182 6.573 6.573 2.182 12 2.182c5.428 0 9.818 4.39 9.818 9.818 0 5.428-4.39 9.818-9.818 9.818z"/>
                          </svg>
                          {order.clientPhone}
                        </a>
                      </td>

                      {/* Pickup date */}
                      <td className="px-4 py-3.5 text-gray-500 text-sm tabular-nums">
                        {formatDate(order.deliveryDate)}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-900 tabular-nums">
                        {formatPrice(order.totalPrice)}
                      </td>

                      {/* Payment status — click to toggle */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); void handlePaymentToggle(order.id, order.paymentStatus); }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-75 ${
                            order.paymentStatus === "PAID"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {order.paymentStatus === "PAID" ? t.orders.paymentPaid : t.orders.paymentNotPaid}
                        </button>
                      </td>

                      {/* Status badge dropdown */}
                      <td className="px-4 py-3.5">
                        <div
                          className="relative inline-block"
                          ref={openDropdownId === order.id ? dropdownRef : null}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId((prev) => prev === order.id ? null : order.id);
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-75 ${STATUS_COLORS[order.status]}`}
                          >
                            {statusLabel(order.status)}
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                          </button>

                          {openDropdownId === order.id && (
                            <div className="absolute left-0 top-full mt-1.5 z-30 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 min-w-[130px] overflow-hidden">
                              {ORDER_STATUSES.map((s) => (
                                <button
                                  key={s}
                                  onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, s); }}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-gray-50 ${
                                    s === order.status ? "font-semibold text-brand-700" : "text-gray-600"
                                  }`}
                                >
                                  {s === order.status && <IconCheck />}
                                  {s !== order.status && <span className="w-3.5" />}
                                  {statusLabel(s)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr className="bg-amber-50/50">
                        <td colSpan={7} className="px-5 pt-0 pb-4">
                          <div
                            className="ms-2 sm:ms-12 rounded-xl overflow-hidden bg-white border border-brand-100"
                            style={{ boxShadow: "0 1px 6px rgba(61,34,0,0.07)" }}
                          >
                            {/* Item rows — every row has a divider for clear scanning */}
                            {order.orderItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100"
                              >
                                {/* Product photo — 48 px so the baker can visually confirm the item */}
                                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-brand-50">
                                  {item.product.pictureUrl
                                    ? <img src={item.product.pictureUrl} alt={item.product.name} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-xl leading-none">🍞</div>
                                  }
                                </div>

                                {/* Name + qty badge grouped — read as one unit */}
                                <div className="flex-1 flex items-center gap-2 min-w-0">
                                  <span className="font-semibold text-gray-900 text-sm leading-snug truncate">
                                    {item.product.name}
                                  </span>
                                  <span
                                    className="flex-shrink-0 text-sm font-bold tabular-nums rounded-full px-2.5 py-0.5"
                                    style={{ background: "#F0DFB3", color: "#5C3310" }}
                                  >
                                    ×{item.quantity}
                                  </span>
                                </div>

                                {/* Subtotal — secondary, visually recedes */}
                                <span className="flex-shrink-0 text-sm tabular-nums text-gray-400 text-end w-14">
                                  {formatPrice(Number(item.priceAtPurchase) * item.quantity)}
                                </span>
                              </div>
                            ))}

                            {/* Footer: meta + order total */}
                            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="tabular-nums">{formatDate(order.createdAt)}</span>
                                <span>·</span>
                                <span className={`px-2 py-0.5 rounded-full font-medium ${RATING_COLORS[order.clientRating]}`}>
                                  {ratingLabel(order.clientRating)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">{t.orders.total}</span>
                                <span className="font-bold text-gray-900 text-sm tabular-nums">{formatPrice(order.totalPrice)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  );
}
