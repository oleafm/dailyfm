"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export type CelebrationKind = "task" | "session" | "checkin";
const messages: Record<CelebrationKind, string> = {
  task: "One small thing, moved forward.",
  session: "A little further.",
  checkin: "You showed up.",
};

export default function SproutCelebration({ kind, message, onClose }: {
  kind: CelebrationKind;
  message?: string;
  onClose: () => void;
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const timeout = window.setTimeout(() => closeRef.current(), 3200);
    return () => window.clearTimeout(timeout);
  }, []);
  return (
    <div className={`sprout-celebration sprout-celebration--${kind}`} role="status" aria-live="polite">
      <div className="sprout-celebration-art" aria-hidden="true">
        <svg viewBox="0 0 120 100" fill="none">
          <ellipse className="sprout-shadow" cx="60" cy="87" rx="19" ry="3" fill="currentColor" opacity=".1" />
          <g className="sprout-plant" stroke="var(--accent)">
            <path className="sprout-stem" d="M60 85V51" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
            <path className="sprout-leaf sprout-leaf-left" d="M60 65C39 67 30 56 31 42C48 39 62 48 60 65Z" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
            <path className="sprout-leaf sprout-leaf-right" d="M60 55C58 37 70 27 87 29C89 45 78 57 60 55Z" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
          </g>
          <g className="sprout-sparks" fill="var(--accent)" stroke="currentColor" strokeWidth=".5">
            <circle cx="23" cy="33" r="3" /><circle cx="96" cy="54" r="2.5" /><circle cx="66" cy="15" r="2" />
          </g>
        </svg>
      </div>
      <div className="sprout-celebration-copy"><span className="sprout-celebration-label">A LITTLE, EVERY DAY</span><p>{message ?? messages[kind]}</p></div>
      <button className="icon-button" aria-label="Dismiss celebration" onClick={onClose}><X size={15} /></button>
    </div>
  );
}
