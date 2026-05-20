export type PaymentMethod = "cod" | "bank_transfer";

export type AdminStatus = "pending_approval" | "approved" | "rejected";

export type OrderStatus = "pending" | "processing" | "shipped" | "completed" | "cancelled";

export type CouponDiscountType = "fixed" | "percentage";

export interface OrderCustomer {
  fullName: string;
  mobile: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  zipCode: string;
}

export interface OrderItemInput {
  productId: string;
  clickomVariationId: number;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  customSize: boolean;
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
