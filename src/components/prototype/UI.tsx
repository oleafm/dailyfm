"use client";
import { useEffect, useRef, useId, ReactNode } from "react";
import { ArrowUpRight, X } from "lucide-react";

const modalStack: HTMLDivElement[] = [];
let modalBodyOverflow = "";

export function Modal({
  title,
  eyebrow,
  children,
  onClose,
  wide = false,
  presentation = "modal",
  className = "",
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  presentation?: "modal" | "drawer";
  className?: string;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    if (!modalStack.length) modalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = ref.current!;
    modalStack.push(panel);
    const focusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, a[href], [tabindex="0"]',
        ),
      ).filter((el) => !el.hasAttribute("disabled") && el.getClientRects().length > 0);
    focusable()[0]?.focus();
    function key(e: KeyboardEvent) {
      if (modalStack[modalStack.length - 1] !== panel) return;
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const list = focusable(),
          first = list[0],
          last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      const index = modalStack.indexOf(panel);
      if (index !== -1) modalStack.splice(index, 1);
      document.body.style.overflow = modalStack.length ? "hidden" : modalBodyOverflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className={`${presentation === "drawer" ? "drawer-backdrop" : "modal-backdrop"} ${className === "session-review-modal" ? "session-review-backdrop" : ""}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={presentation === "drawer" ? "task-drawer" : `modal ${wide ? "modal-wide" : ""} ${className}`}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={presentation === "drawer" ? "drawer-header" : "modal-header"}>
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {presentation === "drawer" ? <div className="drawer-content">{children}</div> : children}
      </div>
    </div>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {action && (
        <button className="text-button" onClick={onAction}>
          {action}
          <ArrowUpRight size={15} />
        </button>
      )}
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty-state">{children}</p>;
}
