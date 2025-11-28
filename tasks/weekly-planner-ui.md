---
description:
globs:
alwaysApply: false
---

id: "TASK-0003"
title: "Construir planner semanal com blocos de 1h e Faróis"
status: "done"
priority: "P1"
labels: ["frontend", "calendar", "ui"]
dependencies: ["tasks/google-auth-and-localization.md", "tasks/objetivos-farois-data.md"]
created: "2025-11-28"

# 1) High-Level Objective

Prover uma tela “Pergaminho” onde usuário arrasta/distribui objetivos (Farol 1), compromissos (Farol 2), hábitos (Farol 3), Tempo Coringa e Desvio de Rota em blocos de 1h ao longo da semana, com visão de próximas ações do dia.

# 2) Background / Context

PRD exige calendário semanal semelhante ao papel enviado (colunas Seg→Dom, linhas por hora com paleta Faróis). Cada tarefa do objetivo deve entrar como bloco roxo; outras categorias mantêm cores próprias.

# 3) Assumptions & Constraints

- ASSUMPTION: Planner inicial é próprio (sem sync Google) e opera no navegador/Firestore; drag-and-drop full-feature é futuro (nice-to-have), mas precisamos pelo menos “add-to-slot” UI com clique.
- Constraint: Representar semana atual (segunda-feira start). Permitir navegar para semanas anteriores/seguintes.
- Constraint: Cada slot = 60 minutos; permitir horas 6h→24h (seguindo imagem).
- Constraint: Layout responsivo (desktop-first, mas suportar >=1024 px).
- Constraint: Localização pt-BR (dias “SEG”, “TER”...).

# 4) Dependencies

- tasks/objetivos-farois-data.md (planner config supply)
- files/front/src/hooks/usePlannerConfig.ts

# 5) Context Plan

**Beginning:**

- `front/src/app/dashboard/page.tsx`
- `front/src/app/dashboard/components/*` (if exist)
- `front/src/app/globals.css`
- `front/src/hooks/usePlannerConfig.ts`
- `front/src/types/planner.ts`
- `front/src/components/ui/card.tsx`, `button.tsx`, `dialog.tsx`

**End state:**

- `front/src/app/dashboard/planner/WeeklyPlanner.tsx`
- `front/src/app/dashboard/planner/Legend.tsx`
- `front/src/app/dashboard/planner/NextActions.tsx`
- `front/src/app/dashboard/page.tsx`
- `front/src/hooks/useWeeklyPlan.ts`
- `front/src/types/weeklyPlan.ts`

# 6) Low-Level Steps

1. **Define weekly plan types**

   - `front/src/types/weeklyPlan.ts`:
     ```ts
     export interface WeeklySlot {
       id: string; // `${weekISO}-${dayIndex}-${hour}`
       dayIndex: 0|1|...|6; // 0=Seg
       hour: number; // 6-24
       entry?: {
         sourceId: string; // objetivo/farol entry id
         label: string;
         tipo: FarolType;
       };
     }
     export interface WeeklyPlanDoc {
       weekStartISO: string; // Monday ISO date
       slots: Record<string, WeeklySlot["entry"]>;
       insights: string;
     }
     ```

2. **Firestore storage**

   - Reuse `users/{uid}/weeklyPlans/{weekStartISO}`.
   - Create helper/hook `useWeeklyPlan(weekStartISO)` with `fetchWeeklyPlan`, `updateSlot`, `updateInsights`.

3. **Grid UI**

   - `WeeklyPlanner.tsx`: render CSS grid (7 columns + time column) referencing `SEG`... `DOM`.
   - Use ShadCN `ScrollArea` for vertical scrolling.
   - Each cell clickable -> opens modal to pick source entry (list grouped by Farol).
   - Color-coded backgrounds (#8e6cf0 roxo, #f5b300 amarelo, #31c26d verde, #7ec8ff azul claro, #4263eb azul escuro).

4. **Slot assignment modal**

   - Component `SlotAssignmentDialog` referencing planner config (objetivos + faróis).
   - Allow selecting label + optional Observações.
   - On save, call `updateSlot`.
   - Provide “Limpar slot” action.

5. **Insights + objetivos sidebar**

   - Layout replicates Pergaminho: right column com Objetivo 01/02/03 cards (read-only from config).
   - Bottom `Insights` textarea bound to `weeklyPlan.insights`.

6. **Next actions view**

   - `NextActions.tsx`: calculates tasks scheduled for “today” (current date) sorted by hour; highlight soon ones.
   - Show in dashboard header for quick look.

7. **Navigation controls**

   - Buttons “Semana anterior” / “Próxima semana” adjusting `weekStartISO` via URL query param (?week=2025-11-24).
   - Persist selection.

8. **Validation & accessibility**

   - Ensure keyboard navigation for slots.
   - Provide legend component with text + color badges (Portuguese labels).

9. **Styling**

   - Mirror provided Pergaminho image (font, subtle grid lines). Use CSS custom props for colors.

10. **Manual testing**

   - Add tasks to various slots, reload page, verify persistence.
   - Confirm insights saved.

# 7) Types & Interfaces

- Firestore document stored at `users/{uid}/weeklyPlans/{weekStartISO}`:
  ```ts
  export interface WeeklyPlanDoc {
    weekStartISO: string; // YYYY-MM-DD, Monday
    slots: Record<string, WeeklySlot["entry"]>;
    insights: string;
    updatedAt: FirebaseTimestamp;
  }
  export interface WeeklyPlanRequest {
    weekStartISO: string;
    slots: WeeklyPlanDoc["slots"];
    insights: string;
  }
  export interface WeeklyPlanResponse {
    docPath: string; // users/{uid}/weeklyPlans/{weekStartISO}
    plan: WeeklyPlanDoc;
  }
  ```
- Hook signature:
  ```ts
  export function useWeeklyPlan(weekStartISO: string): {
    plan: WeeklyPlanDoc | null;
    isLoading: boolean;
    saveSlot(slotId: string, entry: WeeklySlot["entry"] | null): Promise<void>;
    saveInsights(text: string): Promise<void>;
  };
  ```

# 8) Acceptance Criteria

- Planner grid mostra 7 dias x blocos de 1h de 6h às 24h com títulos “SEG...DOM”.
- Usuário consegue atribuir Farol 1/2/3/Tempo Coringa/Desvio de Rota a qualquer slot via modal e dados persistem por semana no Firestore.
- Seção “Objetivo n. 01/02/03” e “Insights” exibem/atualizam dados do mesmo documento.
- Seção “Próximas ações de hoje” lista slots futuros do dia atual.

# 9) Testing Strategy

- Manual QA com Firebase Emulator.
- Optional React Testing Library tests for `WeeklyPlanner` interactions (simulate selecting slot and verifying `saveSlot` called).
- Add integration test script hooking into Firestore emulator to assert CRUD.

# 10) Notes / Links

- Design refs: pergaminho imagens fornecidas pelo usuário.
- PRD: `@.cursor/rules/PRD.mdc`.

