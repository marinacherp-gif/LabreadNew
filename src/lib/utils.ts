import { ClientRating } from "@prisma/client";

export function computeClientRating(previousOrderCount: number): ClientRating {
  if (previousOrderCount === 0) return "FIRST_TIMER";
  if (previousOrderCount <= 5) return "CASUAL";
  return "FREQUENT";
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatPrice(price: number | string | { toString(): string }): string {
  return `₪${Number(price).toFixed(2)}`;
}

export function todayISO(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function buildOrdersCsvRows(
  orders: Array<{
    id: string;
    clientName: string;
    clientPhone: string;
    deliveryDate: Date;
    status: string;
    paymentStatus: string;
    totalPrice: { toString(): string };
    orderItems: Array<{
      quantity: number;
      priceAtPurchase: { toString(): string };
      product: { name: string };
    }>;
  }>
): string {
  const header =
    "Order ID,Client Name,Phone,Delivery Date,Status,Payment Status,Total Price,Item Name,Quantity,Item Price,Subtotal";
  const rows: string[] = [header];

  for (const order of orders) {
    const base = [
      order.id,
      `"${order.clientName.replace(/"/g, '""')}"`,
      order.clientPhone,
      order.deliveryDate.toISOString().split("T")[0],
      order.status,
      order.paymentStatus,
      order.totalPrice.toString(),
    ];

    if (order.orderItems.length === 0) {
      rows.push([...base, "", "", "", ""].join(","));
    } else {
      for (const item of order.orderItems) {
        const subtotal = (Number(item.priceAtPurchase) * item.quantity).toFixed(2);
        rows.push(
          [
            ...base,
            `"${item.product.name.replace(/"/g, '""')}"`,
            item.quantity,
            item.priceAtPurchase.toString(),
            subtotal,
          ].join(",")
        );
      }
    }
  }

  return rows.join("\n");
}

const DAY_CODES: Record<number, string> = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
};

export function todayDayCode(): string {
  return DAY_CODES[new Date().getDay()];
}
