import { Shield } from "lucide-react";
import clsx from "clsx";

type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  size?: LogoSize;
}

const sizeConfig: Record<LogoSize, { icon: number; text: string }> = {
  sm: { icon: 24, text: "text-lg" },
  md: { icon: 32, text: "text-xl" },
  lg: { icon: 40, text: "text-2xl" },
};

export default function Logo({ size = "md" }: LogoProps) {
  const config = sizeConfig[size];

  return (
    <div className="flex items-center gap-2">
      <Shield size={config.icon} className="text-primary" />
      <div className={clsx("font-bold leading-none", config.text)}>
        <span className="text-primary">Cryptoneo</span>
        <span className="text-dark"> SignTrust</span>
      </div>
    </div>
  );
}
