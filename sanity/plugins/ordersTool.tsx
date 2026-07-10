"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { definePlugin, useClient } from "sanity";
import { SanityOrder } from "@/types/sanityOrder";
import { PaymentStatus } from "@/types/order";

const ordersQuery = `*[_type == "order" && adminStatus in $statuses] | order(placedAt desc){
  _id,
  orderNumber,
  customer,
  items,
  paymentMethod,
  adminStatus,
  status,
  clickomSaleId,
  clickomCustomOrderId,
  placedAt,
  approvedAt,
  totalAmount,
  paymentStatus,
  paidAmount,
  balanceAmount,
  waybillNumber,
  courierStatus,
  "paymentSlipUrl": coalesce(paymentSlipUrl, paymentSlip.asset->url)
}`;

function ageLabel(placedAt?: string) {
  if (!placedAt) return "Unknown";
  const hours = Math.floor((Date.now() - Date.parse(placedAt)) / 36e5);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function isImageUrl(url: string) {
  return /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url);
}

function formatItemSummary(item: SanityOrder["items"][number]) {
  const details = [
    item.selectedColor ? `Colour: ${item.selectedColor}` : "",
    item.selectedColorHex ? `Hex: ${item.selectedColorHex}` : "",
    (item.size || item.selectedSize) ? `Size: ${item.size || item.selectedSize}` : "",
    item.sku ? `SKU: ${item.sku}` : "",
    item.preOrder ? "Pre-order" : "",
  ].filter(Boolean);

  return `${item.title} x ${item.quantity}${details.length ? ` (${details.join(", ")})` : ""}`;
}

function formatCustomMeasurements(item: SanityOrder["items"][number]) {
  if (!item.customSize) return "";

  return [
    item.customLength ? `Length ${item.customLength}` : "",
    item.customBust ? `Bust ${item.customBust}` : "",
    item.customHip ? `Hip ${item.customHip}` : "",
    item.customSleeve ? `Sleeve ${item.customSleeve}` : "",
  ].filter(Boolean).join(", ");
}

function resolvePaymentDraft(order: SanityOrder, draft?: { paymentStatus: PaymentStatus; paidAmount: number }) {
  const paymentStatus = draft?.paymentStatus || order.paymentStatus || "due";
  const totalAmount = Math.max(0, Number(order.totalAmount || 0));
  const inputPaidAmount = Math.max(0, Number(draft?.paidAmount ?? order.paidAmount ?? 0));
  const paidAmount =
    paymentStatus === "paid"
      ? totalAmount
      : paymentStatus === "due"
        ? 0
        : inputPaidAmount;

  return {
    paymentStatus,
    paidAmount,
    balanceAmount: Math.max(0, totalAmount - paidAmount),
  };
}

function OrdersTool() {
  const client = useClient({ apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-03-01" });
  const [orders, setOrders] = useState<SanityOrder[]>([]);
  const [activeView, setActiveView] = useState<"pending_approval" | "approved" | "rejected">("pending_approval");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [draftPaymentByOrderId, setDraftPaymentByOrderId] = useState<Record<string, { paymentStatus: PaymentStatus; paidAmount: number }>>({});

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await client.fetch<SanityOrder[]>(ordersQuery, { statuses: [activeView] });
      setOrders(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load orders.");
    } finally {
      setIsLoading(false);
    }
  }, [activeView, client]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const callAdminRoute = async (path: string, body: Record<string, unknown>) => {
    setError("");
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error || "Admin action failed.");
      return;
    }

    await loadOrders();
  };

  const savePayment = async (order: SanityOrder) => {
    const draft = resolvePaymentDraft(order, draftPaymentByOrderId[order._id]);

    await callAdminRoute("/api/orders/payment", {
      orderId: order._id,
      paymentStatus: draft.paymentStatus,
      paidAmount: draft.paidAmount,
      totalAmount: order.totalAmount,
    });
  };

  const approveOrder = async (order: SanityOrder) => {
    const draft = resolvePaymentDraft(order, draftPaymentByOrderId[order._id]);

    await callAdminRoute("/api/orders/approve", {
      orderId: order._id,
      paymentStatus: draft.paymentStatus,
      paidAmount: draft.paidAmount,
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Orders</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {(["pending_approval", "approved", "rejected"] as const).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              style={{
                padding: "8px 12px",
                border: "1px solid #ddd",
                background: activeView === view ? "#111" : "#fff",
                color: activeView === view ? "#fff" : "#111",
                cursor: "pointer",
              }}
            >
              {view.replace("_", " ")}
            </button>
          ))}
          <button onClick={loadOrders} style={{ padding: "8px 12px", border: "1px solid #ddd", background: "#fff" }}>
            Refresh
          </button>
          {activeView === "approved" && (
            <button onClick={() => callAdminRoute("/api/orders/status-sync", {})} style={{ padding: "8px 12px", border: "1px solid #ddd", background: "#fff" }}>
              Sync Status
            </button>
          )}
        </div>
      </div>

      {error && <p style={{ color: "#b00020", fontWeight: 700 }}>{error}</p>}
      {isLoading && <p>Loading orders...</p>}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Order", "Customer", "Payment", "Summary", "Age", "Status", "Slip", "Actions"].map((heading) => (
                <th key={heading} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 12 }}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                {(() => {
                  const paymentDraft = resolvePaymentDraft(order, draftPaymentByOrderId[order._id]);

                  return (
                    <>
                <td style={{ borderBottom: "1px solid #eee", padding: 12 }}>{order.orderNumber}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 12 }}>
                  <strong>{order.customer?.fullName}</strong>
                  <br />
                  {order.customer?.mobile}
                  {order.customer?.whatsapp && order.customer.whatsapp !== order.customer.mobile && (
                    <>
                      <br />
                      <small>WhatsApp: {order.customer.whatsapp}</small>
                    </>
                  )}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 12 }}>
                  {order.paymentMethod}
                  <br />
                  <small>{order.paymentStatus || "due"} / Paid LKR {(order.paidAmount || 0).toLocaleString()}</small>
                  <br />
                  <small>Balance LKR {(order.balanceAmount ?? order.totalAmount ?? 0).toLocaleString()}</small>
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 12 }}>
                  {(order.items || []).map((item) => (
                    <div key={`${item.productId}-${item.clickomVariationId}-${item.size || item.selectedSize || ""}`} style={{ marginBottom: 6 }}>
                      {formatItemSummary(item)}
                      {formatCustomMeasurements(item) && (
                        <>
                          <br />
                          <small>{formatCustomMeasurements(item)}</small>
                        </>
                      )}
                    </div>
                  ))}
                  <br />
                  <strong>LKR {order.totalAmount?.toLocaleString()}</strong>
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 12 }}>{ageLabel(order.placedAt)}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 12 }}>
                  {order.status}
                  {order.clickomSaleId && (
                    <>
                      <br />
                      <small>{order.clickomSaleId}</small>
                    </>
                  )}
                  {order.clickomCustomOrderId && (
                    <>
                      <br />
                      <small>Custom: {order.clickomCustomOrderId}</small>
                    </>
                  )}
                  {order.waybillNumber && (
                    <>
                      <br />
                      <small>Waybill: {order.waybillNumber}</small>
                    </>
                  )}
                  {order.courierStatus && (
                    <>
                      <br />
                      <small>Courier: {order.courierStatus}</small>
                    </>
                  )}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 12 }}>
                  {order.paymentSlipUrl && isImageUrl(order.paymentSlipUrl) ? (
                    <a href={order.paymentSlipUrl} target="_blank" rel="noreferrer" style={{ display: "block", position: "relative", width: 72, height: 72, border: "1px solid #ddd" }}>
                      <Image src={order.paymentSlipUrl} alt={`Payment slip for ${order.orderNumber}`} fill style={{ objectFit: "cover" }} sizes="72px" />
                    </a>
                  ) : order.paymentSlipUrl ? (
                    <a href={order.paymentSlipUrl} target="_blank" rel="noreferrer">Open PDF</a>
                  ) : (
                    "None"
                  )}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 12 }}>
                  {order.adminStatus === "pending_approval" && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <select
                        value={(draftPaymentByOrderId[order._id]?.paymentStatus || order.paymentStatus || "due")}
                        onChange={(event) => {
                          const paymentStatus = event.currentTarget.value as PaymentStatus;
                          const paidAmount =
                            paymentStatus === "paid"
                              ? order.totalAmount || 0
                              : paymentStatus === "due"
                                ? 0
                                : draftPaymentByOrderId[order._id]?.paidAmount ?? order.paidAmount ?? 0;
                          setDraftPaymentByOrderId((current) => ({
                            ...current,
                            [order._id]: {
                              paymentStatus,
                              paidAmount,
                            },
                          }));
                        }}
                      >
                        {(["due", "partial", "paid"] as PaymentStatus[]).map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        value={draftPaymentByOrderId[order._id]?.paidAmount ?? order.paidAmount ?? 0}
                        onChange={(event) => {
                          const paidAmount = Number(event.currentTarget.value || 0);
                          setDraftPaymentByOrderId((current) => ({
                            ...current,
                            [order._id]: {
                              paymentStatus: current[order._id]?.paymentStatus || order.paymentStatus || "due",
                              paidAmount,
                            },
                          }));
                        }}
                        style={{ width: 100 }}
                      />
                      <small>Balance LKR {paymentDraft.balanceAmount.toLocaleString()}</small>
                      <button onClick={() => savePayment(order)}>Save Payment</button>
                      <button onClick={() => approveOrder(order)}>Approve</button>
                      <button onClick={() => callAdminRoute("/api/orders/reject", { orderId: order._id })}>Reject</button>
                    </div>
                  )}
                  {order.adminStatus === "approved" && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <small>{order.clickomSaleId ? "Synced to OMS Orders" : "Approved locally"}</small>
                    </div>
                  )}
                </td>
                    </>
                  );
                })()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const ordersTool = definePlugin({
  name: "orders-tool",
  tools: [
    {
      name: "orders",
      title: "Orders",
      component: OrdersTool,
    },
  ],
});
