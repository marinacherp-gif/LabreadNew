"use client";

import { useRef, useState } from "react";
import type { Product, ProductCategory } from "@/types";
import { DAYS_OF_WEEK } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  initial?: Partial<Product>;
  onSave: (data: Partial<Product>) => Promise<void>;
  onCancel: () => void;
}

export default function ProductForm({ initial, onSave, onCancel }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price ? Number(initial.price) : 0);
  const [pictureUrl, setPictureUrl] = useState(initial?.pictureUrl ?? "");
  const [availableDays, setAvailableDays] = useState<string[]>(initial?.availableDays ?? []);
  const [isVegan, setIsVegan] = useState(initial?.isVegan ?? false);
  const [containsAllergens, setContainsAllergens] = useState(initial?.containsAllergens ?? false);
  const [containsDairy, setContainsDairy] = useState(initial?.containsDairy ?? false);
  const [stockAmount, setStockAmount] = useState(initial?.stockAmount ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [category, setCategory] = useState<ProductCategory | null>(initial?.category ?? null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setPictureUrl(json.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const descLen = description?.length ?? 0;

  function toggleDay(day: string) {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError(t.product.errorName); return; }
    if (price <= 0) { setError(t.product.errorPrice); return; }
    if (descLen > 200) { setError(t.product.errorDesc); return; }

    setError("");
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description || null,
        price,
        pictureUrl: pictureUrl || null,
        availableDays,
        isVegan,
        containsAllergens,
        containsDairy,
        stockAmount,
        isActive,
        category,
      });
    } catch {
      setError(t.product.errorSave);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.product.imageLabel}</label>

        {pictureUrl ? (
          <div className="relative rounded-xl overflow-hidden bg-gray-100 mb-2" style={{ height: 160 }}>
            <img
              src={pictureUrl}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <button
              type="button"
              onClick={() => setPictureUrl("")}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-gray-500 hover:text-red-500"
              title="Remove image"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-8 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                </svg>
                <span className="text-sm">{t.product.uploading}</span>
              </>
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span className="text-sm font-medium">{t.product.browseImage}</span>
                <span className="text-xs">{t.product.imageHint}</span>
              </>
            )}
          </button>
        )}

        {pictureUrl && !uploading && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 text-xs underline text-gray-400 hover:text-gray-600"
          >
            {t.product.replaceImage}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />

        {uploadError && (
          <p className="mt-1 text-xs text-red-600">{uploadError}</p>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.product.nameLabel} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.product.categoryLabel}</label>
        <div className="flex gap-2">
          {(["BREAD", "PASTRY"] as const).map((cat) => {
            const active = category === cat;
            const label = cat === "BREAD" ? t.catalog.categoryBread : t.catalog.categoryPastry;
            const icon = cat === "BREAD" ? "🍞" : "🥐";
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(active ? null : cat)}
                style={active ? { backgroundColor: "#5C3310", color: "#fff", borderColor: "#5C3310" } : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  active ? "" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                <span>{icon}</span>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.product.descriptionLabel}
          <span className={`ml-2 text-xs ${descLen > 200 ? "text-red-500" : "text-gray-400"}`}>
            {descLen}/200
          </span>
        </label>
        <textarea
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={200}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      {/* Price + Stock */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.product.priceLabel} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.product.stockLabel}</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStockAmount((v) => Math.max(0, v - 1))}
              className="w-8 h-9 bg-gray-100 hover:bg-gray-200 rounded-lg text-lg font-bold transition-colors"
            >
              −
            </button>
            <input
              type="number"
              min="0"
              value={stockAmount}
              onChange={(e) => setStockAmount(Math.max(0, parseInt(e.target.value) || 0))}
              className="flex-1 text-center border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={() => setStockAmount((v) => v + 1)}
              className="w-8 h-9 bg-gray-100 hover:bg-gray-200 rounded-lg text-lg font-bold transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Available Days */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.product.daysLabel}</label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const active = availableDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                style={active ? { backgroundColor: "#5C3310", color: "#fff", borderColor: "#5C3310" } : undefined}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                  active ? "" : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {t.settings.dayLabels[day as keyof typeof t.settings.dayLabels]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">{t.product.propertiesLabel}</p>
        {[
          { label: t.product.propVegan, value: isVegan, set: setIsVegan },
          { label: t.product.propAllergens, value: containsAllergens, set: setContainsAllergens },
          { label: t.product.propDairy, value: containsDairy, set: setContainsDairy },
          { label: t.product.propActive, value: isActive, set: setIsActive },
        ].map(({ label, value, set }) => (
          <label key={label} className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              role="switch"
              aria-checked={value}
              onClick={() => set(!value)}
              style={{ backgroundColor: value ? "#8B5A2B" : "#D1D5DB" }}
              className="relative inline-flex w-10 h-6 rounded-full transition-colors"
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  value ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {t.product.cancelBtn}
        </button>
        <button
          type="submit"
          disabled={saving}
          style={{ backgroundColor: "#5C3310", color: "#fff" }}
          className="px-4 py-2 text-sm rounded-lg disabled:opacity-50"
        >
          {saving ? t.product.saving : initial?.id ? t.product.saveChanges : t.product.createProduct}
        </button>
      </div>
    </form>
  );
}
