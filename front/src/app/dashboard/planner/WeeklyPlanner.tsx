"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWeeklyPlan } from "@/hooks/useWeeklyPlan";
import { usePlannerConfig } from "@/hooks/usePlannerConfig";
import { useCalendarExport } from "@/hooks/useCalendarExport";
import { SlotCell } from "./SlotCell";
import { SlotAssignmentDialog } from "./SlotAssignmentDialog";
import { Legend } from "./Legend";
import { InsightsPanel } from "./InsightsPanel";
import { NextActions } from "./NextActions";
import {
  DAY_LABELS,
  PLANNER_HOURS,
  DayIndex,
  PlannerHour,
  getSlotId,
  getWeekStartISO,
  getAdjacentWeek,
  formatWeekRange,
  getDateForDay,
  SlotEntry,
} from "@/types/weeklyPlan";
import { t } from "@/lib/i18n";

interface SelectedSlot {
  slotId: string;
  dayIndex: DayIndex;
  hour: PlannerHour;
}

export function WeeklyPlanner() {
  const [weekStartISO, setWeekStartISO] = useState(() => getWeekStartISO());
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [exportMessage, setExportMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { plan, slots, insights, status, saveSlot, saveInsights, isSaving } =
    useWeeklyPlan(weekStartISO);
  const { config, status: configStatus } = usePlannerConfig();
  const { exportWeek, isExporting, error: exportError } = useCalendarExport();

  const handlePrevWeek = () => {
    setWeekStartISO(getAdjacentWeek(weekStartISO, "prev"));
  };

  const handleNextWeek = () => {
    setWeekStartISO(getAdjacentWeek(weekStartISO, "next"));
  };

  const handleSlotClick = (dayIndex: DayIndex, hour: PlannerHour) => {
    const slotId = getSlotId(weekStartISO, dayIndex, hour);
    setSelectedSlot({ slotId, dayIndex, hour });
  };

  const handleSlotSave = async (entry: SlotEntry | null) => {
    if (!selectedSlot) return;
    await saveSlot(selectedSlot.slotId, entry);
    setSelectedSlot(null);
  };

  const handleSlotClose = () => {
    setSelectedSlot(null);
  };

  const handleExportCalendar = async () => {
    // Check if there are any slots to export
    const slotCount = Object.keys(slots).length;
    if (slotCount === 0) {
      setExportMessage({ type: "error", text: t("calendar.export.noSlots") });
      setTimeout(() => setExportMessage(null), 5000);
      return;
    }

    const result = await exportWeek(weekStartISO);
    if (result) {
      const message = result.overwrittenCount > 0
        ? t("calendar.export.successOverwrite", {
            count: String(result.exportedCount),
            overwritten: String(result.overwrittenCount),
          })
        : t("calendar.export.success", { count: String(result.exportedCount) });
      setExportMessage({ type: "success", text: message });
    } else if (exportError) {
      setExportMessage({ type: "error", text: exportError });
    }
    setTimeout(() => setExportMessage(null), 5000);
  };

  const isCurrentWeek = weekStartISO === getWeekStartISO();
  const today = new Date();
  const todayDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // Convert to Mon=0

  // Get today's date in current week view
  const isToday = (dayIndex: DayIndex) => {
    if (!isCurrentWeek) return false;
    return dayIndex === todayDayIndex;
  };

  const dayIndices: DayIndex[] = [0, 1, 2, 3, 4, 5, 6];

  if (status === "loading" || configStatus === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("weeklyPlanner.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {formatWeekRange(weekStartISO)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {!isCurrentWeek && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekStartISO(getWeekStartISO())}
            >
              {t("weeklyPlanner.today")}
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExportCalendar}
            disabled={isExporting}
            className="ml-2"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="mr-2 h-4 w-4" />
            )}
            {isExporting ? t("calendar.export.loading") : t("calendar.export")}
          </Button>
        </div>
      </div>

      {/* Export message */}
      {exportMessage && (
        <div
          className={`rounded-lg p-3 text-sm ${
            exportMessage.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {exportMessage.text}
        </div>
      )}

      {/* Next actions for today */}
      {isCurrentWeek && (
        <NextActions
          slots={slots}
          weekStartISO={weekStartISO}
          todayDayIndex={todayDayIndex as DayIndex}
        />
      )}

      {/* Legend */}
      <Legend />

      {/* Weekly grid */}
      <div className="rounded-lg border bg-card">
        <ScrollArea className="h-[600px]">
          <div className="min-w-[800px]">
            {/* Header row with days */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 bg-card z-10 border-b">
              <div className="p-2 text-center text-xs font-medium text-muted-foreground border-r">
                {t("weeklyPlanner.hour")}
              </div>
              {dayIndices.map((dayIndex) => {
                const date = getDateForDay(weekStartISO, dayIndex);
                const dayNum = date.getDate();
                return (
                  <div
                    key={dayIndex}
                    className={`p-2 text-center border-r last:border-r-0 ${
                      isToday(dayIndex)
                        ? "bg-primary/10 font-bold"
                        : ""
                    }`}
                  >
                    <div className="text-xs font-medium">
                      {DAY_LABELS[dayIndex]}
                    </div>
                    <div className="text-lg">{dayNum}</div>
                  </div>
                );
              })}
            </div>

            {/* Hour rows */}
            {PLANNER_HOURS.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-[60px_repeat(7,1fr)] border-b last:border-b-0"
              >
                <div className="p-2 text-center text-xs font-medium text-muted-foreground border-r flex items-center justify-center">
                  {hour.toString().padStart(2, "0")}:00
                </div>
                {dayIndices.map((dayIndex) => {
                  const slotId = getSlotId(weekStartISO, dayIndex, hour);
                  const entry = slots[slotId];
                  return (
                    <SlotCell
                      key={slotId}
                      entry={entry}
                      isToday={isToday(dayIndex)}
                      onClick={() => handleSlotClick(dayIndex, hour)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Insights panel */}
      <InsightsPanel
        insights={insights}
        onSave={saveInsights}
        isSaving={isSaving}
      />

      {/* Slot assignment dialog */}
      {selectedSlot && (
        <SlotAssignmentDialog
          open={!!selectedSlot}
          onOpenChange={(open) => !open && handleSlotClose()}
          dayIndex={selectedSlot.dayIndex}
          hour={selectedSlot.hour}
          currentEntry={slots[selectedSlot.slotId]}
          config={config}
          onSave={handleSlotSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
