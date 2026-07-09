"use client";

import { useEffect } from "react";

export default function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Hide the site Navbar, Footer, and Announcement Bar so Studio has a clean full-screen UI
    const navbar = document.querySelector("body > nav, body > header");
    const footer = document.querySelector("body > footer, footer");
    const announcement = document.getElementById("announcement-bar");

    if (navbar instanceof HTMLElement) navbar.style.display = "none";
    if (footer instanceof HTMLElement) footer.style.display = "none";
    if (announcement instanceof HTMLElement) announcement.style.display = "none";

    return () => {
      if (navbar instanceof HTMLElement) navbar.style.display = "";
      if (footer instanceof HTMLElement) footer.style.display = "";
      if (announcement instanceof HTMLElement) announcement.style.display = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {children}
    </div>
  );
}
