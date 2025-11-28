"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FAROL_COLORS,
  OBJETIVO_LABELS,
  PlannerConfigRequest,
  ObjetivoId,
  FarolType,
} from "@/types/planner";
import { DAY_FULL_NAMES, DayIndex, PlannerHour, SlotEntry } from "@/types/weeklyPlan";
import { t } from "@/lib/i18n";

interface SlotAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayIndex: DayIndex;
  hour: PlannerHour;
  currentEntry?: SlotEntry;
  config: PlannerConfigRequest;
  onSave: (entry: SlotEntry | null) => Promise<void>;
  isSaving: boolean;
}

interface SelectableEntry {
  id: string;
  label: string;
  tipo: FarolType;
  objetivoId?: ObjetivoId;
}

export function SlotAssignmentDialog({
  open,
  onOpenChange,
  dayIndex,
  hour,
  currentEntry,
  config,
  onSave,
  isSaving,
}: SlotAssignmentDialogProps) {
  const [selectedEntry, setSelectedEntry] = useState<SelectableEntry | null>(
    currentEntry
      ? {
          id: currentEntry.sourceId,
          label: currentEntry.label,
          tipo: currentEntry.tipo,
          objetivoId: currentEntry.objetivoId as ObjetivoId | undefined,
        }
      : null
  );

  // Build list of all selectable entries
  const buildSelectableEntries = (): {
    farol1: SelectableEntry[];
    farol2: SelectableEntry[];
    farol3: SelectableEntry[];
    tempoCoringa: SelectableEntry[];
    desvioDeRota: SelectableEntry[];
  } => {
    const farol1: SelectableEntry[] = [];

    // Add tarefas from each objetivo as Farol 1
    const objetivoIds: ObjetivoId[] = ["financeiro", "saude", "relacionamentos"];
    objetivoIds.forEach((objId) => {
      const objetivo = config.objetivos[objId];
      objetivo.tarefas.forEach((tarefa, idx) => {
        farol1.push({
          id: `${objId}-tarefa-${idx}`,
          label: tarefa,
          tipo: "farol1",
          objetivoId: objId,
        });
      });
    });

    const farol2: SelectableEntry[] = config.farol2.map((e) => ({
      id: e.id,
      label: e.label,
      tipo: "farol2",
    }));

    const farol3: SelectableEntry[] = config.farol3.map((e) => ({
      id: e.id,
      label: e.label,
      tipo: "farol3",
    }));

    const tempoCoringa: SelectableEntry[] = config.tempoCoringa.map((e) => ({
      id: e.id,
      label: e.label,
      tipo: "tempo-coringa",
    }));

    const desvioDeRota: SelectableEntry[] = config.desvioDeRota.map((e) => ({
      id: e.id,
      label: e.label,
      tipo: "desvio-de-rota",
    }));

    return { farol1, farol2, farol3, tempoCoringa, desvioDeRota };
  };

  const entries = buildSelectableEntries();

  const handleSave = async () => {
    if (selectedEntry) {
      await onSave({
        sourceId: selectedEntry.id,
        label: selectedEntry.label,
        tipo: selectedEntry.tipo,
        objetivoId: selectedEntry.objetivoId,
      });
    }
  };

  const handleClear = async () => {
    await onSave(null);
  };

  const handleEntryClick = (entry: SelectableEntry) => {
    setSelectedEntry(entry);
  };

  const isSelected = (entry: SelectableEntry) =>
    selectedEntry?.id === entry.id && selectedEntry?.tipo === entry.tipo;

  const renderEntryButton = (entry: SelectableEntry) => {
    const color = FAROL_COLORS[entry.tipo];
    const selected = isSelected(entry);

    return (
      <button
        key={`${entry.tipo}-${entry.id}`}
        type="button"
        className={`w-full text-left p-2 rounded-md border transition-all ${
          selected
            ? "ring-2 ring-primary ring-offset-2"
            : "hover:bg-muted/50"
        }`}
        onClick={() => handleEntryClick(entry)}
      >
        <div className="flex items-center gap-2">
          <Badge className={`${color.bg} ${color.text} shrink-0`}>
            {entry.tipo === "farol1"
              ? "F1"
              : entry.tipo === "farol2"
              ? "F2"
              : entry.tipo === "farol3"
              ? "F3"
              : entry.tipo === "tempo-coringa"
              ? "TC"
              : "DR"}
          </Badge>
          <span className="text-sm truncate">{entry.label}</span>
          {entry.objetivoId && (
            <span className="text-xs text-muted-foreground ml-auto">
              {OBJETIVO_LABELS[entry.objetivoId]}
            </span>
          )}
        </div>
      </button>
    );
  };

  const renderSection = (
    title: string,
    items: SelectableEntry[],
    emptyMessage: string
  ) => {
    if (items.length === 0) {
      return (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground italic">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <div className="space-y-1">{items.map(renderEntryButton)}</div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("weeklyPlanner.assignSlot")}</DialogTitle>
          <DialogDescription>
            {DAY_FULL_NAMES[dayIndex]}, {hour.toString().padStart(2, "0")}:00 -{" "}
            {(hour + 1).toString().padStart(2, "0")}:00
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {renderSection(
              t("weeklyPlanner.farol1.section"),
              entries.farol1,
              t("weeklyPlanner.farol1.empty")
            )}
            <Separator />
            {renderSection(
              t("weeklyPlanner.farol2.section"),
              entries.farol2,
              t("weeklyPlanner.farol2.empty")
            )}
            <Separator />
            {renderSection(
              t("weeklyPlanner.farol3.section"),
              entries.farol3,
              t("weeklyPlanner.farol3.empty")
            )}
            <Separator />
            {renderSection(
              t("weeklyPlanner.tempoCoringa.section"),
              entries.tempoCoringa,
              t("weeklyPlanner.tempoCoringa.empty")
            )}
            <Separator />
            {renderSection(
              t("weeklyPlanner.desvioDeRota.section"),
              entries.desvioDeRota,
              t("weeklyPlanner.desvioDeRota.empty")
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {currentEntry && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleClear}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("weeklyPlanner.clearSlot")}
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!selectedEntry || isSaving}
            >
              {t("common.save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
