import { Timestamp } from "firebase/firestore";
import type { FarolType } from "./planner";

/**
 * Day index for the week (0 = Monday, 6 = Sunday)
 */
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Hour range for planner (6:00 to 23:00)
 */
export type PlannerHour = 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23;

/**
 * Entry assigned to a slot
 */
export interface SlotEntry {
  sourceId: string; // objetivo tarefa index or farol entry id
  label: string;
  tipo: FarolType;
  objetivoId?: string; // for farol1, which objetivo it belongs to
}

/**
 * Weekly slot representing a 1-hour block
 */
export interface WeeklySlot {
  id: string; // `${weekISO}-${dayIndex}-${hour}`
  dayIndex: DayIndex;
  hour: PlannerHour;
  entry?: SlotEntry;
}

/**
 * WeeklyPlanDoc - Document stored at users/{uid}/weeklyPlans/{weekStartISO}
 */
export interface WeeklyPlanDoc {
  weekStartISO: string; // YYYY-MM-DD, Monday
  slots: Record<string, SlotEntry>; // slotId -> entry
  insights: string;
  updatedAt: Timestamp;
}

/**
 * Request type for upserting weekly plan (without Timestamp)
 */
export interface WeeklyPlanRequest {
  weekStartISO: string;
  slots: Record<string, SlotEntry>;
  insights: string;
}

/**
 * Day labels in Portuguese (Monday first)
 */
export const DAY_LABELS: Record<DayIndex, string> = {
  0: "SEG",
  1: "TER",
  2: "QUA",
  3: "QUI",
  4: "SEX",
  5: "SÁB",
  6: "DOM",
};

/**
 * Full day names in Portuguese
 */
export const DAY_FULL_NAMES: Record<DayIndex, string> = {
  0: "Segunda-feira",
  1: "Terça-feira",
  2: "Quarta-feira",
  3: "Quinta-feira",
  4: "Sexta-feira",
  5: "Sábado",
  6: "Domingo",
};

/**
 * Planner hours range
 */
export const PLANNER_HOURS: PlannerHour[] = [
  6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
];

/**
 * Generate slot ID
 */
export function getSlotId(weekISO: string, dayIndex: DayIndex, hour: PlannerHour): string {
  return `${weekISO}-${dayIndex}-${hour}`;
}

/**
 * Parse slot ID to extract components
 */
export function parseSlotId(slotId: string): { weekISO: string; dayIndex: DayIndex; hour: PlannerHour } | null {
  const parts = slotId.split("-");
  if (parts.length < 5) return null; // weekISO has 3 parts (YYYY-MM-DD) + dayIndex + hour

  const weekISO = parts.slice(0, 3).join("-");
  const dayIndex = parseInt(parts[3], 10) as DayIndex;
  const hour = parseInt(parts[4], 10) as PlannerHour;

  return { weekISO, dayIndex, hour };
}

/**
 * Get Monday of the current week
 */
export function getWeekStartISO(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust to Monday (day 0 = Sunday, so we need to go back)
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

/**
 * Get the date for a specific day in a week
 */
export function getDateForDay(weekStartISO: string, dayIndex: DayIndex): Date {
  const d = new Date(weekStartISO);
  d.setDate(d.getDate() + dayIndex);
  return d;
}

/**
 * Navigate to previous/next week
 */
export function getAdjacentWeek(weekStartISO: string, direction: "prev" | "next"): string {
  const d = new Date(weekStartISO);
  d.setDate(d.getDate() + (direction === "next" ? 7 : -7));
  return d.toISOString().split("T")[0];
}

/**
 * Format week range for display
 */
export function formatWeekRange(weekStartISO: string): string {
  const start = new Date(weekStartISO);
  const end = new Date(weekStartISO);
  end.setDate(end.getDate() + 6);

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return `${formatDate(start)} - ${formatDate(end)}`;
}

/**
 * Create empty weekly plan
 */
export function createEmptyWeeklyPlan(weekStartISO: string): WeeklyPlanRequest {
  return {
    weekStartISO,
    slots: {},
    insights: "",
  };
}
