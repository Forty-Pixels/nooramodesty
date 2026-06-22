import { AdminStatus, OrderCustomer, OrderItemSnapshot, OrderStatus, PaymentMethod, PaymentStatus } from "./order";

export interface SanityOrder {
  _id: string;
  orderNumber: string;
  customer: OrderCustomer;
  items: OrderItemSnapshot[];
  paymentMethod: PaymentMethod;
  adminStatus: AdminStatus;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paidAmount?: number;
  balanceAmount?: number;
  paymentVerifiedAt?: string;
  clickomSaleId?: string;
  clickomTransactionId?: string;
  clickomCustomOrderId?: number;
  clickomInvoiceNo?: string;
  waybillNumber?: string;
  courierStatus?: string;
  clickomRawStatus?: string;
  placedAt?: string;
  approvedAt?: string;
  discountAmount?: number;
  totalAmount: number;
  paymentSlipUrl?: string;
}
