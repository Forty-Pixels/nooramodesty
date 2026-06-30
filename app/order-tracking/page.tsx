"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, MessageCircle, PackageSearch } from "lucide-react";

interface TrackingOrder {
  orderNumber: string;
  invoiceNo: string;
  placedAt?: string;
  status?: string;
  clickomStatus?: string;
  callStatus?: string;
  orderStatus?: string;
  courierStatus?: string;
  paymentStatus?: string;
  waybillNumber?: string;
  cityPakTrackingUrl?: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  items: Array<{
    title: string;
    quantity: number;
    selectedColor?: string;
    size?: string;
    selectedSize?: string;
  }>;
}

interface TrackingResponse {
  order?: TrackingOrder;
  error?: string;
}

function statusLabel(order: TrackingOrder) {
  return order.orderStatus || order.clickomStatus || order.status || "pending";
}

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setOrder(null);
    setIsLoading(true);

    const response = await fetch("/api/orders/tracking", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderNumber, mobile }),
    });
    const data = (await response.json().catch(() => ({}))) as TrackingResponse;
    setIsLoading(false);

    if (!response.ok || !data.order) {
      setError(data.error || "No matching order found.");
      return;
    }

    setOrder(data.order);
  };

  return (
    <div className="min-h-screen bg-[#f6f5f3] px-6 py-16 md:px-12">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-12">
        <section className="lg:col-span-5">
          <div className="sticky top-28 space-y-8">
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Order Tracking</p>
              <h1 className="text-3xl font-bold uppercase tracking-[0.18em] text-black md:text-5xl">Track Your Order</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6">
              <input
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.currentTarget.value)}
                placeholder="Order Number"
                className="w-full border border-black/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-black"
              />
              <input
                value={mobile}
                onChange={(event) => setMobile(event.currentTarget.value)}
                placeholder="Phone Number"
                className="w-full border border-black/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-black"
              />
              {error && <p className="text-[10px] font-bold uppercase tracking-widest text-[#B21E1E]">{error}</p>}
              <button
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-3 bg-black px-6 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white disabled:bg-gray-400"
              >
                {isLoading ? "Checking..." : "Track"}
                {!isLoading && <ArrowRight size={14} />}
              </button>
            </form>
          </div>
        </section>

        <section className="lg:col-span-7">
          {order ? (
            <div className="space-y-6 bg-white p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 border-b border-black/5 pb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Invoice</p>
                  <h2 className="mt-2 text-xl font-bold uppercase tracking-[0.18em] text-black">{order.invoiceNo}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center bg-black text-white">
                  <PackageSearch size={20} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  ["Order Status", statusLabel(order)],
                  ["Payment Status", order.paymentStatus || "due"],
                  ["Courier Status", order.courierStatus || "Pending"],
                  ["Waybill", order.waybillNumber || "Not issued yet"],
                  ["Total", `LKR ${order.totalAmount.toLocaleString()}`],
                  ["Balance", `LKR ${order.balanceAmount.toLocaleString()}`],
                ].map(([label, value]) => (
                  <div key={label} className="border border-black/5 p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-gray-400">{label}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-widest text-black">{value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-black/5 pt-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Items</p>
                {order.items.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="text-xs font-medium uppercase tracking-widest text-black">
                    {item.title} x {item.quantity}
                    {(item.selectedColor || item.size || item.selectedSize) && (
                      <span className="text-gray-400"> / {[item.selectedColor, item.size || item.selectedSize].filter(Boolean).join(" / ")}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-black/5 pt-6 md:flex-row">
                {order.cityPakTrackingUrl && (
                  <Link href={order.cityPakTrackingUrl} target="_blank" className="flex-1 bg-black px-5 py-3 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-white">
                    CityPak Tracking
                  </Link>
                )}
                <Link href="/returns-and-exchanges" className="flex-1 border border-black/10 px-5 py-3 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-black">
                  Return / Exchange
                </Link>
                <Link href="https://wa.me/94777828836?text=Hi%20Noora%20Modesty%2C%20I%20need%20help%20with%20my%20order." target="_blank" className="flex items-center justify-center gap-2 border border-black/10 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-black">
                  <MessageCircle size={14} />
                  Support
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center bg-white p-8 text-center">
              <p className="max-w-sm text-[10px] font-bold uppercase leading-6 tracking-[0.28em] text-gray-400">
                Enter your order number and phone number to view invoice, status, waybill, and support options.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
