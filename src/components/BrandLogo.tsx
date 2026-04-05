import Image from "next/image";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function BrandLogo({ size = "md", className = "" }: BrandLogoProps) {
  const dimensions = {
    sm: { w: 120, h: 36, class: "h-9" },
    md: { w: 140, h: 42, class: "h-11" },
    lg: { w: 180, h: 54, class: "h-14" },
    xl: { w: 240, h: 72, class: "h-20" },
  };

  const current = dimensions[size];

  return (
    <div className={`relative flex items-center ${className}`}>
      <Image 
        src="/logo.png" 
        alt="CarMD Logo" 
        width={current.w} 
        height={current.h} 
        className={`${current.class} w-auto [filter:invert(1)_hue-rotate(180deg)] brightness-125`}
        priority
      />
    </div>
  );
}

