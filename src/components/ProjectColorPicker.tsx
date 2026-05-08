'use client';

import { Check } from 'lucide-react';

const PRESET_COLORS = [
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#22c55e', // green
  '#a855f7', // purple
  '#ef4444', // red
  '#ec4899', // pink
];

interface ProjectColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export default function ProjectColorPicker({ value, onChange }: ProjectColorPickerProps) {
  return (
    <div className="flex gap-2">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900"
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        >
          {value === color && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
        </button>
      ))}
    </div>
  );
}
