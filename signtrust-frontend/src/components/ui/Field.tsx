import { useState } from "react";
import { type UseFormRegisterReturn } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import clsx from "clsx";

interface FieldProps {
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "tel";
  error?: string;
  register?: UseFormRegisterReturn;
  name?: string;
  prefix?: string;
}

export default function Field({
  label,
  placeholder,
  type = "text",
  error,
  register,
  name,
  prefix,
}: FieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const inputClasses = clsx(
    "w-full bg-bg border border-border px-4 py-3 text-sm text-txt placeholder:text-txt-muted",
    "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary",
    "transition-colors",
    prefix ? "rounded-r-xl" : "rounded-xl",
    error && "border-danger focus:border-danger focus:ring-danger"
  );

  return (
    <div className="w-full">
      <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">
        {label}
      </label>

      <div className="relative flex">
        {prefix && (
          <span className="inline-flex items-center bg-border/30 border border-r-0 border-border rounded-l-xl px-3 text-sm text-txt-secondary">
            {prefix}
          </span>
        )}

        <input
          type={inputType}
          name={name}
          placeholder={placeholder}
          className={clsx(inputClasses, isPassword && "pr-11")}
          {...register}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-secondary transition-colors cursor-pointer"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && <p className="text-danger text-xs mt-1">{error}</p>}
    </div>
  );
}
