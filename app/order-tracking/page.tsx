"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowRight, Loader2, MessageCircle, PackageSearch } from "lucide-react";
import {
  SRI_LANKA_PHONE_PREFIX,
  normalizeOrderNumber,
  uniqueMessages,
  validateOrderNumber,
  validateSriLankaLocalNumber,
} from "@/utils/formValidation";
import { whatsappHref } from "@/data/siteLinks";

const supportWhatsappHref = whatsappHref("Hi Noora Modesty, I need help tracking my order.");

interface TrackingOrder {
  orderNumber: string;
  invoiceNo: string;
  placedAt?: string;
  status?: string;
  clickomStatus?: string;
  callStatus?: string;
  orderStatus?: string;
  courierStatus?: string;
  waybillNumber?: string;
  cityPakTrackingUrl?: string;
  totalAmount: number;
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

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("orderNumber") || "");
  const [mobileLocal, setMobileLocal] = useState("");
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setOrder(null);

    const validationErrors = uniqueMessages([
      ...validateOrderNumber(orderNumber),
      ...validateSriLankaLocalNumber(mobileLocal),
    ]);

    if (validationErrors.length > 0) {
      setError(validationErrors.join(" "));
      return;
    }

    setIsLoading(true);

    const response = await fetch("/api/orders/tracking", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderNumber: normalizeOrderNumber(orderNumber),
        mobile: `${SRI_LANKA_PHONE_PREFIX}${mobileLocal.replace(/\D/g, "")}`,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as TrackingResponse;
    setIsLoading(false);

    if (!response.ok || !data.order) {
      setError(data.error || "No matching order found.");
      return;
    }

    setOrder(data.order);
  };

  // The destination is already known — the spinner is a deliberate "handing you off to
  // CityPak" beat so the jump to a new tab doesn't feel like a dead click.
  const handleCityPakRedirect = (url: string) => {
    setIsRedirecting(true);
    window.setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
      setIsRedirecting(false);
    }, 600);
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

            <form onSubmit={handleSubmit} noValidate className="space-y-6 bg-white p-6 md:p-8">
              <div className="space-y-2">
                <label htmlFor="tracking-order-number" className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
                  Order Number
                </label>
                <input
                  id="tracking-order-number"
                  value={orderNumber}
                  onChange={(event) => setOrderNumber(event.currentTarget.value)}
                  placeholder="e.g. #NM20261234"
                  aria-invalid={Boolean(error && error.toLowerCase().includes("order number"))}
                  autoComplete="off"
                  className="w-full bg-transparent border-b border-black/20 focus:border-black outline-none py-2 text-sm transition-colors text-black placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="tracking-mobile" className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
                  Phone Number
                </label>
                <div className="flex w-full border-b border-black/20 focus-within:border-black transition-colors">
                  <span className="flex items-center pr-2 text-sm font-medium text-gray-400">{SRI_LANKA_PHONE_PREFIX}</span>
                  <input
                    id="tracking-mobile"
                    type="tel"
                    inputMode="numeric"
                    value={mobileLocal}
                    onChange={(event) => setMobileLocal(event.currentTarget.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="77 123 4567"
                    aria-invalid={Boolean(error && error.toLowerCase().includes("phone"))}
                    autoComplete="tel"
                    className="w-full bg-transparent outline-none py-2 text-sm text-black placeholder:text-gray-400"
                  />
                </div>
              </div>

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
                  ["Waybill", order.waybillNumber || "Not issued yet"],
                  ["Total", `LKR ${order.totalAmount.toLocaleString()}`],
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

              {order.cityPakTrackingUrl ? (
                <div className="flex flex-col gap-3 border-t border-black/5 pt-6 md:flex-row">
                  <button
                    type="button"
                    onClick={() => handleCityPakRedirect(order.cityPakTrackingUrl!)}
                    disabled={isRedirecting}
                    className="flex flex-1 items-center justify-center gap-2 bg-black px-5 py-3 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-white disabled:opacity-70"
                  >
                    {isRedirecting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Opening CityPak…
                      </>
                    ) : (
                      "Track with CityPak"
                    )}
                  </button>
                  <Link href="/returns-and-exchanges" className="flex-1 border border-black/10 px-5 py-3 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-black">
                    Return / Exchange
                  </Link>
                  <Link href={supportWhatsappHref} target="_blank" className="flex items-center justify-center gap-2 border border-black/10 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-black">
                    <MessageCircle size={14} />
                    Support
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 border-t border-black/5 pt-6">
                  <p className="text-xs font-medium leading-6 tracking-wide text-black">
                    Your order is being prepared to ship. A tracking number will appear here once the courier collects it.
                  </p>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <Link href={supportWhatsappHref} target="_blank" className="flex flex-1 items-center justify-center gap-2 bg-black px-5 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white">
                      <MessageCircle size={14} />
                      Contact Support
                    </Link>
                    <Link href="/returns-and-exchanges" className="flex-1 border border-black/10 px-5 py-3 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-black">
                      Return / Exchange
                    </Link>
                  </div>
                </div>
              )}
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

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f5f3]" />}>
      <OrderTrackingContent />
    </Suspense>
  );
}
