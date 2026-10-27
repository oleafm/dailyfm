"use client";
import { useId } from "react";
export const moodLabels = ["Very low", "Low", "Okay", "Good", "Great"];
export const energyLabels = ["Empty", "Low", "Half full", "Nearly full", "Full"];
export { ratingIndex } from "@/lib/prototype/journal";
export function MoodIcon({ index }: { index: number }) {
  const mouths = ["M9 19 Q16 11 23 19", "M10 18 Q16 14 22 18", "M10 17 H22", "M9 15 Q16 22 23 15", "M9 14 Q16 25 23 14 Z"];
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="16" cy="16" r="13" /><circle cx="11" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="21" cy="12" r="1" fill="currentColor" stroke="none" /><path d={mouths[index]} /></svg>;
}
export function EnergyIcon({ index }: { index: number }) {
  const id = useId(); const level = [0, .25, .5, .75, 1][index];
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><defs><clipPath id={id}><circle cx="16" cy="16" r="11" /></clipPath></defs><circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.6" /><rect x="5" y={27 - 22 * level} width="22" height={22 * level} fill="currentColor" clipPath={`url(#${id})`} /></svg>;
}
