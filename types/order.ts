export type PaymentMethod = "cod" | "bank_transfer";

export type AdminStatus = "pending_approval" | "approved" | "rejected";

export type OrderStatus = "pending" | "confirmed" | "processing" | "dispatched" | "shipped" | "completed" | "cancelled";

export type PaymentStatus = "due" | "partial" | "paid";

export type CouponDiscountType = "fixed" | "percentage";

export interface OrderCustomer {
  fullName: string;
  mobile: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
}

export interface OrderItemInput {
  productId: string;
  clickomVariationId: number;
  quantity: number;
  selectedColor?: string;
  selectedColorHex?: string;
  size?: string;
  selectedSize?: string;
  sku?: string;
  customSize: boolean;
  preOrder?: boolean;
  customLength?: string;
  customBust?: string;
  customHip?: string;
  customSleeve?: string;
  customNote?: string;
}

export interface OrderItemSnapshot extends OrderItemInput {
  title: string;
  slug: string;
  image?: string;
  clickomProductId: number;
  unitPrice: number;
}

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  discountAmount: number;
  totalAmount: number;
}

export interface CheckoutOrderPayload {
  customer: OrderCustomer;
  items: OrderItemInput[];
  paymentMethod: PaymentMethod;
  couponCode?: string;
}

export interface Coupon {
  _id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  isActive?: boolean;
  startsAt?: string;
  expiresAt?: string;
  usesCount?: number;
  maxUses?: number;
  minimumSubtotal?: number;
}
