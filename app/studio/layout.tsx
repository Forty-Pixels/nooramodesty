"use client";

import { useEffect } from "react";

export default function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Hide the site Navbar and Footer so Studio has a clean full-screen UI
    const navbar = document.querySelector("body > nav, body > header");
    const footer = document.querySelector("body > footer, footer");

    if (navbar instanceof HTMLElement) navbar.style.display = "none";
    if (footer instanceof HTMLElement) footer.style.display = "none";

    return () => {
      if (navbar instanceof HTMLElement) navbar.style.display = "";
      if (footer instanceof HTMLElement) footer.style.display = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {children}
    </div>
  );
}
