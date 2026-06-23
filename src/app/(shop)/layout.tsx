import { LanguageProvider } from "@/context/LanguageContext";
import { OrderSessionProvider } from "@/context/OrderSessionContext";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider storageKey="shop_lang">
      <OrderSessionProvider>
        {children}
      </OrderSessionProvider>
    </LanguageProvider>
  );
}
