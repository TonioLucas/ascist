"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FarolEntry,
  FarolType,
  FAROL_COLORS,
  PLANNER_CONSTRAINTS,
} from "@/types/planner";
import { t } from "@/lib/i18n";

interface FarolListProps {
  tipo: Exclude<FarolType, "farol1">;
  entries: FarolEntry[];
  onChange: (entries: FarolEntry[]) => void;
  maxEntries?: number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const FAROL_CONFIG: Record<
  Exclude<FarolType, "farol1">,
  { titleKey: string; descKey: string; placeholderKey: string; badge: string }
> = {
  farol2: {
    titleKey: "planner.farol2.title",
    descKey: "planner.farol2.description",
    placeholderKey: "planner.farol2.placeholder",
    badge: "F2",
  },
  farol3: {
    titleKey: "planner.farol3.title",
    descKey: "planner.farol3.description",
    placeholderKey: "planner.farol3.placeholder",
    badge: "F3",
  },
  "tempo-coringa": {
    titleKey: "planner.tempoCoringa.title",
    descKey: "planner.tempoCoringa.description",
    placeholderKey: "planner.tempoCoringa.placeholder",
    badge: "TC",
  },
  "desvio-de-rota": {
    titleKey: "planner.desvioDeRota.title",
    descKey: "planner.desvioDeRota.description",
    placeholderKey: "planner.desvioDeRota.placeholder",
    badge: "DR",
  },
};

export function FarolList({
  tipo,
  entries,
  onChange,
  maxEntries,
}: FarolListProps) {
  const [newLabel, setNewLabel] = useState("");

  const config = FAROL_CONFIG[tipo];
  const color = FAROL_COLORS[tipo];
  const effectiveMax =
    tipo === "farol3" ? PLANNER_CONSTRAINTS.MAX_FAROL3_HABITS : maxEntries;

  const handleAdd = () => {
    const trimmed = newLabel.trim();
    if (trimmed && (!effectiveMax || entries.length < effectiveMax)) {
      const newEntry: FarolEntry = {
        id: generateId(),
        tipo,
        label: trimmed,
      };
      onChange([...entries, newEntry]);
      setNewLabel("");
    }
  };

  const handleRemove = (id: string) => {
    onChange(entries.filter((e) => e.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const isAtMax = effectiveMax ? entries.length >= effectiveMax : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge className={`${color.bg} ${color.text}`}>
            {config.badge}
          </Badge>
          {t(config.titleKey)}
        </CardTitle>
        <CardDescription>{t(config.descKey)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>
            {t("planner.items")}
            {effectiveMax && ` (${entries.length}/${effectiveMax})`}
          </Label>
          <div className="flex gap-2">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(config.placeholderKey)}
              maxLength={100}
              disabled={isAtMax}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAdd}
              disabled={!newLabel.trim() || isAtMax}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {entries.length > 0 && (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-2 rounded-md border p-2"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`${color.bg} ${color.text} border-0`}
                  >
                    {config.badge}
                  </Badge>
                  <span className="text-sm">{entry.label}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(entry.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
