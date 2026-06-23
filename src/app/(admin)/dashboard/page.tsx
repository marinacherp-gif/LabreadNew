import type { Metadata } from "next";
import OrdersGrid from "@/components/admin/OrdersGrid";

export const metadata: Metadata = { title: "Orders — Labread Admin" };

export default function DashboardPage() {
  return <OrdersGrid />;
}
