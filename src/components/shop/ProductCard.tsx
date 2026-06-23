"use client";

import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface CartItem { product: Product; quantity: number; }

interface Props {
  product: Product;
  cartItem?: CartItem;
  onAdd: (product: Product) => void;
  onRemove: (product: Product) => void;
}

export default function ProductCard({ product, cartItem, onAdd, onRemove }: Props) {
  const { t } = useLanguage();
  const qty = cartItem?.quantity ?? 0;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-md transition-shadow border border-brand-100 flex flex-col">
      {/* Image */}
      <div className="relative h-48 bg-brand-50">
        {product.pictureUrl
          ? <img src={product.pictureUrl} alt={product.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-6xl">🍞</div>
        }
        {product.stockAmount <= 0 && (
          <div className="absolute inset-0 bg-brand-900/30 flex items-center justify-center">
            <span className="bg-white text-brand-800 text-xs font-semibold px-3 py-1 rounded-full shadow">
              {t.shop.soldOut}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-brand-800 mb-1">{product.name}</h3>

        {product.description && (
          <p className="text-sm text-brand-500 mb-2 flex-1 leading-relaxed">{product.description}</p>
        )}

        {/* Dietary tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.isVegan && (
            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-100">{t.shop.tagVegan}</span>
          )}
          {product.containsDairy && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">{t.shop.tagDairy}</span>
          )}
          {product.containsAllergens && (
            <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-100">{t.shop.tagAllergens}</span>
          )}
        </div>

        {/* Price + cart controls */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-brand-50">
          <span className="font-bold text-brand-700 text-lg">{formatPrice(product.price)}</span>

          {product.stockAmount <= 0 ? (
            <span className="text-xs text-brand-400">{t.shop.soldOutSmall}</span>
          ) : qty === 0 ? (
            <button
              onClick={() => onAdd(product)}
              className="px-4 py-1.5 bg-brand-700 text-white rounded-xl text-sm font-medium hover:bg-brand-600 active:scale-95 transition-all"
            >
              {t.shop.addToCart}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRemove(product)}
                className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold hover:bg-brand-200 transition-colors flex items-center justify-center"
              >
                −
              </button>
              <span className="font-semibold text-brand-800 w-5 text-center">{qty}</span>
              <button
                onClick={() => onAdd(product)}
                disabled={qty >= product.stockAmount}
                className="w-7 h-7 rounded-full bg-brand-700 text-white font-bold hover:bg-brand-600 disabled:opacity-40 transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
