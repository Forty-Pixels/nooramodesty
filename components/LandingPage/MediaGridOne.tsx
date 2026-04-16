"use client";

import React from "react";
import Image from "next/image";

const MediaGridOne = () => {
  return (
    <section className="pt-10 md:pt-16 pb-2 md:pb-4 bg-[#f6f5f3]">
      <div className="w-full">
        <div className="flex gap-1.5">
          {/* Image 1 */}
          <div className="flex-1">
            <div className="relative aspect-[9/16] w-full overflow-hidden bg-[#f6f5f3]">
              <Image
                src="/landing-page/media-grid-1/image-1.png"
                alt="Editorial Photography 1"
                fill
                className="object-cover object-center"
                sizes="50vw"
              />
            </div>
          </div>
          {/* Image 2 */}
          <div className="flex-1">
            <div className="relative aspect-[9/16] w-full overflow-hidden bg-[#f6f5f3]">
              <Image
                src="/landing-page/media-grid-1/image-2.png"
                alt="Editorial Photography 2"
                fill
                className="object-cover object-center"
                sizes="50vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MediaGridOne;
