"use client";

import { Badge } from "@/components/ui/badge";
import { FAROL_COLORS, FarolType } from "@/types/planner";
import { t } from "@/lib/i18n";

const FAROL_ORDER: FarolType[] = [
  "farol1",
  "farol2",
  "farol3",
  "tempo-coringa",
  "desvio-de-rota",
];

export function Legend() {
  return (
    <div className="flex flex-wrap gap-2 rounded-md border bg-muted/50 p-3">
      <span className="text-sm font-medium text-muted-foreground mr-2">
        {t("planner.legend")}:
      </span>
      {FAROL_ORDER.map((tipo) => {
        const color = FAROL_COLORS[tipo];
        return (
          <Badge key={tipo} className={`${color.bg} ${color.text}`}>
            {color.label}
          </Badge>
        );
      })}
    </div>
  );
}
