"use client";

import {
  createContext, useContext, useEffect, useRef, useState, useCallback,
} from "react";
import type { Product } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const SHOPPING_MS = 20 * 60 * 1000;
const WARNING_MS  =  2 * 60 * 1000;

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionStatus = "idle" | "browsing" | "active" | "expiry_warning";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderSessionContextType {
  status: SessionStatus;
  orderDate: Date | null;
  orderDayCode: string | null;
  cart: CartItem[];
  timerEnd: number | null;
  warningEnd: number | null;
  showDatePicker: boolean;
  showFirstItemModal: boolean;
  reserveError: string | null;
  cartExpiredNotice: boolean;
  sessionId: string;

  cartCount: number;
  cartTotal: number;
  secondsRemaining: number;
  warningSecondsRemaining: number;

  openDatePicker: () => void;
  closeDatePicker: () => void;
  selectDate: (date: Date) => Promise<void>;
  confirmDateChange: (date: Date, itemsToRemove: CartItem[]) => void;
  addItem: (product: Product) => Promise<boolean>;
  decrementItem: (product: Product) => Promise<void>;
  confirmPresence: () => void;
  resetSession: () => Promise<void>;
  clearCartAfterOrder: () => void;
  dismissFirstItemModal: () => void;
  clearReserveError: () => void;
  dismissExpiredNotice: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return `s${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
}

function dayCode(date: Date) {
  return ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][date.getDay()];
}

async function apiReserve(productId: string, sessionId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/cart/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, sessionId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function apiRelease(productId: string, sessionId: string, quantity = 1) {
  fetch("/api/cart/release", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, sessionId, quantity }),
  }).catch(() => {});
}

function apiReleaseAll(items: CartItem[], sessionId: string) {
  if (!items.length) return;
  fetch("/api/cart/release-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
    }),
  }).catch(() => {});
}

// ─── Context ──────────────────────────────────────────────────────────────────

const OrderSessionContext = createContext<OrderSessionContextType>(null!);

export function useOrderSession() {
  return useContext(OrderSessionContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function OrderSessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus]             = useState<SessionStatus>("idle");
  const [orderDate, setOrderDate]       = useState<Date | null>(null);
  const [orderDayCode, setOrderDayCode] = useState<string | null>(null);
  const [cart, setCart]                 = useState<CartItem[]>([]);
  const [timerEnd, setTimerEnd]         = useState<number | null>(null);
  const [warningEnd, setWarningEnd]     = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker]         = useState(false);
  const [showFirstItemModal, setShowFirstItemModal] = useState(false);
  const [reserveError, setReserveError]             = useState<string | null>(null);
  const [cartExpiredNotice, setCartExpiredNotice]   = useState(false);
  const [sessionId]                     = useState(genId);
  const [, setTick]                     = useState(0);

  // Refs for stale-closure-safe access inside the interval
  const statusRef      = useRef(status);
  const timerEndRef    = useRef(timerEnd);
  const warningEndRef  = useRef(warningEnd);
  const cartRef        = useRef(cart);
  const sessionIdRef   = useRef(sessionId);

  statusRef.current     = status;
  timerEndRef.current   = timerEnd;
  warningEndRef.current = warningEnd;
  cartRef.current       = cart;
  sessionIdRef.current  = sessionId;

  // ── Timer interval ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (status !== "active" && status !== "expiry_warning") return;

    const id = setInterval(() => {
      setTick(t => t + 1); // force re-render for countdown display

      const now = Date.now();
      const s   = statusRef.current;
      const te  = timerEndRef.current;
      const we  = warningEndRef.current;

      if (s === "active" && te && now >= te) {
        const wEnd = now + WARNING_MS;
        statusRef.current    = "expiry_warning";
        timerEndRef.current  = null;
        warningEndRef.current = wEnd;
        setStatus("expiry_warning");
        setTimerEnd(null);
        setWarningEnd(wEnd);

      } else if (s === "expiry_warning" && we && now >= we) {
        const itemsToRelease = [...cartRef.current];
        // Immediately update refs so subsequent ticks don't re-fire
        statusRef.current    = "idle";
        warningEndRef.current = null;
        timerEndRef.current  = null;
        cartRef.current      = [];
        // Reset state
        setStatus("idle");
        setCart([]);
        setOrderDate(null);
        setOrderDayCode(null);
        setTimerEnd(null);
        setWarningEnd(null);
        setShowDatePicker(true);
        setShowFirstItemModal(false);
        setCartExpiredNotice(true);
        // Release stock in background
        apiReleaseAll(itemsToRelease, sessionIdRef.current);
      }
    }, 500);

    return () => clearInterval(id);
  }, [status]);

  // ── Unload cleanup (beacon) ────────────────────────────────────────────────

  useEffect(() => {
    const onUnload = () => {
      if (!cartRef.current.length) return;
      navigator.sendBeacon(
        "/api/cart/release-all",
        JSON.stringify({
          sessionId: sessionIdRef.current,
          items: cartRef.current.map(i => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
        }),
      );
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const openDatePicker  = useCallback(() => setShowDatePicker(true), []);
  const closeDatePicker = useCallback(() => setShowDatePicker(false), []);

  const selectDate = useCallback(async (date: Date) => {
    // Release current cart if changing date mid-session
    const prev = [...cartRef.current];
    if (prev.length) {
      cartRef.current = [];
      setCart([]);
      apiReleaseAll(prev, sessionIdRef.current);
    }
    const code = dayCode(date);
    setOrderDate(date);
    setOrderDayCode(code);
    setStatus("browsing");
    setTimerEnd(null);
    setWarningEnd(null);
    statusRef.current    = "browsing";
    timerEndRef.current  = null;
    warningEndRef.current = null;
    setShowDatePicker(false);
    setCartExpiredNotice(false);
  }, []);

  const confirmDateChange = useCallback((date: Date, itemsToRemove: CartItem[]) => {
    if (itemsToRemove.length > 0) {
      apiReleaseAll(itemsToRemove, sessionIdRef.current);
      const idsToRemove = new Set(itemsToRemove.map(i => i.product.id));
      const newCart = cartRef.current.filter(i => !idsToRemove.has(i.product.id));
      cartRef.current = newCart;
      setCart(newCart);
      if (newCart.length === 0) {
        statusRef.current = "browsing";
        timerEndRef.current = null;
        warningEndRef.current = null;
        setStatus("browsing");
        setTimerEnd(null);
        setWarningEnd(null);
      } else {
        const newEnd = Date.now() + SHOPPING_MS;
        timerEndRef.current = newEnd;
        setTimerEnd(newEnd);
      }
    }
    const code = dayCode(date);
    setOrderDate(date);
    setOrderDayCode(code);
    setShowDatePicker(false);
    setCartExpiredNotice(false);
  }, []);

  const addItem = useCallback(async (product: Product): Promise<boolean> => {
    // No date selected → force the picker open
    if (statusRef.current === "idle") {
      setShowDatePicker(true);
      return false;
    }

    const wasEmpty = cartRef.current.length === 0;

    const ok = await apiReserve(product.id, sessionIdRef.current);
    if (!ok) {
      setReserveError(product.name);
      return false;
    }

    const newTimerEnd = Date.now() + SHOPPING_MS;
    timerEndRef.current = newTimerEnd;
    setTimerEnd(newTimerEnd);

    setCart(prev => {
      const hit = prev.find(i => i.product.id === product.id);
      if (hit) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });

    if (wasEmpty) {
      statusRef.current = "active";
      setStatus("active");
      setShowFirstItemModal(true);
    }

    return true;
  }, []);

  const decrementItem = useCallback(async (product: Product) => {
    const hit = cartRef.current.find(i => i.product.id === product.id);
    if (!hit) return;

    apiRelease(product.id, sessionIdRef.current, 1);

    const newCart = cartRef.current
      .map(i => i.product.id === product.id ? { ...i, quantity: i.quantity - 1 } : i)
      .filter(i => i.quantity > 0);

    cartRef.current = newCart;
    setCart(newCart);

    if (newCart.length === 0) {
      statusRef.current    = "browsing";
      timerEndRef.current  = null;
      warningEndRef.current = null;
      setStatus("browsing");
      setTimerEnd(null);
      setWarningEnd(null);
    } else {
      const newTimerEnd = Date.now() + SHOPPING_MS;
      timerEndRef.current = newTimerEnd;
      setTimerEnd(newTimerEnd);
    }
  }, []);

  const confirmPresence = useCallback(() => {
    const newTimerEnd = Date.now() + SHOPPING_MS;
    statusRef.current    = "active";
    timerEndRef.current  = newTimerEnd;
    warningEndRef.current = null;
    setStatus("active");
    setTimerEnd(newTimerEnd);
    setWarningEnd(null);
  }, []);

  const resetSession = useCallback(async () => {
    const items = [...cartRef.current];
    cartRef.current      = [];
    statusRef.current    = "idle";
    timerEndRef.current  = null;
    warningEndRef.current = null;
    setCart([]);
    setStatus("idle");
    setOrderDate(null);
    setOrderDayCode(null);
    setTimerEnd(null);
    setWarningEnd(null);
    setShowDatePicker(false);
    setShowFirstItemModal(false);
    setReserveError(null);
    if (items.length) apiReleaseAll(items, sessionIdRef.current);
  }, []);

  const clearCartAfterOrder = useCallback(() => {
    // Order placed: stock stays decremented, just clear local cart
    cartRef.current      = [];
    statusRef.current    = "browsing";
    timerEndRef.current  = null;
    warningEndRef.current = null;
    setCart([]);
    setStatus("browsing");
    setTimerEnd(null);
    setWarningEnd(null);
  }, []);

  const dismissFirstItemModal = useCallback(() => setShowFirstItemModal(false), []);
  const clearReserveError     = useCallback(() => setReserveError(null), []);
  const dismissExpiredNotice  = useCallback(() => setCartExpiredNotice(false), []);

  // ── Derived values ─────────────────────────────────────────────────────────

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

  const secondsRemaining = timerEnd
    ? Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000))
    : 0;

  const warningSecondsRemaining = warningEnd
    ? Math.max(0, Math.ceil((warningEnd - Date.now()) / 1000))
    : 0;

  return (
    <OrderSessionContext.Provider
      value={{
        status, orderDate, orderDayCode, cart, timerEnd, warningEnd,
        showDatePicker, showFirstItemModal, reserveError, cartExpiredNotice, sessionId,
        cartCount, cartTotal, secondsRemaining, warningSecondsRemaining,
        openDatePicker, closeDatePicker, selectDate, confirmDateChange, addItem, decrementItem,
        confirmPresence, resetSession, clearCartAfterOrder,
        dismissFirstItemModal, clearReserveError, dismissExpiredNotice,
      }}
    >
      {children}
    </OrderSessionContext.Provider>
  );
}
