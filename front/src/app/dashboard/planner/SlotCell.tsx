"use client";

import { FAROL_COLORS } from "@/types/planner";
import type { SlotEntry } from "@/types/weeklyPlan";

interface SlotCellProps {
  entry?: SlotEntry;
  isToday: boolean;
  onClick: () => void;
}

export function SlotCell({ entry, isToday, onClick }: SlotCellProps) {
  const baseClasses =
    "min-h-[48px] border-r last:border-r-0 cursor-pointer transition-colors hover:bg-muted/50";
  const todayClasses = isToday ? "bg-primary/5" : "";

  if (!entry) {
    return (
      <div
        className={`${baseClasses} ${todayClasses}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
      />
    );
  }

  const color = FAROL_COLORS[entry.tipo];

  return (
    <div
      className={`${baseClasses} ${color.bg} ${color.text} p-1`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className="text-xs font-medium truncate">{entry.label}</div>
    </div>
  );
}
