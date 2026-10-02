import { clsx } from "clsx";
import { ReactNode } from "react";

export function GlassCard({
  children,
  className,
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: any;
  [key: string]: any;
}) {
  return (
    <Tag className={clsx("glass glass-hover p-5 transition-shadow", className)} {...rest}>
      {children}
    </Tag>
  );
}