"use client";

import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FAROL_COLORS } from "@/types/planner";
import { SlotEntry, DayIndex, PlannerHour, PLANNER_HOURS, getSlotId } from "@/types/weeklyPlan";
import { t } from "@/lib/i18n";

interface NextActionsProps {
  slots: Record<string, SlotEntry>;
  weekStartISO: string;
  todayDayIndex: DayIndex;
}

interface UpcomingSlot {
  hour: PlannerHour;
  entry: SlotEntry;
  isPast: boolean;
  isCurrent: boolean;
}

export function NextActions({ slots, weekStartISO, todayDayIndex }: NextActionsProps) {
  const currentHour = new Date().getHours() as PlannerHour;

  // Get today's slots sorted by hour
  const todaySlots: UpcomingSlot[] = PLANNER_HOURS.filter(
    (hour) => hour >= 6 && hour <= 23
  )
    .map((hour) => {
      const slotId = getSlotId(weekStartISO, todayDayIndex, hour);
      const entry = slots[slotId];
      if (!entry) return null;

      return {
        hour,
        entry,
        isPast: hour < currentHour,
        isCurrent: hour === currentHour,
      };
    })
    .filter((slot): slot is UpcomingSlot => slot !== null);

  // Filter to show upcoming (not past) slots
  const upcomingSlots = todaySlots.filter((slot) => !slot.isPast);

  if (upcomingSlots.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t("weeklyPlanner.nextActions.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("weeklyPlanner.nextActions.empty")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {t("weeklyPlanner.nextActions.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {upcomingSlots.slice(0, 5).map((slot) => {
            const color = FAROL_COLORS[slot.entry.tipo];
            return (
              <div
                key={slot.hour}
                className={`flex items-center gap-2 rounded-md border p-2 ${
                  slot.isCurrent ? "ring-2 ring-primary" : ""
                }`}
              >
                <span className="text-xs font-mono text-muted-foreground">
                  {slot.hour.toString().padStart(2, "0")}:00
                </span>
                <Badge className={`${color.bg} ${color.text}`}>
                  {slot.entry.label}
                </Badge>
              </div>
            );
          })}
          {upcomingSlots.length > 5 && (
            <div className="flex items-center text-xs text-muted-foreground">
              +{upcomingSlots.length - 5} {t("weeklyPlanner.nextActions.more")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
