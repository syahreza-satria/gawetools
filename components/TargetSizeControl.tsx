"use client";

import { TARGET_CHIPS, type SizeUnit } from "@/lib/targetSize";

interface TargetSizeControlProps {
  value: string;
  unit: SizeUnit;
  onChange: (value: string, unit: SizeUnit) => void;
  disabled?: boolean;
}

/** Number + KB/MB input with quick-pick chips, used by the "Target ukuran" compression mode. */
export default function TargetSizeControl({ value, unit, onChange, disabled }: TargetSizeControlProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          min={1}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value, unit)}
          placeholder="cth: 500"
          aria-label="Ukuran target"
          className="w-full px-3 py-2.5 rounded-xl text-sm bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
        />
        <select
          value={unit}
          disabled={disabled}
          onChange={(e) => onChange(value, e.target.value as SizeUnit)}
          aria-label="Satuan ukuran"
          className="px-3 py-2.5 rounded-xl text-sm bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
        >
          <option value="KB">KB</option>
          <option value="MB">MB</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {TARGET_CHIPS.map((chip) => {
          const active = chip.value === value && chip.unit === unit;
          return (
            <button
              key={chip.label}
              type="button"
              disabled={disabled}
              onClick={() => onChange(chip.value, chip.unit)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? "bg-sky-600 border-sky-600 text-white"
                  : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-sky-400"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
