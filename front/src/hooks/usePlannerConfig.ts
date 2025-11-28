"use client";

import { useState, useEffect, useCallback } from "react";
import { onSnapshot } from "firebase/firestore";
import { useAuth } from "@/auth/useAuth";
import { getPlannerConfigRef, plannerConfigOperations } from "@/lib/firestore";
import {
  PlannerConfigDoc,
  PlannerConfigRequest,
  createEmptyPlannerConfig,
} from "@/types/planner";
import { plannerConfigRequestSchema } from "@/types/plannerSchema";

type Status = "loading" | "error" | "success";

interface UsePlannerConfigReturn {
  config: PlannerConfigRequest;
  status: Status;
  error: string | null;
  saveConfig: (data: PlannerConfigRequest) => Promise<{ success: boolean; error?: string }>;
  isSaving: boolean;
}

export function usePlannerConfig(): UsePlannerConfigReturn {
  const { user } = useAuth();
  const [config, setConfig] = useState<PlannerConfigRequest>(createEmptyPlannerConfig());
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setConfig(createEmptyPlannerConfig());
      setStatus("error");
      setError("Usuário não autenticado");
      return;
    }

    const configRef = getPlannerConfigRef(user.uid);

    // Check if ref is valid
    if (!configRef || Object.keys(configRef).length === 0) {
      setStatus("error");
      setError("Firebase não inicializado");
      return;
    }

    setStatus("loading");
    setError(null);

    const unsubscribe = onSnapshot(
      configRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as PlannerConfigDoc;
          // Extract only the request fields (without updatedAt)
          setConfig({
            objetivos: data.objetivos,
            farol2: data.farol2,
            farol3: data.farol3,
            tempoCoringa: data.tempoCoringa,
            desvioDeRota: data.desvioDeRota,
          });
        } else {
          // No config exists, use empty
          setConfig(createEmptyPlannerConfig());
        }
        setStatus("success");
      },
      (err) => {
        console.error("Error fetching planner config:", err);
        setError("Erro ao carregar configuração do planner");
        setStatus("error");
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const saveConfig = useCallback(
    async (data: PlannerConfigRequest): Promise<{ success: boolean; error?: string }> => {
      if (!user?.uid) {
        return { success: false, error: "Usuário não autenticado" };
      }

      // Validate with Zod
      const validation = plannerConfigRequestSchema.safeParse(data);
      if (!validation.success) {
        const firstIssue = validation.error.issues[0];
        return { success: false, error: firstIssue.message };
      }

      setIsSaving(true);
      try {
        await plannerConfigOperations.upsert(user.uid, validation.data);
        return { success: true };
      } catch (err) {
        console.error("Error saving planner config:", err);
        return { success: false, error: "Erro ao salvar configuração" };
      } finally {
        setIsSaving(false);
      }
    },
    [user?.uid]
  );

  return {
    config,
    status,
    error,
    saveConfig,
    isSaving,
  };
}
