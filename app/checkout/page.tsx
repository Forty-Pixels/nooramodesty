"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock, ShieldCheck, Truck, X } from "lucide-react";
import { CheckoutAssistance } from "@/components/CheckoutPage/CheckoutAssistance";
import { calculateShippingQuote, DEFAULT_SITE_SETTINGS, normalizeSiteSettings } from "@/lib/shipping";
import useCartStore from "@/store";
import { CheckoutOrderPayload, PaymentMethod } from "@/types/order";
import { PublicSiteSettings } from "@/types/siteSettings";
import {
  SRI_LANKA_PHONE_PREFIX,
  uniqueMessages,
  validateEmail,
  validateRequiredText,
  validateSriLankaLocalNumber,
} from "@/utils/formValidation";

interface CheckoutFormState {
  fullName: string;
  mobileLocal: string;
  whatsappLocal: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
}

const initialFormState: CheckoutFormState = {
  fullName: "",
  mobileLocal: "",
  whatsappLocal: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  district: "",
};

const FIELD_LABELS: Record<keyof CheckoutFormState, string> = {
  fullName: "Full name",
  mobileLocal: "Phone",
  whatsappLocal: "WhatsApp number",
  email: "Email address",
  addressLine1: "Address",
  addressLine2: "Address",
  city: "City",
  district: "District",
};

const MAX_PAYMENT_SLIP_SIZE = 5 * 1024 * 1024;
const ALLOWED_PAYMENT_SLIP_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function formatCartItemSize(item: { size?: string; customSize?: boolean; customNote?: string }) {
  return item.customSize && item.customNote ? item.customNote : item.size;
}

interface CheckoutOrderResponse {
  orderNumber?: string;
  error?: string;
  errors?: string[];
}

interface CouponValidationResponse {
  valid?: boolean;
  message?: string;
  discountAmount?: number;
}

interface ColorPreviewModalState {
  src: string;
  alt: string;
}

function CheckoutContent() {
  const { items, clearCart, updateQuantity, buyNowItem, setBuyNowItem, updateBuyNowQuantity } = useCartStore();
  const searchParams = useSearchParams();
  const isBuyNow = searchParams.get("buyNow") === "true";

  const checkoutItems = isBuyNow && buyNowItem ? [buyNowItem] : items;

  const [formState, setFormState] = useState(initialFormState);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [isCouponError, setIsCouponError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [invalidFields, setInvalidFields] = useState<Set<keyof CheckoutFormState>>(new Set());
  const [orderNumber, setOrderNumber] = useState("");
  const [siteSettings, setSiteSettings] = useState<PublicSiteSettings>(DEFAULT_SITE_SETTINGS);
  const [previewImage, setPreviewImage] = useState<ColorPreviewModalState | null>(null);

  const subtotal = checkoutItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const itemQuantity = checkoutItems.reduce((acc, item) => acc + item.quantity, 0);
  const shippingQuote = calculateShippingQuote(itemQuantity, siteSettings);
  const shipping = shippingQuote.shipping;
  const total = subtotal + shipping - discountAmount;

  const payload: CheckoutOrderPayload = {
    customer: {
      fullName: formState.fullName,
      mobile: `${SRI_LANKA_PHONE_PREFIX}${formState.mobileLocal.replace(/\D/g, "")}`,
      whatsapp: formState.whatsappLocal.trim()
        ? `${SRI_LANKA_PHONE_PREFIX}${formState.whatsappLocal.replace(/\D/g, "")}`
        : undefined,
      email: formState.email.trim() || undefined,
      addressLine1: formState.addressLine1,
      addressLine2: formState.addressLine2,
      city: formState.city,
      district: formState.district,
    },
    paymentMethod,
    couponCode: couponCode || undefined,
    items: checkoutItems.map((item) => ({
      productId: item.productId || item._id.split("-")[0],
      clickomVariationId: item.clickomVariationId || 0,
      quantity: item.quantity,
      selectedColor: item.colorName || item.color || undefined,
      selectedColorHex: item.colorHex || undefined,
      size: item.size || undefined,
      selectedSize: item.size || undefined,
      sku: item.sku || undefined,
      customSize: item.customSize || item.size === "Custom",
      preOrder: item.preOrder,
      customLength: item.customLength || undefined,
      customBust: item.customBust || undefined,
      customHip: item.customHip || undefined,
      customSleeve: item.customSleeve || undefined,
      customNote: item.customNote || undefined,
    })),
  };

  const updateField = (field: keyof CheckoutFormState, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }));
    setInvalidFields((current) => {
      if (!current.has(field)) return current;
      const next = new Set(current);
      next.delete(field);
      return next;
    });
  };

  const fieldClassName = (field: keyof CheckoutFormState, extra = "") =>
    `${extra} w-full bg-white border px-5 py-4 text-xs font-medium focus:outline-none placeholder:text-gray-300 ${
      invalidFields.has(field)
        ? "border-[#B21E1E] focus:border-[#B21E1E]"
        : "border-black/5 focus:border-black/20"
    }`;

  useEffect(() => {
    let isMounted = true;

    async function loadSiteSettings() {
      const response = await fetch("/api/site-settings", { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as Partial<PublicSiteSettings> | null;
      if (isMounted && response.ok) {
        setSiteSettings(normalizeSiteSettings(data));
      }
    }

    void loadSiteSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const validateClient = () => {
    const fieldValidators: Array<[keyof CheckoutFormState, string[]]> = [
      ["fullName", validateRequiredText(formState.fullName, FIELD_LABELS.fullName, { minLength: 2, maxLength: 80 })],
      ["mobileLocal", validateSriLankaLocalNumber(formState.mobileLocal, FIELD_LABELS.mobileLocal)],
      ["whatsappLocal", formState.whatsappLocal.trim() ? validateSriLankaLocalNumber(formState.whatsappLocal, FIELD_LABELS.whatsappLocal) : []],
      ["email", formState.email.trim() ? validateEmail(formState.email) : []],
      ["addressLine1", validateRequiredText(formState.addressLine1, FIELD_LABELS.addressLine1, { minLength: 3, maxLength: 160 })],
      ["city", validateRequiredText(formState.city, FIELD_LABELS.city, { minLength: 2, maxLength: 80 })],
      ["district", validateRequiredText(formState.district, FIELD_LABELS.district, { minLength: 2, maxLength: 40 })],
    ];

    const fieldErrors = new Set<keyof CheckoutFormState>();
    const validationErrors: string[] = [];

    fieldValidators.forEach(([field, messages]) => {
      if (messages.length > 0) {
        fieldErrors.add(field);
        validationErrors.push(...messages);
      }
    });

    if (checkoutItems.length === 0) validationErrors.push("Your bag is empty.");
    if (checkoutItems.some((item) => !item.clickomVariationId)) validationErrors.push("Please choose a valid size for every item.");
    if (checkoutItems.some((item) => item.quantity < 1)) validationErrors.push("Item quantity must be at least 1.");
    if (checkoutItems.some((item) => item.quantity > 20)) validationErrors.push("Item quantity cannot be more than 20.");
    if (paymentSlip && !ALLOWED_PAYMENT_SLIP_TYPES.has(paymentSlip.type)) {
      validationErrors.push("Payment slip must be a JPEG, PNG, WEBP, or PDF file.");
    }
    if (paymentSlip && paymentSlip.size > MAX_PAYMENT_SLIP_SIZE) validationErrors.push("Payment slip must be 5MB or smaller.");

    return { errors: uniqueMessages(validationErrors), fieldErrors };
  };

  const validateCouponRequest = () => {
    if (checkoutItems.length === 0) return "Your bag is empty.";
    if (checkoutItems.some((item) => !item.clickomVariationId)) return "Choose a valid size for every item before applying a coupon.";
    if (checkoutItems.some((item) => item.quantity < 1 || item.quantity > 20)) return "Check item quantities before applying a coupon.";

    return "";
  };

  const handleApplyCoupon = async () => {
    setCouponMessage("");
    setIsCouponError(false);
    setDiscountAmount(0);

    if (!couponCode.trim()) {
      setCouponMessage("Enter a coupon code.");
      setIsCouponError(true);
      return;
    }

    const couponError = validateCouponRequest();

    if (couponError) {
      setCouponMessage(couponError);
      setIsCouponError(true);
      return;
    }

    const response = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as CouponValidationResponse;

    setCouponMessage(data.valid ? data.message || "Coupon applied." : data.message || "Invalid coupon.");
    setIsCouponError(!data.valid);
    setDiscountAmount(data.valid ? data.discountAmount || 0 : 0);
  };

  const handlePlaceOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors([]);
    setInvalidFields(new Set());
    const { errors: clientErrors, fieldErrors } = validateClient();

    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      setInvalidFields(fieldErrors);
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
    const data = (await response.json()) as CheckoutOrderResponse;
    setIsProcessing(false);

    if (!response.ok) {
      setErrors(data.errors?.length ? data.errors : [data.error || "Unable to create order."]);
      return;
    }

    if (!data.orderNumber) {
      setErrors(["Order was created, but the order number was not returned."]);
      return;
    }

    setOrderNumber(data.orderNumber);
    if (isBuyNow) {
      setBuyNowItem(null);
    } else {
      clearCart();
    }
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

  if (checkoutItems.length === 0) {
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
    <form onSubmit={handlePlaceOrder} noValidate className="bg-[#f6f5f3] min-h-screen font-sans text-black">
      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-6 py-10" onClick={() => setPreviewImage(null)}>
          <div className="relative w-full max-w-sm bg-white p-3 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center bg-white text-black shadow-sm transition-colors hover:bg-[#f6f5f3]"
              aria-label="Close color preview"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
            <div className="relative aspect-[3/4] w-full bg-[#f6f5f3]">
              <Image src={previewImage.src} alt={previewImage.alt} fill className="object-cover" sizes="(max-width: 640px) 90vw, 384px" />
            </div>
          </div>
        </div>
      )}
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
              <input value={formState.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Full Name" className={fieldClassName("fullName", "md:col-span-2")} />
              <input value={formState.email} onChange={(e) => updateField("email", e.target.value)} type="email" placeholder="Email Address (optional)" className={fieldClassName("email")} />
              <div className={`flex w-full bg-white border ${invalidFields.has("mobileLocal") ? "border-[#B21E1E]" : "border-black/5 focus-within:border-black/20"}`}>
                <span className="flex items-center pl-5 pr-2 text-xs font-medium text-gray-400">{SRI_LANKA_PHONE_PREFIX}</span>
                <input
                  value={formState.mobileLocal}
                  onChange={(e) => updateField("mobileLocal", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Phone"
                  inputMode="numeric"
                  className="w-full bg-transparent pr-5 py-4 text-xs font-medium focus:outline-none placeholder:text-gray-300"
                />
              </div>
              <div className={`flex w-full bg-white border ${invalidFields.has("whatsappLocal") ? "border-[#B21E1E]" : "border-black/5 focus-within:border-black/20"}`}>
                <span className="flex items-center pl-5 pr-2 text-xs font-medium text-gray-400">{SRI_LANKA_PHONE_PREFIX}</span>
                <input
                  value={formState.whatsappLocal}
                  onChange={(e) => updateField("whatsappLocal", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="WhatsApp Number (optional)"
                  inputMode="numeric"
                  className="w-full bg-transparent pr-5 py-4 text-xs font-medium focus:outline-none placeholder:text-gray-300"
                />
              </div>
              <input value={formState.addressLine1} onChange={(e) => updateField("addressLine1", e.target.value)} placeholder="Address" className={fieldClassName("addressLine1", "md:col-span-2")} />
              <input value={formState.addressLine2} onChange={(e) => updateField("addressLine2", e.target.value)} placeholder="Apartment, suite, etc. (optional)" className={fieldClassName("addressLine2", "md:col-span-2")} />
              <input value={formState.city} onChange={(e) => updateField("city", e.target.value)} placeholder="City" className={fieldClassName("city")} />
              <input value={formState.district} onChange={(e) => updateField("district", e.target.value)} placeholder="District" className={fieldClassName("district")} />
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
                  {siteSettings.bankName || siteSettings.bankAccountName || siteSettings.bankAccountNumber || siteSettings.bankBranch ? (
                    <>
                      {siteSettings.bankName && <p>Bank: {siteSettings.bankName}</p>}
                      {siteSettings.bankAccountName && <p>Name: {siteSettings.bankAccountName}</p>}
                      {siteSettings.bankAccountNumber && <p>Account: {siteSettings.bankAccountNumber}</p>}
                      {siteSettings.bankBranch && <p>Branch: {siteSettings.bankBranch}</p>}
                    </>
                  ) : (
                    <p>Bank details are not configured yet.</p>
                  )}
                  <p className="text-gray-400">Payment slips not received within {siteSettings.bankTransferDeadlineDays} days will automatically convert this order to Cash on Delivery.</p>
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

          {errors.length > 0 && (
            <div className="border border-[#B21E1E]/20 bg-[#B21E1E]/5 px-4 py-3 text-sm font-bold text-[#B21E1E]" aria-live="polite">
              {errors.length === 1 ? (
                <p>{errors[0]}</p>
              ) : (
                <ul className="list-disc space-y-1 pl-5">
                  {errors.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <button disabled={isProcessing} className="w-full bg-black text-white py-6 text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-zinc-800 disabled:bg-gray-400 flex items-center justify-center gap-3">
            {isProcessing ? "Processing..." : "Place Order"}
            {!isProcessing && <ArrowRight size={16} />}
          </button>

          <CheckoutAssistance className="lg:hidden" />
        </div>

        <div className="lg:col-span-5 bg-white px-6 md:px-12 py-12 h-fit lg:sticky lg:top-[88px] order-1 lg:order-2 border-b lg:border-b-0 border-black/5">
          <h2 className="text-lg font-bold uppercase tracking-widest mb-10">Order Review</h2>
          <div className="space-y-8 mb-10">
            {checkoutItems.map((item) => (
              <div key={item._id} className="flex gap-5">
                <div className="relative w-20 aspect-[3/4] bg-[#f6f5f3]">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest">{item.title}</h3>
                  <div className="mt-1 flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-400">
                    {item.colorHex && <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ backgroundColor: item.colorHex }} />}
                    {item.colorPreviewImage && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!item.colorPreviewImage) return;
                          setPreviewImage({
                            src: item.colorPreviewImage,
                            alt: `${item.colorName || item.title} color preview`,
                          });
                        }}
                        className="group relative h-10 w-8 overflow-hidden border border-black/10 bg-white transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-black/20"
                        aria-label={`Open ${item.colorName || item.title} color preview`}
                      >
                        <Image src={item.colorPreviewImage} alt="" fill className="object-cover transition-transform duration-300 group-hover:scale-110" sizes="32px" />
                      </button>
                    )}
                    <span>{[item.colorName, formatCartItemSize(item)].filter(Boolean).join(" / ")} {item.customSize ? `(+ LKR ${siteSettings.customSizeCharge.toLocaleString()})` : ""}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <button type="button" onClick={() => {
                      if (isBuyNow) {
                        updateBuyNowQuantity(item.quantity - 1);
                      } else {
                        updateQuantity(item._id, item.quantity - 1);
                      }
                    }} className="w-5 h-5 border border-black/10 rounded-full text-[10px]">-</button>
                    <span className="text-[10px] font-bold">{item.quantity}</span>
                    <button type="button" onClick={() => {
                      if (isBuyNow) {
                        updateBuyNowQuantity(item.quantity + 1);
                      } else {
                        updateQuantity(item._id, item.quantity + 1);
                      }
                    }} className="w-5 h-5 border border-black/10 rounded-full text-[10px]">+</button>
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
            {couponMessage && (
              <p className={`mt-3 text-[9px] uppercase tracking-widest ${
                isCouponError
                  ? "border border-[#B21E1E]/20 bg-[#B21E1E]/5 px-3 py-2 font-bold text-[#B21E1E]"
                  : "text-gray-400"
              }`}>
                {couponMessage}
              </p>
            )}
          </div>

          <div className="space-y-4 pt-8 border-t border-black/5">
            <div className="flex justify-between text-[10px] font-medium uppercase tracking-widest text-gray-500"><span>Subtotal</span><span>LKR {subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-[10px] font-medium uppercase tracking-widest text-gray-500"><span>Shipping</span><span>{shipping === 0 ? "FREE" : `LKR ${shipping.toLocaleString()}`}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#B21E1E]"><span>Discount</span><span>- LKR {discountAmount.toLocaleString()}</span></div>}
            <div className="flex justify-between text-base font-bold uppercase tracking-[0.2em] pt-4 border-t border-black/5"><span>Total</span><span>LKR {total.toLocaleString()}</span></div>
          </div>

          <CheckoutAssistance className="mt-12 hidden lg:block" />
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
