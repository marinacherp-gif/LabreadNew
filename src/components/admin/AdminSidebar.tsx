"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import { useLanguage } from "@/context/LanguageContext";

// ── SVG Icons ────────────────────────────────────────────────────────────────

function IconOrders() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="12" y2="16"/>
    </svg>
  );
}

function IconCatalog() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function IconSignOut() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function IconHamburger() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

// ── Nav config ───────────────────────────────────────────────────────────────

const NAV_KEYS = [
  { href: "/dashboard", key: "orders"   as const, Icon: IconOrders },
  { href: "/catalog",   key: "catalog"  as const, Icon: IconCatalog },
  { href: "/settings",  key: "settings" as const, Icon: IconSettings },
];
const ADMIN_KEY = { href: "/users", key: "users" as const, Icon: IconUsers };

// ── LangSwitcher ─────────────────────────────────────────────────────────────

function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useLanguage();
  return (
    <div className={`flex items-center gap-1 ${compact ? "justify-center py-1" : "px-3 py-2"}`}>
      {(["en", "he"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className="px-2 py-0.5 rounded text-xs font-semibold transition-colors"
          style={
            lang === l
              ? { backgroundColor: "#C49A45", color: "#1A0E00" }
              : { color: "#8B7355" }
          }
        >
          {l === "en" ? t.nav.langEn : t.nav.langHe}
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  userEmail: string;
  userRole: Role;
  userName?: string | null;
}

export default function AdminSidebar({ userEmail, userRole, userName }: Props) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const navKeys = userRole === "ADMIN" ? [...NAV_KEYS, ADMIN_KEY] : NAV_KEYS;

  // Desktop: collapsed/expanded, persisted across sessions
  const [collapsed, setCollapsed] = useState(false);

  // Mobile: drawer open/closed
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    if (localStorage.getItem("admin_sidebar_collapsed") === "true") {
      setCollapsed(true);
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin_sidebar_collapsed", String(next));
      return next;
    });
  }

  // Close mobile drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <>
      {/* ══ Desktop sidebar (md+) ══════════════════════════════════════════ */}
      <aside
        className={`hidden md:flex flex-col shrink-0 sticky top-0 h-screen bg-brand-800 text-brand-100 overflow-hidden transition-[width] duration-300 ${
          collapsed ? "w-14" : "w-56"
        }`}
      >
        {/* Header: logo + collapse toggle */}
        <div
          className={`flex items-center border-b border-brand-700 ${
            collapsed ? "justify-center px-2 py-[22px]" : "justify-between px-5 py-[22px]"
          }`}
        >
          {!collapsed && (
            <Link href="/dashboard">
              <img
                src="/labread_logo.jpg"
                alt="Labread"
                className="w-24 h-auto rounded-lg hover:opacity-80 transition-opacity"
              />
            </Link>
          )}
          <button
            onClick={toggleCollapsed}
            title={collapsed ? t.nav.adminPanel : undefined}
            className="p-1.5 rounded-lg text-brand-400 hover:text-brand-50 hover:bg-brand-700 transition-colors"
          >
            <IconHamburger />
          </button>
        </div>

        {!collapsed && (
          <p className="text-xs text-brand-300 mt-4 px-5 tracking-widest uppercase">
            {t.nav.adminPanel}
          </p>
        )}

        {/* Nav */}
        <nav className={`flex-1 py-4 space-y-0.5 ${collapsed ? "px-2" : "px-3"}`}>
          {navKeys.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? t.nav[item.key] : undefined}
                className={`flex items-center rounded-xl text-sm font-medium transition-all ${
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                } ${
                  active
                    ? "bg-brand-100 text-brand-800 shadow-sm"
                    : "text-brand-200 hover:bg-brand-700 hover:text-brand-50"
                }`}
              >
                <item.Icon />
                {!collapsed && <span>{t.nav[item.key]}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {collapsed ? (
          <div className="flex flex-col items-center pb-5 pt-3 border-t border-brand-700 gap-2">
            <LangSwitcher compact />
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              title={t.nav.signOut}
              className="p-2 rounded-xl text-brand-400 hover:text-brand-50 hover:bg-brand-700 transition-colors"
            >
              <IconSignOut />
            </button>
          </div>
        ) : (
          <div className="px-3 pb-5 pt-3 border-t border-brand-700 space-y-1">
            <div className="px-3 mb-1">
              <p className="text-xs font-medium text-brand-100 truncate">{userName ?? userEmail}</p>
              <p className="text-xs text-brand-400 mt-0.5">
                {userRole === "ADMIN" ? t.nav.administrator : t.nav.viewer}
              </p>
            </div>
            <LangSwitcher />
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-brand-300 hover:text-brand-50 hover:bg-brand-700 rounded-xl transition-colors"
            >
              <IconSignOut />
              {t.nav.signOut}
            </button>
          </div>
        )}
      </aside>

      {/* ══ Mobile top bar (<md) ══════════════════════════════════════════ */}
      <header className="md:hidden sticky top-0 z-40 flex items-center bg-brand-800 text-white px-4 py-3 shadow-md">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 -ml-1 rounded-lg hover:bg-brand-700 transition-colors shrink-0"
          aria-label="Open menu"
        >
          <IconHamburger />
        </button>
        <Link href="/dashboard" className="mx-auto">
          <img
            src="/labread_logo.jpg"
            alt="Labread"
            className="h-8 w-auto rounded hover:opacity-80 transition-opacity"
          />
        </Link>
        <div className="w-10 shrink-0" />
      </header>

      {/* ══ Mobile backdrop ══════════════════════════════════════════════ */}
      <div
        className={`md:hidden fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
          drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* ══ Mobile slide-out drawer ══════════════════════════════════════ */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-brand-800 text-brand-100 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-700">
          <Link href="/dashboard" onClick={() => setDrawerOpen(false)}>
            <img
              src="/labread_logo.jpg"
              alt="Labread"
              className="w-24 h-auto rounded-lg hover:opacity-80 transition-opacity"
            />
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-lg hover:bg-brand-700 transition-colors text-brand-300 hover:text-brand-50"
            aria-label="Close menu"
          >
            <IconClose />
          </button>
        </div>

        <p className="text-xs text-brand-300 mt-4 px-5 tracking-widest uppercase">
          {t.nav.adminPanel}
        </p>

        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {navKeys.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-brand-100 text-brand-800 shadow-sm"
                    : "text-brand-200 hover:bg-brand-700 hover:text-brand-50"
                }`}
              >
                <item.Icon />
                {t.nav[item.key]}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-6 pt-3 border-t border-brand-700 space-y-1">
          <div className="px-3 mb-1">
            <p className="text-xs font-medium text-brand-100 truncate">{userName ?? userEmail}</p>
            <p className="text-xs text-brand-400 mt-0.5">
              {userRole === "ADMIN" ? t.nav.administrator : t.nav.viewer}
            </p>
          </div>
          <LangSwitcher />
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-brand-300 hover:text-brand-50 hover:bg-brand-700 rounded-xl transition-colors"
          >
            <IconSignOut />
            {t.nav.signOut}
          </button>
        </div>
      </div>
    </>
  );
}
