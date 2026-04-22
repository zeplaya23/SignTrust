import { Shield } from "lucide-react";
import clsx from "clsx";

type LogoSize = "sm" | "md" | "lg";
type LogoVariant = "default" | "light";

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
}

const sizeConfig: Record<LogoSize, { icon: number; text: string }> = {
  sm: { icon: 24, text: "text-lg" },
  md: { icon: 32, text: "text-xl" },
  lg: { icon: 40, text: "text-2xl" },
};

export default function Logo({ size = "md", variant = "default" }: LogoProps) {
  const config = sizeConfig[size];
  const isLight = variant === "light";

  return (
    <div className="flex items-center gap-2">
      <Shield size={config.icon} className={isLight ? "text-white" : "text-primary"} />
      <div className={clsx("font-bold leading-none", config.text)}>
        <span className={isLight ? "text-white" : "text-dark"}>di</span>
        <span className={isLight ? "text-white" : "text-primary"}>Sign</span>
        <span className={clsx("font-normal ml-1", isLight ? "text-white/60" : "text-txt-secondary")} style={{ fontSize: '0.65em' }}>Parapheur</span>
      </div>
    </div>
  );
}
