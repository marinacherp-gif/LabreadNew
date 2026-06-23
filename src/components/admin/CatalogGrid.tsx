"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import ProductForm from "./ProductForm";
import { useLanguage } from "@/context/LanguageContext";

function IconLeaf() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  );
}
function IconMilk() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2h8l1 4H7z"/>
      <path d="M7 6c0 0-2 1.5-2 6s2 10 7 10 7-5 7-10-2-6-2-6"/>
      <path d="M9 14h6"/>
    </svg>
  );
}
function IconAlert() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

export default function CatalogGrid() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | Product | null>(null);

  async function loadProducts() {
    setLoading(true);
    const res = await fetch("/api/catalog?admin=true");
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadProducts(); }, []);

  async function handleSave(data: Partial<Product>) {
    if (modal === "create") {
      await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else if (modal && typeof modal === "object") {
      await fetch(`/api/catalog/${modal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setModal(null);
    loadProducts();
  }

  async function handleDelete(product: Product) {
    if (!confirm(t.catalog.confirmDelete(product.name))) return;
    await fetch(`/api/catalog/${product.id}`, { method: "DELETE" });
    loadProducts();
  }

  const editingProduct = modal !== null && modal !== "create" ? modal : undefined;

  return (
    <div className="space-y-4">
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "#3D2200" }}>{t.catalog.title}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t.catalog.subtitle}</p>
      </div>

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold" style={{ color: "#3D2200" }}>
                {modal === "create" ? t.product.addTitle : t.product.editTitle(editingProduct?.name ?? "")}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="text-gray-400 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-5">
              <ProductForm
                initial={editingProduct}
                onSave={handleSave}
                onCancel={() => setModal(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading ? t.catalog.loading : t.catalog.productCount(products.length)}
        </p>
        <button
          onClick={() => setModal("create")}
          style={{ backgroundColor: "#5C3310", color: "#fff" }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
        >
          {t.catalog.addProduct}
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">{t.catalog.loading}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">{t.catalog.noProducts}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-xl border overflow-hidden transition-all ${
                product.isActive ? "border-gray-200" : "border-gray-100 opacity-60"
              }`}
            >
              {product.pictureUrl ? (
                <div className="relative h-40 bg-gray-100">
                  <img
                    src={product.pictureUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-40 bg-brand-50 flex items-center justify-center text-4xl">🍞</div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="font-semibold text-brand-800 leading-tight">{product.name}</h3>
                    {product.category && (
                      <span className="shrink-0 text-xs px-1.5 py-0.5 rounded font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        {product.category === "BREAD" ? `🍞 ${t.catalog.categoryBread}` : `🥐 ${t.catalog.categoryPastry}`}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-brand-700 whitespace-nowrap shrink-0">
                    {formatPrice(product.price)}
                  </span>
                </div>

                {product.description && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                )}

                {/* Days */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {product.availableDays.map((d) => (
                    <span key={d} className="px-1.5 py-0.5 bg-brand-100 text-brand-800 rounded text-xs">
                      {t.settings.dayLabels[d as keyof typeof t.settings.dayLabels] ?? d}
                    </span>
                  ))}
                  {product.availableDays.length === 0 && (
                    <span className="text-xs text-gray-400">{t.catalog.noDays}</span>
                  )}
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1.5 mb-3">
                  {product.isVegan && (
                    <span title={t.catalog.tagVegan} className="flex items-center justify-center w-6 h-6 bg-green-100 text-green-700 rounded-full">
                      <IconLeaf />
                    </span>
                  )}
                  {product.containsDairy && (
                    <span title={t.catalog.tagDairy} className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full">
                      <IconMilk />
                    </span>
                  )}
                  {product.containsAllergens && (
                    <span title={t.catalog.tagAllergens} className="flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-700 rounded-full">
                      <IconAlert />
                    </span>
                  )}
                  {!product.isActive && (
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{t.catalog.tagInactive}</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t.catalog.stock} {product.stockAmount}</span>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => setModal(product)}
                      title={t.catalog.edit}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                    >
                      <IconEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      title={t.catalog.delete}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
