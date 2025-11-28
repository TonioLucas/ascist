"use client";

import { useState, useEffect, useCallback } from "react";
import { onSnapshot } from "firebase/firestore";
import { useAuth } from "@/auth/useAuth";
import { getWeeklyPlanRef, weeklyPlanOperations } from "@/lib/firestore";
import {
  WeeklyPlanDoc,
  SlotEntry,
  createEmptyWeeklyPlan,
} from "@/types/weeklyPlan";

type Status = "loading" | "error" | "success";

interface UseWeeklyPlanReturn {
  plan: WeeklyPlanDoc | null;
  slots: Record<string, SlotEntry>;
  insights: string;
  status: Status;
  error: string | null;
  saveSlot: (slotId: string, entry: SlotEntry | null) => Promise<{ success: boolean; error?: string }>;
  saveInsights: (text: string) => Promise<{ success: boolean; error?: string }>;
  isSaving: boolean;
}

export function useWeeklyPlan(weekStartISO: string): UseWeeklyPlanReturn {
  const { user } = useAuth();
  const [plan, setPlan] = useState<WeeklyPlanDoc | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setPlan(null);
      setStatus("error");
      setError("Usuário não autenticado");
      return;
    }

    if (!weekStartISO) {
      setPlan(null);
      setStatus("error");
      setError("Semana não especificada");
      return;
    }

    const planRef = getWeeklyPlanRef(user.uid, weekStartISO);

    // Check if ref is valid
    if (!planRef || Object.keys(planRef).length === 0) {
      setStatus("error");
      setError("Firebase não inicializado");
      return;
    }

    setStatus("loading");
    setError(null);

    const unsubscribe = onSnapshot(
      planRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setPlan(snapshot.data() as WeeklyPlanDoc);
        } else {
          // No plan exists yet for this week
          setPlan(null);
        }
        setStatus("success");
      },
      (err) => {
        console.error("Error fetching weekly plan:", err);
        setError("Erro ao carregar plano semanal");
        setStatus("error");
      }
    );

    return () => unsubscribe();
  }, [user?.uid, weekStartISO]);

  const saveSlot = useCallback(
    async (slotId: string, entry: SlotEntry | null): Promise<{ success: boolean; error?: string }> => {
      if (!user?.uid) {
        return { success: false, error: "Usuário não autenticado" };
      }

      setIsSaving(true);
      try {
        await weeklyPlanOperations.updateSlot(user.uid, weekStartISO, slotId, entry);
        return { success: true };
      } catch (err) {
        console.error("Error saving slot:", err);
        return { success: false, error: "Erro ao salvar slot" };
      } finally {
        setIsSaving(false);
      }
    },
    [user?.uid, weekStartISO]
  );

  const saveInsights = useCallback(
    async (text: string): Promise<{ success: boolean; error?: string }> => {
      if (!user?.uid) {
        return { success: false, error: "Usuário não autenticado" };
      }

      setIsSaving(true);
      try {
        await weeklyPlanOperations.updateInsights(user.uid, weekStartISO, text);
        return { success: true };
      } catch (err) {
        console.error("Error saving insights:", err);
        return { success: false, error: "Erro ao salvar insights" };
      } finally {
        setIsSaving(false);
      }
    },
    [user?.uid, weekStartISO]
  );

  return {
    plan,
    slots: plan?.slots ?? {},
    insights: plan?.insights ?? "",
    status,
    error,
    saveSlot,
    saveInsights,
    isSaving,
  };
}
