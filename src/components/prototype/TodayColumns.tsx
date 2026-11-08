"use client";
import { ReactNode, useEffect, useRef } from "react";

/** Match the default card heights without coupling either column's growth. */
export default function TodayColumns({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const right = element.children[1];
    if (!right) return;
    const measure = () => {
      Array.from(right.children).forEach((card, index) => {
        element.style.setProperty(`--today-card-${index + 1}-height`, `${card.getBoundingClientRect().height}px`);
      });
    };
    const observer = new ResizeObserver(measure);
    Array.from(right.children).forEach(card => observer.observe(card));
    measure();
    return () => observer.disconnect();
  }, []);
  return <div ref={root} className="dashboard-grid today-content-columns">{children}</div>;
}
