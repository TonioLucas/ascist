"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Objetivo,
  ObjetivoId,
  OBJETIVO_LABELS,
  FAROL_COLORS,
  PLANNER_CONSTRAINTS,
} from "@/types/planner";
import { t } from "@/lib/i18n";

interface ObjetivoFormProps {
  objetivo: Objetivo;
  onChange: (objetivo: Objetivo) => void;
}

export function ObjetivoForm({ objetivo, onChange }: ObjetivoFormProps) {
  const [newTarefa, setNewTarefa] = useState("");

  const handleTituloChange = (titulo: string) => {
    onChange({ ...objetivo, titulo });
  };

  const handleDescricaoChange = (descricao: string) => {
    onChange({ ...objetivo, descricao });
  };

  const handlePrazoChange = (prazoISO: string) => {
    onChange({ ...objetivo, prazoISO });
  };

  const handleAddTarefa = () => {
    const trimmed = newTarefa.trim();
    if (
      trimmed &&
      objetivo.tarefas.length < PLANNER_CONSTRAINTS.MAX_TAREFAS_PER_OBJETIVO
    ) {
      onChange({ ...objetivo, tarefas: [...objetivo.tarefas, trimmed] });
      setNewTarefa("");
    }
  };

  const handleRemoveTarefa = (index: number) => {
    const newTarefas = objetivo.tarefas.filter((_, i) => i !== index);
    onChange({ ...objetivo, tarefas: newTarefas });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTarefa();
    }
  };

  const farol1Color = FAROL_COLORS.farol1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge className={`${farol1Color.bg} ${farol1Color.text}`}>
            {t("planner.farol1")}
          </Badge>
          {OBJETIVO_LABELS[objetivo.id]}
        </CardTitle>
        <CardDescription>
          {t("planner.objetivo.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`titulo-${objetivo.id}`}>
            {t("planner.objetivo.titulo")}
          </Label>
          <Input
            id={`titulo-${objetivo.id}`}
            value={objetivo.titulo}
            onChange={(e) => handleTituloChange(e.target.value)}
            placeholder={t("planner.objetivo.titulo.placeholder")}
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`descricao-${objetivo.id}`}>
            {t("planner.objetivo.descricao")}
          </Label>
          <Textarea
            id={`descricao-${objetivo.id}`}
            value={objetivo.descricao || ""}
            onChange={(e) => handleDescricaoChange(e.target.value)}
            placeholder={t("planner.objetivo.descricao.placeholder")}
            maxLength={500}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`prazo-${objetivo.id}`}>
            {t("planner.objetivo.prazo")}
          </Label>
          <Input
            id={`prazo-${objetivo.id}`}
            type="date"
            value={objetivo.prazoISO}
            onChange={(e) => handlePrazoChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>
            {t("planner.objetivo.tarefas")} ({objetivo.tarefas.length}/
            {PLANNER_CONSTRAINTS.MAX_TAREFAS_PER_OBJETIVO})
          </Label>
          <div className="flex gap-2">
            <Input
              value={newTarefa}
              onChange={(e) => setNewTarefa(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("planner.objetivo.tarefas.placeholder")}
              maxLength={200}
              disabled={
                objetivo.tarefas.length >=
                PLANNER_CONSTRAINTS.MAX_TAREFAS_PER_OBJETIVO
              }
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddTarefa}
              disabled={
                !newTarefa.trim() ||
                objetivo.tarefas.length >=
                  PLANNER_CONSTRAINTS.MAX_TAREFAS_PER_OBJETIVO
              }
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {objetivo.tarefas.length > 0 && (
            <ul className="space-y-2 mt-2">
              {objetivo.tarefas.map((tarefa, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-2 rounded-md border p-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`${farol1Color.bg} ${farol1Color.text} border-0`}
                    >
                      F1
                    </Badge>
                    <span className="text-sm">{tarefa}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTarefa(index)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
