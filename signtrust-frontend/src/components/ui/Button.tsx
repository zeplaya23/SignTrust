import { type ButtonHTMLAttributes } from "react";
import { type LucideIcon } from "lucide-react";
import clsx from "clsx";

type ButtonVariant =
  | "primary"
  | "accent"
  | "success"
  | "danger"
  | "outline"
  | "default"
  | "white";

type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: ButtonVariant;
  icon?: LucideIcon;
  size?: ButtonSize;
  type?: "button" | "submit";
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary/80",
  accent: "bg-accent text-white hover:opacity-90",
  success: "bg-success text-white hover:opacity-90",
  danger: "bg-danger text-white hover:opacity-90",
  outline: "bg-white text-primary border border-border hover:bg-bg",
  default: "bg-bg text-txt hover:bg-border/30",
  white: "bg-white text-txt hover:bg-bg",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-base",
};

export default function Button({
  variant = "primary",
  icon: Icon,
  size = "md",
  type = "button",
  disabled = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={clsx(
        "rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
        variantStyles[variant],
        sizeStyles[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...rest}
    >
      {Icon && <Icon size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />}
      {children}
    </button>
  );
}
