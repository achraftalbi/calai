import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
};

export default function CTAButton({ variant = "primary", className = "", ...props }: Props) {
  const base = variant === "primary" ? "btn btn-primary" : "btn btn-outline";
  return <button {...props} className={`${base} ${className}`} />;
}
