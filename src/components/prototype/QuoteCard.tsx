import { Quote } from "lucide-react";
export default function QuoteCard({ weekly = false, compact = false }: { weekly?: boolean; compact?: boolean }) {
  return <blockquote className={`editorial-note${compact ? " quote-compact" : ""}`}>
    <Quote className="quote-mark" size={28} strokeWidth={1.5} aria-hidden="true" />
    <div><span className="eyebrow">A little perspective</span><p>{weekly ? "Patterns are invitations to get curious. They’re never a verdict." : "Progress is easier to see when you leave a little evidence behind."}</p></div>
    <svg className="quote-illustration" viewBox="0 0 160 128" fill="none" aria-hidden="true">
      <path d="M31 18 Q38 18 39 8 Q40 18 49 18 Q40 20 39 29 Q37 20 31 18Z" fill="#c4e500" />
      <circle cx="82" cy="67" r="34" stroke="white" strokeWidth="1.5" />
      <path d="M82 33 A34 34 0 0 0 82 101Z" fill="white" />
      <ellipse cx="82" cy="67" rx="72" ry="18" transform="rotate(-26 82 67)" stroke="white" strokeWidth="2" />
      <circle cx="24" cy="94" r="6" fill="#c4e500" /><circle cx="141" cy="38" r="6" fill="white" />
      <path d="M48 25 Q87 4 118 29 M65 115 Q105 121 126 90" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M141 77 L153 73 M143 87 L156 88 M139 98 L149 105" stroke="#c4e500" strokeWidth="3" strokeLinecap="round" />
      <path d="M119 111 Q125 110 126 103 Q127 110 133 111 Q127 112 126 119 Q125 112 119 111Z" fill="white" />
    </svg>
  </blockquote>;
}
