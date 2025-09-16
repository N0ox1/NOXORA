import Image from 'next/image';
import React from 'react';

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
}

export function Logo({ className = '', width = 140, height = 45 }: LogoProps) {
    return (
        <div className={`flex items-center ${className}`}>
            <Image
                src="https://otzkbzkko9zzxvfo.public.blob.vercel-storage.com/ChatGPT%20Image%2015%20de%20set.%20de%202025%2C%2022_50_52.png"
                alt="Noxora"
                width={width}
                height={height}
                priority
                className="object-contain"
            />
        </div>
    );
}
