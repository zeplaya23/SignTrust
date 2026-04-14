import { useRef, useState, useCallback, useEffect, type KeyboardEvent, type ClipboardEvent } from "react";
import clsx from "clsx";

interface OtpInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  disabled?: boolean;
}

export default function OtpInput({ length = 6, onComplete, disabled = false }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const triggerComplete = useCallback(
    (newValues: string[]) => {
      const code = newValues.join("");
      if (code.length === length && onComplete) {
        onComplete(code);
      }
    },
    [length, onComplete]
  );

  const handleChange = (index: number, value: string) => {
    if (disabled) return;

    const digit = value.replace(/\D/g, "").slice(-1);
    const newValues = [...values];
    newValues[index] = digit;
    setValues(newValues);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    triggerComplete(newValues);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      if (!values[index] && index > 0) {
        const newValues = [...values];
        newValues[index - 1] = "";
        setValues(newValues);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newValues = [...values];
        newValues[index] = "";
        setValues(newValues);
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;

    const newValues = [...values];
    for (let i = 0; i < length; i++) {
      newValues[i] = pasted[i] || "";
    }
    setValues(newValues);

    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();

    triggerComplete(newValues);
  };

  return (
    <div className="flex items-center justify-center gap-3">
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={clsx(
            "w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all",
            "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary",
            disabled && "opacity-50 cursor-not-allowed",
            value
              ? "bg-primary-light border-primary text-primary"
              : "bg-white border-border text-txt"
          )}
        />
      ))}
    </div>
  );
}
