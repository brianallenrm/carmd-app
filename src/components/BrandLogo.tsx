import Image from "next/image";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark";
  className?: string;
}

export default function BrandLogo({ size = "md", variant = "light", className = "" }: BrandLogoProps) {
  const dimensions = {
    sm: { w: 120, h: 36, class: "h-8" },
    md: { w: 140, h: 42, class: "h-10" },
    lg: { w: 180, h: 54, class: "h-14" },
    xl: { w: 240, h: 72, class: "h-20" },
  };

  const current = dimensions[size];

  const filterClass = variant === "dark" 
    ? "brightness-0 invert" 
    : "object-contain";

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src="/logo.png" 
        alt="CarMD Logo" 
        className={`${current.class} w-auto ${filterClass}`}
      />
    </div>
  );
}

