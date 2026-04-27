"use client";

import { motion } from "framer-motion";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function TransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Use both pathname and search params as the key to trigger animations on filtering
  const key = `${pathname}?${searchParams.toString()}`;

  return (
    <motion.div
      key={key}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.33, 1, 0.68, 1], // Smooth standard ease
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

export default function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <TransitionWrapper>{children}</TransitionWrapper>
    </Suspense>
  );
}
