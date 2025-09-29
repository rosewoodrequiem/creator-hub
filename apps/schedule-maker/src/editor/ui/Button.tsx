import React from "react";

type ButtonVariant = "standard" | "pill";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Shape variant */
  variant?: ButtonVariant;
  /** Tailwind hover classes, e.g. "hover:bg-black/80" or "hover:bg-[--color-brand]" */
  hoverClass?: string;
};

function cn(...cls: Array<string | undefined | null | false>) {
  return cls.filter(Boolean).join(" ");
}

/**
 * Minimal, flexible button:
 * - brings pointer cursor, focus ring, transitions
 * - no background by default (pass your own bg/text/border classes)
 * - variants: "standard" (rounded-lg) | "pill" (rounded-full)
 * - custom hover via `hoverClass`
 */
export default function Button({
  variant = "standard",
  hoverClass = "hover:opacity-90",
  className,
  children,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center select-none gap-2 px-3 py-2 text-sm font-medium " +
    "transition-colors duration-150 cursor-pointer " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20";
  const shape = variant === "pill" ? "rounded-full" : "rounded-lg";

  return (
    <button className={cn(base, shape, hoverClass, className)} {...rest}>
      {children}
    </button>
  );
}
