"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlannerConfig } from "@/hooks/usePlannerConfig";
import { ObjetivoForm } from "./ObjetivoForm";
import { FarolList } from "./FarolList";
import { ColorLegend } from "./ColorLegend";
import {
  Objetivo,
  ObjetivoId,
  PlannerConfigRequest,
  OBJETIVO_LABELS,
} from "@/types/planner";
import { t } from "@/lib/i18n";
import { toast } from "sonner";

export function PlannerConfig() {
  const { config, status, error, saveConfig, isSaving } = usePlannerConfig();
  const [localConfig, setLocalConfig] = useState<PlannerConfigRequest>(config);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state when remote config loads
  useEffect(() => {
    if (status === "success") {
      setLocalConfig(config);
      setHasChanges(false);
    }
  }, [config, status]);

  const handleObjetivoChange = (id: ObjetivoId, objetivo: Objetivo) => {
    setLocalConfig((prev) => ({
      ...prev,
      objetivos: {
        ...prev.objetivos,
        [id]: objetivo,
      },
    }));
    setHasChanges(true);
  };

  const handleFarol2Change = (entries: PlannerConfigRequest["farol2"]) => {
    setLocalConfig((prev) => ({ ...prev, farol2: entries }));
    setHasChanges(true);
  };

  const handleFarol3Change = (entries: PlannerConfigRequest["farol3"]) => {
    setLocalConfig((prev) => ({ ...prev, farol3: entries }));
    setHasChanges(true);
  };

  const handleTempoCoringaChange = (
    entries: PlannerConfigRequest["tempoCoringa"]
  ) => {
    setLocalConfig((prev) => ({ ...prev, tempoCoringa: entries }));
    setHasChanges(true);
  };

  const handleDesvioDeRotaChange = (
    entries: PlannerConfigRequest["desvioDeRota"]
  ) => {
    setLocalConfig((prev) => ({ ...prev, desvioDeRota: entries }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const result = await saveConfig(localConfig);
    if (result.success) {
      toast.success(t("planner.save.success"));
      setHasChanges(false);
    } else {
      toast.error(result.error || t("planner.save.error"));
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "error" && error) {
    return (
      <div className="rounded-md border border-destructive p-4 text-destructive">
        {error}
      </div>
    );
  }

  const objetivoIds: ObjetivoId[] = [
    "financeiro",
    "saude",
    "relacionamentos",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("planner.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("planner.subtitle")}
          </p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t("planner.save")}
        </Button>
      </div>

      <ColorLegend />

      <Tabs defaultValue="objetivos">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="objetivos">
            {t("planner.tabs.objetivos")}
          </TabsTrigger>
          <TabsTrigger value="farois">{t("planner.tabs.farois")}</TabsTrigger>
        </TabsList>

        <TabsContent value="objetivos" className="space-y-4 mt-4">
          {objetivoIds.map((id) => (
            <ObjetivoForm
              key={id}
              objetivo={localConfig.objetivos[id]}
              onChange={(obj) => handleObjetivoChange(id, obj)}
            />
          ))}
        </TabsContent>

        <TabsContent value="farois" className="space-y-4 mt-4">
          <FarolList
            tipo="farol2"
            entries={localConfig.farol2}
            onChange={handleFarol2Change}
          />
          <FarolList
            tipo="farol3"
            entries={localConfig.farol3}
            onChange={handleFarol3Change}
          />
          <FarolList
            tipo="tempo-coringa"
            entries={localConfig.tempoCoringa}
            onChange={handleTempoCoringaChange}
          />
          <FarolList
            tipo="desvio-de-rota"
            entries={localConfig.desvioDeRota}
            onChange={handleDesvioDeRotaChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
