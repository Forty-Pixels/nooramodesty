"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { SiteLinks } from "@/types/siteLinks";
import { isStoreLocatorActive } from "@/utils/featureFlags";

export interface FooterProps {
  links: SiteLinks;
}

export const Footer = ({ links }: FooterProps) => {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleNewsletterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");

    const formData = new FormData();
    formData.set("source", "newsletter");
    formData.set("email", email);

    const response = await fetch("/api/leads/create", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      setEmail("");
      setStatus("success");
      return;
    }

    setStatus("error");
  };

  return (
    <footer className="bg-[#141414] text-white pt-16 pb-8 px-6 md:px-10 lg:px-20">
      <div className="max-w-[1440px] mx-auto">
        {/* Top Section: 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-2 mb-20">
          
          {/* Column 1: Brand & Contact */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-lg tracking-widest mb-2">NM</h3>
            <div className="text-sm text-[#BEBEBE] flex flex-col gap-1 leading-relaxed">
              <p>Colombo, Sri Lanka</p>
              <p>Mon-Fri, 10:00 - 18:00</p>
            </div>
            <p className="text-sm text-[#BEBEBE] mt-2 font-medium">{links.contactPhone}</p>
          </div>

          {/* Column 2: Socials & Newsletter */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              {links.social.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.isExternal ? "_blank" : undefined}
                  rel={link.isExternal ? "noreferrer" : undefined}
                  className="text-sm hover:text-white transition-colors tracking-wider"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-4 mt-4">
              <p className="text-sm tracking-widest font-medium">Drop your email to get updates:</p>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-4 max-w-[300px]">
                <input 
                  type="email" 
                  placeholder="" 
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setStatus("idle");
                  }}
                  required
                  className="bg-transparent border-b border-white outline-none py-2 text-sm w-full focus:border-gray-400 transition-colors"
                />
                <button disabled={status === "submitting"} className="bg-white text-black text-[10px] md:text-xs font-bold uppercase py-4 px-4 tracking-[0.2em] transition-all hover:bg-gray-200 active:scale-95 text-left disabled:opacity-60">
                  {status === "submitting" ? "SENDING..." : "SIGN UP"}
                </button>
                {status === "success" && <p className="text-[10px] uppercase tracking-[0.16em] text-[#BEBEBE]">You're on the list.</p>}
                {status === "error" && <p className="text-[10px] uppercase tracking-[0.16em] text-[#BEBEBE]">Could not sign up. Try again.</p>}
              </form>
            </div>
          </div>

          {/* Column 3: Site Links */}
          <div className="flex flex-col gap-3">
            {links.site
              .filter((link) => link.href !== "/store-locator" || isStoreLocatorActive)
              .map((link) => (
                <Link key={link.label} href={link.href} className="text-sm hover:text-gray-400 transition-colors tracking-wider">
                  {link.label}
                </Link>
              ))}
          </div>

          {/* Column 4: Legal Links */}
          <div className="flex flex-col gap-3">
            {links.legal.map((link) => (
              link.isExternal ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#BEBEBE] hover:text-white transition-colors tracking-wider"
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} href={link.href} className="text-sm text-[#BEBEBE] hover:text-white transition-colors tracking-wider">
                  {link.label}
                </Link>
              )
            ))}
          </div>
        </div>

        {/* Bottom Section: Large Logo & Copyright */}
        <div className="pt-12 border-t border-white/10 flex flex-col lg:flex-row justify-between items-end gap-10">
          <div className="w-full lg:w-[70%]">
            <Image 
              src="/noora-modesty-footer-logo.png"
              alt="Noora Modesty"
              width={800}
              height={150}
              className="w-full h-auto object-contain object-left max-w-[820px]"
            />
          </div>
          <div className="flex flex-col items-end gap-2 mb-2">
            <div className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-white whitespace-nowrap">
              © Copyright 2026 NOORA MODESTY
            </div>
            <a
              href="https://fortypixels.com"
              target="_blank"
              rel="noreferrer"
              className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-[#BEBEBE] hover:text-white transition-colors whitespace-nowrap"
            >
              Built by Fortypixels
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
