import { FC, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface IProps {
  className?: string;
  children: ReactNode;
}

export const ContentRow: FC<IProps> = ({ children, className = "" }) => {
  return (
    // `gap` rather than `space-x`/`space-y`: space-* puts a margin on every
    // child but the first *in DOM order*, so a row whose columns are reordered
    // for a breakpoint ends up with its gap on the outside. gap follows the
    // visual order. twMerge so a caller can override the gap without losing to
    // the default in the stylesheet cascade.
    <div className={twMerge("flex flex-col lg:flex-row gap-4 lg:gap-6", className)}>
      {children}
    </div>
  );
};
