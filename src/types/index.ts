import type {
  Order,
  OrderItem,
  Product,
  User,
  BakeryConfig,
  OrderStatus,
  PaymentStatus,
  ClientRating,
  Role,
  ProductCategory,
} from "@prisma/client";

export type {
  Order,
  OrderItem,
  Product,
  User,
  BakeryConfig,
  OrderStatus,
  PaymentStatus,
  ClientRating,
  Role,
  ProductCategory,
};

export type OrderWithItems = Order & {
  orderItems: (OrderItem & { product: Product })[];
};

export type WorkingHours = {
  MON?: string;
  TUE?: string;
  WED?: string;
  THU?: string;
  FRI?: string;
  SAT?: string;
  SUN?: string;
};

export type Announcement = {
  id: string;
  text: string;
  isActive: boolean;
  startDate: string; // "YYYY-MM-DD"
  endDate: string | null; // "YYYY-MM-DD" or null (no expiry)
};

export const ORDER_STATUSES: OrderStatus[] = ["OPEN", "PAUSED", "DONE", "CANCELED"];
export const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
export type DayCode = (typeof DAYS_OF_WEEK)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  OPEN: "Open",
  PAUSED: "Paused",
  DONE: "Done",
  CANCELED: "Canceled",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  OPEN: "bg-green-100 text-green-800",
  PAUSED: "bg-yellow-100 text-yellow-800",
  DONE: "bg-blue-100 text-blue-800",
  CANCELED: "bg-red-100 text-red-800",
};

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  PAID: "Paid",
  NOT_PAID: "Not Paid",
};

export const RATING_LABELS: Record<ClientRating, string> = {
  FIRST_TIMER: "First Timer",
  CASUAL: "Casual",
  FREQUENT: "Frequent",
};

export const RATING_COLORS: Record<ClientRating, string> = {
  FIRST_TIMER: "bg-purple-100 text-purple-800",
  CASUAL: "bg-blue-100 text-blue-800",
  FREQUENT: "bg-amber-100 text-amber-800",
};

export const DAY_LABELS: Record<string, string> = {
  SUN: "Sun",
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
};
