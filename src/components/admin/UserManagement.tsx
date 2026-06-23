"use client";

import { useEffect, useState } from "react";
import type { User } from "@/types";
import { formatDate } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function UserManagement() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "VIEWER">("VIEWER");
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadUsers() {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setFormError("");
    setAdding(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
    });

    if (res.ok) {
      setEmail("");
      setRole("VIEWER");
      loadUsers();
    } else {
      const data = await res.json();
      setFormError(data.error ?? "Failed to add user.");
    }
    setAdding(false);
  }

  async function handleRoleChange(userId: string, newRole: "ADMIN" | "VIEWER") {
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    loadUsers();
  }

  async function handleDelete(user: User) {
    if (!confirm(t.users.confirmRemove(user.email))) return;
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Failed to remove user.");
    } else {
      loadUsers();
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "#3D2200" }}>{t.users.title}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t.users.subtitle}</p>
      </div>

      {/* Add user form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-brand-800 mb-4">{t.users.addStaffTitle}</h2>
        <form onSubmit={handleAddUser} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.users.emailPlaceholder}
            required
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "ADMIN" | "VIEWER")}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="VIEWER">{t.users.roleViewer}</option>
            <option value="ADMIN">{t.users.roleAdmin}</option>
          </select>
          <button
            type="submit"
            disabled={adding}
            style={{ backgroundColor: "#5C3310", color: "#fff" }}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {adding ? t.users.adding : t.users.addUser}
          </button>
        </form>
        {formError && (
          <p className="mt-2 text-sm text-red-600">{formError}</p>
        )}
        <p className="mt-3 text-xs text-gray-400">{t.users.permNote}</p>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-brand-800">{t.users.staffAccountsTitle}</h2>
        </div>
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-400">{t.users.loading}</div>
        ) : users.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">{t.users.noUsers}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t.users.colEmail}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t.users.colRole}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t.users.colAdded}</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 font-medium text-brand-800">{user.email}</td>
                  <td className="px-6 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as "ADMIN" | "VIEWER")}
                      className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="VIEWER">{t.users.roleViewer}</option>
                      <option value="ADMIN">{t.users.roleAdmin}</option>
                    </select>
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      {t.users.removeBtn}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
