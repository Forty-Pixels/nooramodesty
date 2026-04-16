"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface HeroProps {
    imageOneSrc?: string;
    imageTwoSrc?: string;
    centerLogoSrc?: string;
}

const Hero: React.FC<HeroProps> = ({
    imageOneSrc = "/landing-page/hero/hero-image1.png",
    imageTwoSrc = "/landing-page/hero/hero-image-2.png",
    centerLogoSrc = "/noora-modesty-logo-2.png",
}) => {
    return (
        <section className="relative w-full h-[calc(100vh-44px)] md:h-[calc(100vh-52px)] bg-[#f6f5f3] overflow-hidden flex flex-col md:flex-row">

            {/* Left Image Section */}
            <div className="w-full h-1/2 md:h-full md:w-1/2 relative flex justify-center md:justify-start md:pl-[8%] items-center overflow-hidden bg-[#f6f5f3]">
                <div className="w-[65%] max-h-[85%] sm:w-[55%] md:max-h-none md:w-[50%] lg:w-[48%] aspect-[3/4] md:h-[70%] relative transform transition-transform duration-1000 ease-out">
                    <Image
                        src={imageOneSrc}
                        alt="Noora Modesty Collection Left"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover object-center"
                        priority
                    />
                </div>
            </div>

            {/* Right Image Section */}
            <div className="w-full h-1/2 md:h-full md:w-1/2 relative overflow-hidden flex justify-center">
                <div className="w-full h-full relative">
                    <Image
                        src={imageTwoSrc}
                        alt="Noora Modesty Collection Right"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover object-center"
                        priority
                    />
                </div>
            </div>

            {/* Center Absolute Logo - Sized to match design (Maximum impact) */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none mix-blend-multiply md:mix-blend-normal flex flex-col items-center w-full max-w-sm md:max-w-none">
                <div className="relative w-48 h-64 md:w-72 md:h-96">
                    <Image
                        src={centerLogoSrc}
                        alt="Noora Modesty Center Monogram"
                        fill
                        sizes="(max-width: 768px) 12rem, 18rem"
                        className="object-contain"
                        priority
                    />
                </div>
            </div>

            {/* Shop Button overlay - Positioned lower and much smaller */}
            <div className="absolute bottom-6 md:bottom-10 left-1/2 transform -translate-x-1/2 z-20">
                <Link
                    href="/shop"
                    className="group relative inline-flex items-center justify-center px-4 py-1 font-bold text-[0.65rem] md:text-[0.7rem] tracking-[0.4em] text-black uppercase overflow-hidden"
                >
                    <span className="absolute inset-0 w-full h-full bg-black transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></span>
                    <span className="relative z-10 group-hover:text-white transition-colors duration-300 ease-out">SHOP</span>
                </Link>
            </div>

        </section>
    );
};

export default Hero;
