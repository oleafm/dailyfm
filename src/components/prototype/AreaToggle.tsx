"use client";
import { BriefcaseBusiness, Leaf } from "lucide-react";
import { Area } from "@/lib/prototype/types";

export default function AreaToggle({ value, onChange, label }: {
  value: Area;
  onChange: (area: Area) => void;
  label: string;
}) {
  return <div className="area-switch modal-area-switch" role="group" aria-label={label}>
    {(["do", "be"] as const).map((area) => <button
      key={area} type="button" aria-pressed={value === area}
      className={value === area ? "selected" : ""} onClick={() => onChange(area)}
    >
      {area === "do" ? <BriefcaseBusiness size={16} /> : <Leaf size={16} />}
      {area === "do" ? "Do" : "Be"}
      <span>{area === "do" ? "make things happen" : "be here for life"}</span>
    </button>)}
  </div>;
}
