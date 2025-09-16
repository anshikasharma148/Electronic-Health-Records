"use client";
import { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export default function Dialog({ open, onClose, title, children, footer, className }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-xl bg-white p-4 shadow-lg ${className ?? ""}`}>
        {!!title && <div className="text-base font-semibold mb-2">{title}</div>}
        <div className="mb-3">{children}</div>
        {!!footer && <div className="pt-2 border-t">{footer}</div>}
      </div>
    </div>
  );
}
