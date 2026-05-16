import { AdminStatus, OrderCustomer, OrderItemSnapshot, OrderStatus, PaymentMethod } from "./order";

export interface SanityOrder {
  _id: string;
  orderNumber: string;
  customer: OrderCustomer;
  items: OrderItemSnapshot[];
  paymentMethod: PaymentMethod;
  adminStatus: AdminStatus;
  status: OrderStatus;
  clickomSaleId?: string;
  placedAt?: string;
  approvedAt?: string;
  discountAmount?: number;
  totalAmount: number;
  paymentSlipUrl?: string;
}
