"use client";

import { httpsCallable, HttpsCallableResult } from "firebase/functions";
import { functions } from "./firebase";

// Example function types
export interface ExampleRequest {
  message: string;
}

export interface ExampleResponse {
  result: string;
}

// Callable functions wrapper
export const callableFunctions = {
  // Example callable function
  exampleFunction: async (data: ExampleRequest): Promise<ExampleResponse> => {
    const callable = httpsCallable<ExampleRequest, ExampleResponse>(
      functions,
      "exampleFunction"
    );
    const result = await callable(data);
    return result.data;
  },
};

// Generic callable function helper
export async function callFunction<TRequest, TResponse>(
  functionName: string,
  data: TRequest
): Promise<TResponse> {
  const callable = httpsCallable<TRequest, TResponse>(functions, functionName);
  const result = await callable(data);
  return result.data;
}

// Calendar export types
export interface ExportCalendarRequest {
  weekStartISO: string; // YYYY-MM-DD Monday
  timezone: string; // e.g., "America/Sao_Paulo"
}

export interface ExportCalendarResponse {
  success: boolean;
  weekStartISO: string;
  exportedCount: number;
  overwrittenCount: number;
  calendarEventIds: Record<string, string>; // slotId -> Google eventId
  calendarId: string;
  message?: string;
}

/**
 * Call the export_calendar_callable function
 */
export async function exportCalendar(
  request: ExportCalendarRequest
): Promise<ExportCalendarResponse> {
  const callable = httpsCallable<ExportCalendarRequest, ExportCalendarResponse>(
    functions,
    "export_calendar_callable"
  );
  const result: HttpsCallableResult<ExportCalendarResponse> = await callable(request);
  return result.data;
}