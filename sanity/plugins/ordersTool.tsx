"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { definePlugin, useClient } from "sanity";
import { SanityOrder } from "@/types/sanityOrder";

const ordersQuery = `*[_type == "order" && adminStatus in $statuses] | order(placedAt desc){
  _id,
  orderNumber,
  customer,
  items,
  paymentMethod,
  adminStatus,
  status,
  clickomSaleId,
  placedAt,
  approvedAt,
  totalAmount,
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

function OrdersTool() {
  const client = useClient({ apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-03-01" });
  const [orders, setOrders] = useState<SanityOrder[]>([]);
  const [activeView, setActiveView] = useState<"pending_approval" | "approved" | "rejected">("pending_approval");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const callAdminRoute = async (path: string, orderId?: string) => {
    setError("");
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "",
      },
      body: JSON.stringify(orderId ? { orderId } : {}),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error || "Admin action failed.");
      return;
    }

    await loadOrders();
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
            <button onClick={() => callAdminRoute("/api/orders/status-sync")} style={{ padding: "8px 12px", border: "1px solid #ddd", background: "#fff" }}>
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
                <td style={{ borderBottom: "1px solid #eee", padding: 12 }}>{order.orderNumber}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 12 }}>
                  <strong>{order.customer?.fullName}</strong>
                  <br />
                  {order.customer?.mobile}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 12 }}>{order.paymentMethod}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 12 }}>
                  {(order.items || []).map((item) => `${item.title} x ${item.quantity}`).join(", ")}
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
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => callAdminRoute("/api/orders/approve", order._id)}>Approve</button>
                      <button onClick={() => callAdminRoute("/api/orders/reject", order._id)}>Reject</button>
                    </div>
                  )}
                </td>
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
