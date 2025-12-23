import React from "react";

export type LogoProps = {
    size?: number;
    withText?: boolean;
    className?: string;
    textClassName?: string;
    alt?: string;
};

export function Logo({
    size = 72,
    className = "",
    alt = "FitGym logo",
}: LogoProps) {
    return (
        <div
            className={`inline-flex items-center gap-2 rounded-lg px-2 py-1 ${className}`}
            aria-label="Fitgym"
        >
            <img
                src="https://github.com/Ludran1/fitgym-admin/blob/main/public/fitgym-logo.png?raw=true"
                loading="eager"
                className="rounded-lg"
                width={size}
                height={size}
                alt={alt}
            />
        </div>
    );
}

export default Logo;