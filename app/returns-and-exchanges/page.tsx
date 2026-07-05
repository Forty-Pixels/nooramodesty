"use client";

import React, { useState } from "react";
import { ShieldCheck, ArrowRight, ChevronDown, Check } from "lucide-react";
import Link from "next/link";
import { uniqueMessages, validateEmail, validatePhone, validateRequiredText } from "@/utils/formValidation";

type RequestType = "return" | "exchange";

interface RequestFormState {
  customerName: string;
  orderNumber: string;
  phone: string;
  email: string;
  details: string;
}

interface RequestResponse {
  ok?: boolean;
  error?: string;
  errors?: string[];
}

const REASONS: Record<RequestType, string[]> = {
  return: [
    "Size doesn't fit",
    "Received wrong item",
    "Item is damaged or defective",
    "Product looks different from photos",
    "Quality not as expected",
    "Other",
  ],
  exchange: [
    "Size doesn't fit",
    "Want a different color",
    "Received wrong item",
    "Item is damaged or defective",
    "Product looks different from photos",
    "Other",
  ],
};

const initialFormState: RequestFormState = {
  customerName: "",
  orderNumber: "",
  phone: "",
  email: "",
  details: "",
};

export default function ReturnsAndExchangesPage() {
  const [requestType, setRequestType] = useState<RequestType>("return");
  const [formState, setFormState] = useState(initialFormState);
  const [reason, setReason] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const updateField = (field: keyof RequestFormState, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const validateClient = () => {
    const validationErrors = uniqueMessages([
      ...validateRequiredText(formState.customerName, "Full name", { minLength: 2, maxLength: 80 }),
      ...validateRequiredText(formState.orderNumber, "Order number", { minLength: 3, maxLength: 40 }),
      ...validatePhone(formState.phone),
      ...validateEmail(formState.email),
      ...validateRequiredText(reason, "Reason"),
      ...validateRequiredText(formState.details, "Additional details", { minLength: 10, maxLength: 1000 }),
    ]);

    return validationErrors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors([]);
    const clientErrors = validateClient();

    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    setIsProcessing(true);
    const response = await fetch("/api/return-exchange-requests/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requestType,
        customerName: formState.customerName,
        orderNumber: formState.orderNumber,
        phone: formState.phone,
        email: formState.email,
        reason,
        details: formState.details,
      }),
    });
    const data = (await response.json()) as RequestResponse;
    setIsProcessing(false);

    if (!response.ok || !data.ok) {
      setErrors(data.errors?.length ? data.errors : [data.error || "Unable to submit request."]);
      return;
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
            <Check size={40} className="text-white" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold uppercase tracking-[0.2em] text-black">
              Request Sent
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold leading-relaxed">
              Your request has been received. Our team will review the details and contact you within 24-48 hours.
            </p>
          </div>
          <div className="pt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-3 bg-black text-white px-12 py-4 text-[10px] tracking-[0.4em] font-bold uppercase hover:bg-zinc-800 transition-all active:scale-95"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f5f3] pt-24 md:pt-32 pb-20 px-4 md:px-6">
      <div className="max-w-2xl mx-auto bg-white p-6 md:p-16 shadow-sm">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-[0.15em] md:tracking-[0.25em] text-black mb-4 leading-tight">
            Returns & <br className="md:hidden" /> Exchanges
          </h1>
          <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
            Please fill out the form below to submit your request
          </p>
        </div>

        <div className="mb-10 p-5 bg-[#f6f5f3] border border-black/5 flex items-start gap-4">
          <ShieldCheck size={18} className="text-black shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black">Important Notice</p>
            <ul className="list-disc pl-4 text-[9px] uppercase tracking-[0.12em] text-gray-500 font-bold space-y-1.5 leading-relaxed">
              <li>Exchange/ return not possible for customized sizing.</li>
              <li>Returns are only accepted for valid reasons only.</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-8 md:space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Request Type</label>
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              {(["return", "exchange"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setRequestType(type);
                    setReason("");
                  }}
                  className={`py-3.5 md:py-4 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] border transition-all ${
                    requestType === type
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-600 border-black/10 hover:border-black/30"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Full Name</label>
              <input
                type="text"
                value={formState.customerName}
                onChange={(event) => updateField("customerName", event.target.value)}
                className="w-full bg-transparent border-b border-black/20 focus:border-black outline-none py-2 text-sm transition-colors text-black placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Order Number</label>
              <input
                type="text"
                value={formState.orderNumber}
                onChange={(event) => updateField("orderNumber", event.target.value)}
                placeholder="e.g. #NM20261234"
                className="w-full bg-transparent border-b border-black/20 focus:border-black outline-none py-2 text-sm transition-colors text-black placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Phone Number</label>
              <input
                type="tel"
                value={formState.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="e.g. +94 77 123 4567"
                className="w-full bg-transparent border-b border-black/20 focus:border-black outline-none py-2 text-sm transition-colors text-black placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Email Address</label>
              <input
                type="email"
                value={formState.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent border-b border-black/20 focus:border-black outline-none py-2 text-sm transition-colors text-black placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="space-y-2 relative">
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Reason</label>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between bg-transparent border-b border-black/20 focus:border-black outline-none py-2 text-sm transition-colors text-left"
            >
              <span className={reason ? "text-black" : "text-gray-500"}>
                {reason || `Select a reason for ${requestType}`}
              </span>
              <ChevronDown size={14} className={`text-gray-600 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-black/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="max-h-60 overflow-y-auto">
                  {REASONS[requestType].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setReason(option);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-[#f6f5f3] hover:text-black transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Additional Details</label>
            <textarea
              rows={4}
              value={formState.details}
              onChange={(event) => updateField("details", event.target.value)}
              className="w-full bg-transparent border border-black/10 focus:border-black outline-none p-4 text-sm transition-colors resize-none text-black placeholder:text-gray-400"
              placeholder="Please provide any extra information here..."
            />
          </div>

          {errors.length > 0 && (
            <div className="border border-[#B21E1E]/20 bg-[#B21E1E]/5 px-4 py-3 text-sm font-bold text-[#B21E1E]" aria-live="polite">
              {errors.length === 1 ? (
                <p>{errors[0]}</p>
              ) : (
                <ul className="list-disc space-y-1 pl-5">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="pt-6">
            <button
              disabled={isProcessing}
              className={`w-full bg-black text-white py-5 md:py-6 text-[10px] tracking-[0.3em] md:tracking-[0.5em] font-bold uppercase transition-all flex items-center justify-center gap-4 ${
                isProcessing ? "opacity-70 cursor-not-allowed" : "hover:bg-zinc-800 active:scale-[0.98]"
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  Submit Request
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
