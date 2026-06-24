"use client";

import { useEffect, useState } from "react";
import type { WorkingHours, Announcement } from "@/types";
import { DAYS_OF_WEEK } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

// ─── Schedule helpers ─────────────────────────────────────────────────────────

type DayState = { open: boolean; from: string; to: string };
type Schedule = Record<string, DayState>;

function parseHours(value: string): DayState {
  if (!value) return { open: false, from: "08:00", to: "18:00" };
  const parts = value.split(" - ");
  return { open: true, from: parts[0] ?? "08:00", to: parts[1] ?? "18:00" };
}

function toWorkingHours(schedule: Schedule): WorkingHours {
  return Object.fromEntries(
    Object.entries(schedule).map(([day, s]) => [day, s.open ? `${s.from} - ${s.to}` : ""])
  ) as WorkingHours;
}

const SEED: Record<string, string> = {
  SUN: "", MON: "08:00 - 18:00", TUE: "08:00 - 18:00",
  WED: "08:00 - 18:00", THU: "08:00 - 18:00", FRI: "08:00 - 15:00", SAT: "",
};
const DEFAULT_SCHEDULE: Schedule = Object.fromEntries(
  DAYS_OF_WEEK.map((day) => [day, parseHours(SEED[day] ?? "")])
);

// ─── Announcement helpers ─────────────────────────────────────────────────────

type Draft = {
  id: string | null; // null = new
  text: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function emptyDraft(): Draft {
  return { id: null, text: "", isActive: true, startDate: todayStr(), endDate: "" };
}

function formatDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        width: 44,
        height: 24,
        borderRadius: 12,
        padding: 3,
        backgroundColor: on ? "#8B5A2B" : "#D1C4B8",
        border: "none",
        cursor: "pointer",
        transition: "background-color 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: "block",
          width: 18,
          height: 18,
          borderRadius: "50%",
          backgroundColor: "#fff",
          transform: on ? "translateX(20px)" : "translateX(0)",
          transition: "transform 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

// ─── Announcement draft form ──────────────────────────────────────────────────

function DraftForm({
  draft,
  isNew,
  onChange,
  onSave,
  onCancel,
  error,
}: {
  draft: Draft;
  isNew: boolean;
  onChange: (patch: Partial<Draft>) => void;
  onSave: () => void;
  onCancel: () => void;
  error: string;
}) {
  const { t } = useLanguage();
  return (
    <div
      className="rounded-xl border-2 p-4 space-y-3"
      style={{ borderColor: "#C49A45", backgroundColor: "#FAF6EC" }}
    >
      <textarea
        value={draft.text}
        onChange={(e) => onChange({ text: e.target.value })}
        rows={3}
        placeholder={t.settings.announcementPlaceholder}
        autoFocus
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white resize-none"
        style={{ color: "#1A0E00" }}
      />

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: "#5C3310" }}>{t.settings.startDate}</label>
          <input
            type="date"
            value={draft.startDate}
            min={isNew ? todayStr() : undefined}
            onChange={(e) => onChange({ startDate: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 bg-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: "#5C3310" }}>
            {t.settings.endDate} <span className="font-normal text-gray-400">{t.settings.endDateOptional}</span>
          </label>
          <input
            type="date"
            value={draft.endDate}
            min={draft.startDate || todayStr()}
            onChange={(e) => onChange({ endDate: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 bg-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Toggle on={draft.isActive} onChange={(v) => onChange({ isActive: v })} />
        <span className="text-sm font-medium" style={{ color: draft.isActive ? "#5C3310" : "#9CA3AF" }}>
          {draft.isActive ? t.settings.activeLabel : t.settings.inactiveLabel}
        </span>
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-white"
        >
          {t.settings.cancelBtn}
        </button>
        <button
          type="button"
          onClick={onSave}
          className="px-4 py-1.5 text-sm rounded-lg text-white font-medium"
          style={{ backgroundColor: "#5C3310" }}
        >
          {isNew ? t.settings.addAnnouncementBtn : t.settings.saveChangesBtn}
        </button>
      </div>
    </div>
  );
}

// ─── Announcement card ────────────────────────────────────────────────────────

function AnnouncementCard({
  ann,
  draftOpen,
  onToggle,
  onEdit,
  onDelete,
}: {
  ann: Announcement;
  draftOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  const today = todayStr();
  const started = ann.startDate <= today;
  const ended = ann.endDate !== null && ann.endDate < today;
  const scheduled = !started;

  let statusBadge = "";
  let statusColor = "";
  if (ended) { statusBadge = t.settings.statusEnded; statusColor = "#9CA3AF"; }
  else if (scheduled) { statusBadge = t.settings.statusScheduled; statusColor = "#C49A45"; }

  return (
    <div className="flex items-start gap-3 px-6 py-4">
      <div className="pt-0.5 shrink-0">
        <Toggle on={ann.isActive} onChange={onToggle} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm leading-snug"
          style={{ color: ann.isActive && !ended ? "#1A0E00" : "#9CA3AF" }}
        >
          {ann.text}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            {formatDate(ann.startDate)}
            {ann.endDate ? ` → ${formatDate(ann.endDate)}` : ` → ${t.settings.noEndDate}`}
          </p>
          {statusBadge && (
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded"
              style={{ backgroundColor: "#F3F4F6", color: statusColor }}
            >
              {statusBadge}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          disabled={draftOpen}
          title="Edit"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={draftOpen}
          title="Delete"
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export default function SettingsForm() {
  const { t } = useLanguage();
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftError, setDraftError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.workingHours && Object.keys(data.workingHours).length > 0) {
          const parsed: Schedule = Object.fromEntries(
            DAYS_OF_WEEK.map((day) => [day, parseHours((data.workingHours as WorkingHours)[day] ?? "")])
          );
          setSchedule(parsed);
        }
        if (Array.isArray(data.announcements)) {
          setAnnouncements(data.announcements);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function setDay(day: string, patch: Partial<DayState>) {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  }

  function startAdd() {
    setDraft(emptyDraft());
    setDraftError("");
  }

  function startEdit(ann: Announcement) {
    setDraft({ id: ann.id, text: ann.text, isActive: ann.isActive, startDate: ann.startDate, endDate: ann.endDate ?? "" });
    setDraftError("");
  }

  function cancelDraft() {
    setDraft(null);
    setDraftError("");
  }

  async function persistConfig(currentAnnouncements: Announcement[]) {
    setSaving(true);
    setSaved(false);
    await fetch("/api/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workingHours: toWorkingHours(schedule), announcements: currentAnnouncements }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function commitDraft() {
    if (!draft) return;
    if (!draft.text.trim()) { setDraftError(t.settings.errText); return; }
    if (!draft.startDate) { setDraftError(t.settings.errStartDate); return; }
    if (draft.id === null && draft.startDate < todayStr()) { setDraftError(t.settings.errStartPast); return; }
    if (draft.endDate && draft.endDate < draft.startDate) { setDraftError(t.settings.errEndDate); return; }

    const ann: Announcement = {
      id: draft.id ?? crypto.randomUUID(),
      text: draft.text.trim(),
      isActive: draft.isActive,
      startDate: draft.startDate,
      endDate: draft.endDate || null,
    };

    const newAnnouncements = draft.id === null
      ? [...announcements, ann]
      : announcements.map((a) => (a.id === ann.id ? ann : a));

    setAnnouncements(newAnnouncements);
    setDraft(null);
    setDraftError("");
    await persistConfig(newAnnouncements);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (draft) { setDraftError(t.settings.errFinishEditing); return; }
    await persistConfig(announcements);
  }

  if (loading) {
    return <div className="text-center py-16 text-gray-400">{t.settings.loading}</div>;
  }

  const addingNew = draft?.id === null;

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "#3D2200" }}>{t.settings.title}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t.settings.subtitle}</p>
      </div>

      {/* ── Special Announcements ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold" style={{ color: "#3D2200" }}>{t.settings.announcementsTitle}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t.settings.announcementsSubtitle}</p>
          </div>
          {!draft && (
            <button
              type="button"
              onClick={startAdd}
              className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg shrink-0"
              style={{ color: "#5C3310", backgroundColor: "#F0DFB3" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {t.settings.addBtn}
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {announcements.length === 0 && !draft && (
            <p className="px-6 py-10 text-sm text-center text-gray-400">
              {t.settings.noAnnouncements}
            </p>
          )}

          {announcements.map((ann) =>
            draft?.id === ann.id ? (
              <div key={ann.id} className="px-6 py-4">
                <DraftForm
                  draft={draft}
                  isNew={false}
                  onChange={(patch) => setDraft((prev) => prev && { ...prev, ...patch })}
                  onSave={commitDraft}
                  onCancel={cancelDraft}
                  error={draftError}
                />
              </div>
            ) : (
              <AnnouncementCard
                key={ann.id}
                ann={ann}
                draftOpen={!!draft}
                onToggle={() => setAnnouncements((prev) => prev.map((a) => a.id === ann.id ? { ...a, isActive: !a.isActive } : a))}
                onEdit={() => startEdit(ann)}
                onDelete={() => setAnnouncements((prev) => prev.filter((a) => a.id !== ann.id))}
              />
            )
          )}

          {addingNew && draft && (
            <div className="px-6 py-4">
              <DraftForm
                draft={draft}
                isNew={true}
                onChange={(patch) => setDraft((prev) => prev && { ...prev, ...patch })}
                onSave={commitDraft}
                onCancel={cancelDraft}
                error={draftError}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Working Hours ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold" style={{ color: "#3D2200" }}>{t.settings.workingHoursTitle}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{t.settings.workingHoursSubtitle}</p>
        </div>

        <div className="divide-y divide-gray-100">
          {DAYS_OF_WEEK.map((day) => {
            const s = schedule[day];
            return (
              <div key={day} className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-3">
                <span className="text-sm font-semibold w-8 sm:w-10 shrink-0" style={{ color: "#3D2200" }}>
                  {t.settings.dayLabels[day as keyof typeof t.settings.dayLabels]}
                </span>
                <Toggle on={s.open} onChange={(v) => setDay(day, { open: v })} />
                {s.open ? (
                  <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                    <input
                      type="time"
                      value={s.from}
                      onChange={(e) => setDay(day, { from: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 flex-1 min-w-0"
                    />
                    <span className="text-gray-400 text-sm select-none">—</span>
                    <input
                      type="time"
                      value={s.to}
                      onChange={(e) => setDay(day, { to: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 flex-1 min-w-0"
                    />
                  </div>
                ) : (
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "#F3F4F6", color: "#9CA3AF" }}
                  >
                    {t.settings.closed}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Public API note ── */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-sm text-brand-800">
        {t.settings.publicApiNote}{" "}
        <code className="bg-brand-100 px-1 rounded">/api/public/bakery-info</code>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          style={{ backgroundColor: "#5C3310", color: "#fff" }}
          className="px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50 transition-opacity"
        >
          {saving ? t.settings.savingSettings : t.settings.saveSettings}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">{t.settings.savedSuccess}</span>}
        {draft && draftError && (
          <span className="text-sm text-red-600">{draftError}</span>
        )}
      </div>
    </form>
  );
}
