"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface HeroProps {
    layout?: "split" | "splitFlipped" | "fullSingleImage" | "fullTwoImage";
    imageOneSrc?: string;
    imageTwoSrc?: string;
    centerLogoSrc?: string;
    ctaLabel?: string;
    ctaHref?: string;
}

const Hero: React.FC<HeroProps> = ({
    layout = "split",
    imageOneSrc,
    imageTwoSrc,
    centerLogoSrc,
    ctaLabel,
    ctaHref,
}) => {
    const isFlipped = layout === "splitFlipped";
    const isSingleFull = layout === "fullSingleImage";
    const isTwoImageFull = layout === "fullTwoImage";

    if (isSingleFull || isTwoImageFull) {
        return (
            <section
                className={`relative w-full bg-[#f6f5f3] overflow-hidden ${
                    isSingleFull ? "h-[70vh] md:h-[calc(100vh-52px)]" : "h-[calc(100vh-44px)] md:h-[calc(100vh-52px)]"
                }`}
            >
                {isTwoImageFull ? (
                    <div className="flex h-full w-full flex-col md:flex-row">
                        <div className="relative h-1/2 w-full md:h-full md:w-1/2">
                            {imageOneSrc && (
                                <Image
                                    src={imageOneSrc}
                                    alt="Noora Modesty Collection Left"
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover object-center"
                                    priority
                                />
                            )}
                        </div>
                        <div className="relative h-1/2 w-full md:h-full md:w-1/2">
                            {imageTwoSrc && (
                                <Image
                                    src={imageTwoSrc}
                                    alt="Noora Modesty Collection Right"
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover object-center"
                                    priority
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    imageOneSrc && (
                        <Image
                            src={imageOneSrc}
                            alt="Noora Modesty Collection"
                            fill
                            sizes="(max-width: 768px) 100vw, 100vw"
                            quality={90}
                            className="object-cover object-center"
                            priority
                        />
                    )
                )}
                <div className="absolute inset-0 bg-black/10" />

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none mix-blend-multiply md:mix-blend-normal flex flex-col items-center w-full max-w-xs md:max-w-none">
                    <div className="relative w-32 h-44 md:w-72 md:h-96">
                        {centerLogoSrc && (
                            <Image
                                src={centerLogoSrc}
                                alt="Noora Modesty Center Monogram"
                                fill
                                sizes="(max-width: 768px) 8rem, 18rem"
                                className="object-contain"
                                priority
                            />
                        )}
                    </div>
                </div>

                {ctaHref && ctaLabel && <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 w-fit">
                    <Link
                        href={ctaHref}
                        className="group relative inline-flex items-center justify-center px-6 py-2 md:px-4 md:py-1 bg-white md:bg-white/90 font-bold text-[0.7rem] tracking-[0.4em] text-black uppercase overflow-hidden transition-all duration-300 shadow-md border border-black/5"
                    >
                        <span className="absolute inset-0 w-full h-full bg-black transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></span>
                        <span className="relative z-10 group-hover:text-white transition-colors duration-300 ease-out">{ctaLabel}</span>
                    </Link>
                </div>}
            </section>
        );
    }

    return (
        <section className={`relative w-full h-[calc(100vh-44px)] md:h-[calc(100vh-52px)] bg-[#f6f5f3] overflow-hidden flex flex-col ${isFlipped ? "md:flex-row-reverse" : "md:flex-row"}`}>

            {/* Left Image Section */}
            <div className="w-full h-1/2 md:h-full md:w-1/2 relative flex justify-center md:justify-start md:pl-[8%] items-center overflow-hidden bg-[#f6f5f3]">
                <div className="w-[65%] max-h-[85%] sm:w-[55%] md:max-h-none md:w-[50%] lg:w-[48%] aspect-[3/4] md:h-[70%] relative transform transition-transform duration-1000 ease-out">
                    {imageOneSrc && (
                        <Image
                            src={imageOneSrc}
                            alt="Noora Modesty Collection Left"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover object-center"
                            priority
                        />
                    )}
                </div>
            </div>

            {/* Right Image Section */}
            <div className="w-full h-1/2 md:h-full md:w-1/2 relative overflow-hidden flex justify-center">
                <div className="w-full h-full relative">
                    {imageTwoSrc && (
                        <Image
                            src={imageTwoSrc}
                            alt="Noora Modesty Collection Right"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover object-center"
                            priority
                        />
                    )}
                </div>
            </div>

            {/* Center Absolute Logo - Scaled for better mobile proportions */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none mix-blend-multiply md:mix-blend-normal flex flex-col items-center w-full max-w-xs md:max-w-none">
                <div className="relative w-32 h-44 md:w-72 md:h-96">
                    {centerLogoSrc && (
                        <Image
                            src={centerLogoSrc}
                            alt="Noora Modesty Center Monogram"
                            fill
                            sizes="(max-width: 768px) 8rem, 18rem"
                            className="object-contain"
                            priority
                        />
                    )}
                </div>
            </div>

            {/* Shop Button overlay - More compact white background box for mobile visibility */}
            {ctaHref && ctaLabel && <div className="absolute bottom-10 md:bottom-10 left-1/2 transform -translate-x-1/2 z-20 w-fit">
                <Link
                    href={ctaHref}
                    className="group relative inline-flex items-center justify-center px-6 py-2 md:px-4 md:py-1 bg-white md:bg-transparent font-bold text-[0.7rem] md:text-[0.7rem] tracking-[0.4em] text-black uppercase overflow-hidden transition-all duration-300 shadow-md md:shadow-none border border-black/5 md:border-none"
                >
                    <span className="absolute inset-0 w-full h-full bg-black transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></span>
                    <span className="relative z-10 group-hover:text-white transition-colors duration-300 ease-out">{ctaLabel}</span>
                </Link>
            </div>}

        </section>
    );
};

export default Hero;
