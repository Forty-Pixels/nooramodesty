import { PolicyContent } from "@/components/PolicyPage/PolicyContent";
import { shippingAndReturnPolicy } from "@/data/policies";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ShippingAndReturnPolicyPage() {
  return (
    <div className="flex flex-col">
      <PolicyContent content={shippingAndReturnPolicy} />
      
      {/* CTA Section */}
      <div className="bg-[#f6f5f3] py-20 px-6">
        <div className="max-w-[720px] mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-[0.2em] text-black">
              Need to request a return?
            </h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold leading-relaxed">
              Our automated system makes it easy to submit your request for a return or cancellation.
            </p>
          </div>
          <Link
            href="/returns-and-cancellations"
            className="inline-flex items-center gap-4 bg-black text-white px-12 py-5 text-[10px] tracking-[0.4em] font-bold uppercase hover:bg-zinc-800 transition-all active:scale-95 shadow-xl shadow-black/10"
          >
            Go to Returns Form
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
