import type { Metadata } from "next";
import CatalogGrid from "@/components/admin/CatalogGrid";

export const metadata: Metadata = { title: "Catalog — Labread Admin" };

export default function CatalogPage() {
  return <CatalogGrid />;
}
