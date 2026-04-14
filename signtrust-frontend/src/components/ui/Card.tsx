import clsx from "clsx";

type CardPadding = "sm" | "md" | "lg";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: CardPadding;
}

const paddingStyles: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({ children, className, padding = "md" }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-white rounded-2xl border border-border",
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
