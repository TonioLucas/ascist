"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/auth/useAuth";
import { exportCalendar, ExportCalendarResponse } from "@/lib/functions";

interface UseCalendarExportReturn {
  exportWeek: (weekStartISO: string) => Promise<ExportCalendarResponse | null>;
  isExporting: boolean;
  lastResult: ExportCalendarResponse | null;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for exporting weekly plans to Google Calendar
 */
export function useCalendarExport(): UseCalendarExportReturn {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [lastResult, setLastResult] = useState<ExportCalendarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportWeek = useCallback(
    async (weekStartISO: string): Promise<ExportCalendarResponse | null> => {
      if (!user?.uid) {
        setError("Usuário não autenticado");
        return null;
      }

      setIsExporting(true);
      setError(null);

      try {
        // Get user's timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const result = await exportCalendar({
          weekStartISO,
          timezone,
        });

        setLastResult(result);

        if (!result.success) {
          setError(result.message || "Erro ao exportar para o Google Calendar");
          return null;
        }

        return result;
      } catch (err: unknown) {
        console.error("Calendar export error:", err);

        // Handle Firebase function errors
        if (err && typeof err === "object" && "code" in err) {
          const firebaseError = err as { code: string; message?: string };
          if (firebaseError.code === "functions/unauthenticated") {
            setError("Permissão do Google Calendar necessária. Reconecte sua conta.");
          } else if (firebaseError.code === "functions/not-found") {
            setError("Nenhum plano encontrado para esta semana.");
          } else {
            setError(firebaseError.message || "Erro ao exportar para o Google Calendar");
          }
        } else {
          setError("Erro ao exportar para o Google Calendar");
        }

        return null;
      } finally {
        setIsExporting(false);
      }
    },
    [user?.uid]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    exportWeek,
    isExporting,
    lastResult,
    error,
    clearError,
  };
}
