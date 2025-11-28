import { z } from "zod";
import { PLANNER_CONSTRAINTS } from "./planner";

/**
 * Validate date is in the future
 */
const futureDateSchema = z.string().refine(
  (val) => {
    const date = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  },
  { message: "A data deve ser no futuro" }
);

/**
 * Farol type enum
 */
const farolTypeSchema = z.enum([
  "farol1",
  "farol2",
  "farol3",
  "tempo-coringa",
  "desvio-de-rota",
]);

/**
 * Objetivo ID enum
 */
const objetivoIdSchema = z.enum([
  "financeiro",
  "saude",
  "relacionamentos",
]);

/**
 * Single objetivo schema
 */
const objetivoSchema = z.object({
  id: objetivoIdSchema,
  titulo: z
    .string()
    .min(1, "Título é obrigatório")
    .max(100, "Título deve ter no máximo 100 caracteres")
    .transform((val) => val.trim()),
  descricao: z
    .string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional()
    .transform((val) => val?.trim()),
  prazoISO: futureDateSchema,
  tarefas: z
    .array(
      z
        .string()
        .min(1, "Tarefa não pode estar vazia")
        .max(200, "Tarefa deve ter no máximo 200 caracteres")
        .transform((val) => val.trim())
    )
    .max(
      PLANNER_CONSTRAINTS.MAX_TAREFAS_PER_OBJETIVO,
      `Máximo de ${PLANNER_CONSTRAINTS.MAX_TAREFAS_PER_OBJETIVO} tarefas por objetivo`
    ),
});

/**
 * Farol entry schema (for farol2, farol3, tempoCoringa, desvioDeRota)
 */
const farolEntrySchema = z.object({
  id: z.string().min(1),
  tipo: farolTypeSchema,
  label: z
    .string()
    .min(1, "Label é obrigatório")
    .max(100, "Label deve ter no máximo 100 caracteres")
    .transform((val) => val.trim()),
  descricao: z
    .string()
    .max(300, "Descrição deve ter no máximo 300 caracteres")
    .optional()
    .transform((val) => val?.trim()),
});

/**
 * Full planner config request schema
 */
export const plannerConfigRequestSchema = z.object({
  objetivos: z.object({
    financeiro: objetivoSchema,
    saude: objetivoSchema,
    relacionamentos: objetivoSchema,
  }),
  farol2: z.array(farolEntrySchema),
  farol3: z
    .array(farolEntrySchema)
    .max(
      PLANNER_CONSTRAINTS.MAX_FAROL3_HABITS,
      `Máximo de ${PLANNER_CONSTRAINTS.MAX_FAROL3_HABITS} hábitos no Farol 3`
    ),
  tempoCoringa: z.array(farolEntrySchema),
  desvioDeRota: z.array(farolEntrySchema),
});

export type PlannerConfigRequestValidated = z.infer<
  typeof plannerConfigRequestSchema
>;

/**
 * Validate a single objetivo
 */
export const singleObjetivoSchema = objetivoSchema;

/**
 * Validate a single farol entry
 */
export const singleFarolEntrySchema = farolEntrySchema;
