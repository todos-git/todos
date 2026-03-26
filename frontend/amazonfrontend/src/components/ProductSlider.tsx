"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
    images: string[];
};

export default function ProductSlider({ images }: Props) {

    const [active, setActive] = useState(0);

    const currentImage =
        images.length > 0
            ? `${process.env.NEXT_PUBLIC_API_URL}${images[active]}`
            : "/no-image.png";

    return (
        <div className="flex flex-col gap-4">

            {/* MAIN IMAGE */}
            <div className="relative w-full h-96">
                <Image
                    src={currentImage}
                    alt="product image"
                    fill
                    className="object-cover rounded-xl"
                    unoptimized
                />
            </div>

            {/* SMALL IMAGES */}
            <div className="flex gap-3">

                {images.map((img, index) => {

                    const thumb = `${process.env.NEXT_PUBLIC_API_URL}${img}`;

                    return (
                        <div
                            key={index}
                            onClick={() => setActive(index)}
                            className={`relative w-20 h-20 cursor-pointer border rounded-lg overflow-hidden
              ${active === index ? "border-black" : "border-gray-300"}`}
                        >
                            <Image
                                src={thumb}
                                alt="thumb"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    );
                })}

            </div>
        </div>
    );
}