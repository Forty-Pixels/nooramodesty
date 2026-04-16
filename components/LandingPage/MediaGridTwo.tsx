"use client";

import React from "react";
import Image from "next/image";

const MediaGridTwo = () => {
  return (
    <section className="pt-10 md:pt-16 pb-2 md:pb-4 bg-[#f6f5f3]">
      <div className="w-full">
        <div className="flex">
          {/* Image 1 */}
          <div className="w-1/3">
            <div className="relative aspect-[9/16] w-full overflow-hidden bg-[#f6f5f3]">
              <Image
                src="/landing-page/media-grid-2/image-1.png"
                alt="Editorial Photography 3"
                fill
                className="object-cover object-center"
                sizes="33vw"
              />
            </div>
          </div>
          {/* Image 2 */}
          <div className="w-1/3">
            <div className="relative aspect-[9/16] w-full overflow-hidden bg-[#f6f5f3]">
              <Image
                src="/landing-page/media-grid-2/image-2.png"
                alt="Editorial Photography 4"
                fill
                className="object-cover object-center"
                sizes="33vw"
              />
            </div>
          </div>
          {/* Image 3 */}
          <div className="w-1/3">
            <div className="relative aspect-[9/16] w-full overflow-hidden bg-[#f6f5f3]">
              <Image
                src="/landing-page/media-grid-2/image-3.png"
                alt="Editorial Photography 5"
                fill
                className="object-cover object-center"
                sizes="33vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MediaGridTwo;
