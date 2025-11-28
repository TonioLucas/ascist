import { Timestamp } from "firebase/firestore";

/**
 * Farol types as defined by Método Ascensão:
 * - farol1: Tasks derived from objectives (roxo/purple)
 * - farol2: External commitments (amarelo/yellow)
 * - farol3: Daily habits (verde/green)
 * - tempo-coringa: Flexible time (azul-claro/light blue)
 * - desvio-de-rota: Intentional breaks (azul-escuro/dark blue)
 */
export type FarolType =
  | "farol1"
  | "farol2"
  | "farol3"
  | "tempo-coringa"
  | "desvio-de-rota";

/**
 * Objective IDs - fixed categories per Método Ascensão
 */
export type ObjetivoId = "financeiro" | "saude" | "relacionamentos";

/**
 * Objetivo - One of three major 6-month goals
 * Each objetivo contains tasks (tarefas) that are automatically Farol 1
 */
export interface Objetivo {
  id: ObjetivoId;
  titulo: string;
  descricao?: string;
  prazoISO: string; // YYYY-MM-DD
  tarefas: string[]; // Farol 1 items, always purple
}

/**
 * Generic Farol entry for types 2-5
 */
export interface FarolEntry {
  id: string;
  tipo: FarolType;
  label: string;
  descricao?: string;
}

/**
 * Color mapping for each Farol type
 */
export const FAROL_COLORS: Record<
  FarolType,
  { bg: string; text: string; label: string }
> = {
  farol1: { bg: "bg-purple-600", text: "text-white", label: "Farol 1 - Roxo" },
  farol2: {
    bg: "bg-yellow-400",
    text: "text-yellow-900",
    label: "Farol 2 - Amarelo",
  },
  farol3: { bg: "bg-green-500", text: "text-white", label: "Farol 3 - Verde" },
  "tempo-coringa": {
    bg: "bg-sky-300",
    text: "text-sky-900",
    label: "Tempo Coringa - Azul Claro",
  },
  "desvio-de-rota": {
    bg: "bg-blue-800",
    text: "text-white",
    label: "Desvio de Rota - Azul Escuro",
  },
};

/**
 * Labels for objetivo categories
 */
export const OBJETIVO_LABELS: Record<ObjetivoId, string> = {
  financeiro: "Financeiro",
  saude: "Saúde",
  relacionamentos: "Relacionamentos",
};

/**
 * PlannerConfigDoc - Document stored at users/{uid}/plannerConfig/config
 */
export interface PlannerConfigDoc {
  objetivos: Record<ObjetivoId, Objetivo>;
  farol2: FarolEntry[];
  farol3: FarolEntry[];
  tempoCoringa: FarolEntry[];
  desvioDeRota: FarolEntry[];
  updatedAt: Timestamp;
}

/**
 * Request type for upserting planner config (without Timestamp)
 */
export interface PlannerConfigRequest {
  objetivos: Record<ObjetivoId, Objetivo>;
  farol2: FarolEntry[];
  farol3: FarolEntry[];
  tempoCoringa: FarolEntry[];
  desvioDeRota: FarolEntry[];
}

/**
 * Default empty planner config
 */
export function createEmptyPlannerConfig(): PlannerConfigRequest {
  const today = new Date();
  const sixMonthsLater = new Date(today);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
  const defaultPrazo = sixMonthsLater.toISOString().split("T")[0];

  return {
    objetivos: {
      financeiro: {
        id: "financeiro",
        titulo: "",
        descricao: "",
        prazoISO: defaultPrazo,
        tarefas: [],
      },
      saude: {
        id: "saude",
        titulo: "",
        descricao: "",
        prazoISO: defaultPrazo,
        tarefas: [],
      },
      relacionamentos: {
        id: "relacionamentos",
        titulo: "",
        descricao: "",
        prazoISO: defaultPrazo,
        tarefas: [],
      },
    },
    farol2: [],
    farol3: [],
    tempoCoringa: [],
    desvioDeRota: [],
  };
}

/**
 * Constraints per the task spec
 */
export const PLANNER_CONSTRAINTS = {
  MAX_OBJETIVOS: 3,
  MAX_TAREFAS_PER_OBJETIVO: 3,
  MAX_FAROL3_HABITS: 7,
} as const;
