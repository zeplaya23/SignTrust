import clsx from "clsx";

type BadgeStatus = "pending" | "signed" | "rejected" | "draft";

interface BadgeProps {
  status: BadgeStatus;
  className?: string;
}

const statusConfig: Record<BadgeStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-warning-light", text: "text-warning", label: "En attente" },
  signed: { bg: "bg-success-light", text: "text-success", label: "Signé" },
  rejected: { bg: "bg-danger-light", text: "text-danger", label: "Refusé" },
  draft: { bg: "bg-primary-light", text: "text-primary", label: "Brouillon" },
};

export default function Badge({ status, className }: BadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
}
