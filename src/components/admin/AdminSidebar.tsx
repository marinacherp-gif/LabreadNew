"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import { useLanguage } from "@/context/LanguageContext";

const NAV_KEYS = [
  { href: "/dashboard", key: "orders" as const, icon: "📋" },
  { href: "/catalog",   key: "catalog" as const, icon: "🥐" },
  { href: "/settings",  key: "settings" as const, icon: "⚙️" },
];
const ADMIN_KEY = { href: "/users", key: "users" as const, icon: "👥" };

interface Props {
  userEmail: string;
  userRole: Role;
  userName?: string | null;
}

function LangSwitcher() {
  const { lang, setLang, t } = useLanguage();
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {(["en", "he"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className="px-2 py-0.5 rounded text-xs font-semibold transition-colors"
          style={lang === l
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

export default function AdminSidebar({ userEmail, userRole, userName }: Props) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const navKeys = userRole === "ADMIN" ? [...NAV_KEYS, ADMIN_KEY] : NAV_KEYS;

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 sticky top-0 h-screen bg-brand-800 text-brand-100">

        {/* Logo */}
        <div className="px-5 py-6 border-b border-brand-700">
          <Link href="/dashboard">
            <img src="/labread_logo.jpg" alt="Labread" className="w-28 h-auto rounded-lg hover:opacity-80 transition-opacity" />
          </Link>
          <p className="text-xs text-brand-300 mt-3 tracking-widest uppercase">{t.nav.adminPanel}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {navKeys.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-brand-100 text-brand-800 shadow-sm"
                    : "text-brand-200 hover:bg-brand-700 hover:text-brand-50"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {t.nav[item.key]}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
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
            className="w-full text-left px-3 py-2 text-sm text-brand-300 hover:text-brand-50 hover:bg-brand-700 rounded-xl transition-colors"
          >
            {t.nav.signOut}
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-brand-800 text-white px-4 py-3 shadow-md">
        <Link href="/dashboard">
          <img src="/labread_logo.jpg" alt="Labread" className="h-8 w-auto rounded hover:opacity-80 transition-opacity" />
        </Link>

        <nav className="flex items-center gap-1">
          {navKeys.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={t.nav[item.key]}
                className={`p-2 rounded-lg text-base transition-colors ${
                  active ? "bg-brand-600" : "hover:bg-brand-700"
                }`}
              >
                {item.icon}
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            title={t.nav.signOut}
            className="p-2 rounded-lg text-brand-300 hover:bg-brand-700 text-sm"
          >
            ⏏
          </button>
        </nav>
      </header>
    </>
  );
}
