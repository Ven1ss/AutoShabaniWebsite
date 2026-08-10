/** Pure order helpers + shared types (safe for client and server). */

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "awaiting_pickup"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"
  | "refunded";

export type PaymentMethod = "stripe" | "pickup";

export type PaymentStatus =
  | "unpaid"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

/** Allowed next statuses from each status. */
export const STATUS_FLOW: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ["paid", "awaiting_pickup", "cancelled"],
  paid: ["awaiting_pickup", "preparing", "cancelled", "refunded"],
  awaiting_pickup: ["preparing", "ready", "completed", "cancelled", "refunded"],
  preparing: ["ready", "cancelled", "refunded"],
  ready: ["completed", "cancelled", "refunded"],
  completed: ["refunded"],
  cancelled: ["refunded"],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  return (STATUS_FLOW[from] ?? []).includes(to);
}

export type CartCheckoutLine = {
  productId: string;
  qty: number;
};

const ORDER_NUMBER_RE = /^AS-\d{4}-\d{6}$/i;

export function isValidOrderNumber(value: string): boolean {
  return ORDER_NUMBER_RE.test(value.trim());
}

export function normalizeOrderNumber(value: string): string {
  return value.trim().toUpperCase();
}

/** Format a sequence number as AS-YYYY-###### (for display / tests). */
export function formatOrderNumber(year: number, seq: number): string {
  const y = Math.floor(year);
  const n = Math.max(0, Math.floor(seq));
  return `AS-${y}-${String(n).padStart(6, "0")}`;
}

export function validatePhone(phone: string): boolean {
  const digits = phone.replace(/[^\d+]/g, "");
  const onlyDigits = digits.replace(/\D/g, "");
  return onlyDigits.length >= 6 && onlyDigits.length <= 15;
}

export function validateEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  // Simple pragmatic check — not full RFC.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    value in STATUS_FLOW
  );
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "stripe" || value === "pickup";
}
