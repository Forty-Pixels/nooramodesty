import Link from "next/link";
import { Info, Mail } from "lucide-react";

interface CheckoutAssistanceProps {
  className?: string;
}

export function CheckoutAssistance({ className = "" }: CheckoutAssistanceProps) {
  return (
    <div className={`pt-8 border-t border-black/5 space-y-4 ${className}`}>
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
  );
}
