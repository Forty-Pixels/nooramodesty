"use client";

import React, { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Info, Lock, Mail, ShieldCheck, Truck, X } from "lucide-react";
import useCartStore from "@/store";
import { CheckoutOrderPayload, PaymentMethod } from "@/types/order";

interface CheckoutFormState {
  fullName: string;
  mobile: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  zipCode: string;
}

const initialFormState: CheckoutFormState = {
  fullName: "",
  mobile: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  zipCode: "",
};

function CheckoutContent() {
  const { items, clearCart, updateQuantity } = useCartStore();
  const [formState, setFormState] = useState(initialFormState);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = subtotal > 50000 ? 0 : 1500;
  const total = subtotal + shipping - discountAmount;

  const payload: CheckoutOrderPayload = {
    customer: formState,
    paymentMethod,
    couponCode: couponCode || undefined,
    items: items.map((item) => ({
      productId: item.productId || item._id.split("-")[0],
      clickomVariationId: item.clickomVariationId || 0,
      quantity: item.quantity,
      selectedColor: item.color,
      selectedSize: item.size,
      customSize: item.customSize || item.size === "Custom",
      customNote: item.customNote,
    })),
  };

  const updateField = (field: keyof CheckoutFormState, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const validateClient = () => {
    if (items.length === 0) return "Your bag is empty.";
    if (!formState.fullName || !formState.mobile || !formState.email || !formState.addressLine1 || !formState.city || !formState.zipCode) {
      return "Please complete all required fields.";
    }
    if (!formState.email.includes("@")) return "Please enter a valid email address.";
    if (items.some((item) => !item.clickomVariationId)) return "Please choose a valid size for every item.";
    if (paymentSlip && paymentSlip.size > 5 * 1024 * 1024) return "Payment slip must be 5MB or smaller.";
    return "";
  };

  const validateCouponRequest = () => {
    if (!formState.fullName || !formState.mobile || !formState.email || !formState.addressLine1 || !formState.city || !formState.zipCode) {
      return "Complete contact and delivery details before applying a coupon.";
    }
    if (!formState.email.includes("@")) return "Enter a valid email address before applying a coupon.";
    if (items.some((item) => !item.clickomVariationId)) return "Choose a valid size for every item before applying a coupon.";
    return "";
  };

  const handleApplyCoupon = async () => {
    setCouponMessage("");
    setDiscountAmount(0);

    if (!couponCode.trim()) {
      setCouponMessage("Enter a coupon code.");
      return;
    }

    const couponError = validateCouponRequest();

    if (couponError) {
      setCouponMessage(couponError);
      return;
    }

    const response = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    setCouponMessage(data.message || (data.valid ? "Coupon applied." : "Coupon could not be applied."));
    setDiscountAmount(data.valid ? data.discountAmount || 0 : 0);
  };

  const handlePlaceOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const clientError = validateClient();

    if (clientError) {
      setError(clientError);
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.set("payload", JSON.stringify(payload));
    if (paymentSlip) formData.set("paymentSlip", paymentSlip);

    const response = await fetch("/api/orders/create", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setIsProcessing(false);

    if (!response.ok) {
      setError(data.error || "Unable to create order.");
      return;
    }

    setOrderNumber(data.orderNumber);
    clearCart();
  };

  if (orderNumber) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-xl w-full space-y-10">
          <div className="mx-auto w-24 h-24 bg-black rounded-full flex items-center justify-center">
            <ShieldCheck size={48} className="text-white" strokeWidth={1.5} />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-[0.25em] text-black">Thank You</h1>
            <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400 font-bold">Please screenshot your order number</p>
          </div>
          <div className="bg-[#f6f5f3] p-8 space-y-3">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Order Number</p>
            <p className="text-2xl font-bold tracking-widest text-black">{orderNumber}</p>
          </div>
          <Link href="/category/abayas" className="inline-flex bg-black text-white px-10 py-4 text-[10px] tracking-[0.3em] font-bold uppercase">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f6f5f3] flex flex-col items-center justify-center">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">Your bag is empty</p>
        <Link href="/category/abayas" className="text-[10px] font-bold uppercase tracking-[0.3em] underline underline-offset-8">
          Go Shopping
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handlePlaceOrder} className="bg-[#f6f5f3] min-h-screen font-sans text-black">
      <header className="py-12 px-6 md:px-12 flex justify-between items-center bg-transparent">
        <Link href="/cart" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">
          <ArrowLeft size={14} />
          Back to Bag
        </Link>
        <div className="w-20 md:flex hidden items-center gap-1 justify-end text-[8px] font-bold text-gray-400">
          <Lock size={10} />
          SECURE
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-12 pb-20">
        <div className="lg:col-span-7 px-6 md:px-12 py-12 space-y-12 order-2 lg:order-1">
          <section className="space-y-6">
            <h2 className="text-lg font-bold uppercase tracking-widest">Contact & Delivery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={formState.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Full Name" required className="md:col-span-2 w-full bg-white border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none focus:border-black/20 placeholder:text-gray-300" />
              <input value={formState.email} onChange={(e) => updateField("email", e.target.value)} type="email" placeholder="Email Address" required className="w-full bg-white border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none focus:border-black/20 placeholder:text-gray-300" />
              <input value={formState.mobile} onChange={(e) => updateField("mobile", e.target.value)} placeholder="Phone" required className="w-full bg-white border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none focus:border-black/20 placeholder:text-gray-300" />
              <input value={formState.addressLine1} onChange={(e) => updateField("addressLine1", e.target.value)} placeholder="Address" required className="md:col-span-2 w-full bg-white border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none focus:border-black/20 placeholder:text-gray-300" />
              <input value={formState.addressLine2} onChange={(e) => updateField("addressLine2", e.target.value)} placeholder="Apartment, suite, etc. (optional)" className="md:col-span-2 w-full bg-white border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none focus:border-black/20 placeholder:text-gray-300" />
              <input value={formState.city} onChange={(e) => updateField("city", e.target.value)} placeholder="City" required className="w-full bg-white border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none focus:border-black/20 placeholder:text-gray-300" />
              <input value={formState.zipCode} onChange={(e) => updateField("zipCode", e.target.value)} placeholder="Postal / Zip Code" required className="w-full bg-white border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none focus:border-black/20 placeholder:text-gray-300" />
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-bold uppercase tracking-widest">Payment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button type="button" onClick={() => setPaymentMethod("cod")} className={`p-6 border flex flex-col items-center gap-3 ${paymentMethod === "cod" ? "border-black bg-white" : "border-black/5 bg-white/50"}`}>
                <Truck size={20} strokeWidth={1.5} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Cash on Delivery</span>
              </button>
              <button type="button" onClick={() => setPaymentMethod("bank_transfer")} className={`p-6 border flex flex-col items-center gap-3 ${paymentMethod === "bank_transfer" ? "border-black bg-white" : "border-black/5 bg-white/50"}`}>
                <ShieldCheck size={20} strokeWidth={1.5} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Bank Transfer</span>
              </button>
            </div>

            {paymentMethod === "bank_transfer" && (
              <div className="p-8 bg-white border border-black/5 space-y-6">
                <div className="bg-[#fcfcfc] p-6 border border-black/5 space-y-2 text-[10px] uppercase tracking-widest">
                  <p className="font-bold">Bank transfer details</p>
                  <p>Use the bank details shown in Sanity site settings once configured.</p>
                  <p className="text-gray-400">Payment slips not received within 3 days will automatically convert this order to Cash on Delivery.</p>
                </div>
                <div className="relative border-2 border-dashed border-black/5 p-8 text-center">
                  <input type="file" onChange={(e) => setPaymentSlip(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*,application/pdf" />
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[250px]">
                      {paymentSlip ? paymentSlip.name : "Select Payment Slip"}
                    </p>
                    {paymentSlip && (
                      <button type="button" onClick={() => setPaymentSlip(null)} className="relative z-20 p-1.5 bg-black text-white rounded-full">
                        <X size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {error && <p className="text-sm font-bold text-[#B21E1E]">{error}</p>}
          <button disabled={isProcessing} className="w-full bg-black text-white py-6 text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-zinc-800 disabled:bg-gray-400 flex items-center justify-center gap-3">
            {isProcessing ? "Processing..." : "Place Order"}
            {!isProcessing && <ArrowRight size={16} />}
          </button>
        </div>

        <div className="lg:col-span-5 bg-white px-6 md:px-12 py-12 h-fit lg:sticky lg:top-[88px] order-1 lg:order-2 border-b lg:border-b-0 border-black/5">
          <h2 className="text-lg font-bold uppercase tracking-widest mb-10">Order Review</h2>
          <div className="space-y-8 mb-10">
            {items.map((item) => (
              <div key={item._id} className="flex gap-5">
                <div className="relative w-20 aspect-[3/4] bg-[#f6f5f3]">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest">{item.title}</h3>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 mt-1">{item.size} {item.customNote ? "- Custom" : ""}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <button type="button" onClick={() => updateQuantity(item._id, item.quantity - 1)} className="w-5 h-5 border border-black/10 rounded-full text-[10px]">-</button>
                    <span className="text-[10px] font-bold">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item._id, item.quantity + 1)} className="w-5 h-5 border border-black/10 rounded-full text-[10px]">+</button>
                  </div>
                </div>
                <p className="text-[10px] font-bold">LKR {(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="mb-10 pb-10 border-b border-black/5">
            <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400 block mb-4">Coupon Code</label>
            <div className="flex gap-2">
              <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="ENTER CODE" className="flex-1 bg-[#fcfcfc] border border-black/5 px-4 py-3 text-[10px] font-bold tracking-[0.1em] focus:outline-none" />
              <button type="button" onClick={handleApplyCoupon} className="bg-black text-white px-5 py-3 text-[9px] font-bold uppercase tracking-widest">Apply</button>
            </div>
            {couponMessage && <p className="text-[9px] uppercase tracking-widest text-gray-400 mt-3">{couponMessage}</p>}
          </div>

          <div className="space-y-4 pt-8 border-t border-black/5">
            <div className="flex justify-between text-[10px] font-medium uppercase tracking-widest text-gray-500"><span>Subtotal</span><span>LKR {subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-[10px] font-medium uppercase tracking-widest text-gray-500"><span>Shipping</span><span>{shipping === 0 ? "FREE" : `LKR ${shipping.toLocaleString()}`}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#B21E1E]"><span>Discount</span><span>- LKR {discountAmount.toLocaleString()}</span></div>}
            <div className="flex justify-between text-base font-bold uppercase tracking-[0.2em] pt-4 border-t border-black/5"><span>Total</span><span>LKR {total.toLocaleString()}</span></div>
          </div>

          <div className="mt-12 pt-8 border-t border-black/5 space-y-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black">Need Assistance?</p>
            <a href="mailto:hello@nooramodesty.com" className="flex items-center gap-3 text-[10px] text-gray-500 hover:text-black transition-colors">
              <Mail size={14} strokeWidth={1.5} />
              HELLO@NOORAMODESTY.COM
            </a>
            <Link href="/shipping-and-return-policy" className="text-[8px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center gap-1.5">
              <Info size={10} />
              Shipping & Returns
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f5f3] flex items-center justify-center">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
