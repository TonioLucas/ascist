---
description:
globs:
alwaysApply: false
---

id: "TASK-0002"
title: "Persistir objetivos + Faróis no Firestore"
status: "done"
priority: "P1"
labels: ["frontend", "backend", "firestore"]
dependencies: ["tasks/google-auth-and-localization.md"]
created: "2025-11-28"

# 1) High-Level Objective

Usuário autenticado registra/edita 3 objetivos semestrais (Financeiro, Saúde, Relacionamentos) e respectivas tarefas Farol 1, compromissos Farol 2, hábitos Farol 3, Tempo Coringa e Desvio de Rota, com dados salvos no Firestore.

# 2) Background / Context

PRD define que toda tarefa dentro de um objetivo é Farol 1 (roxo) e que planner precisa enxergar também Farol 2/3 + tempos especiais. Precisamos de schema claro e API para CRUD antes de montar o calendário.

# 3) Assumptions & Constraints

- ASSUMPTION: Cada usuário tem apenas um documento de objetivos vigente (coleção `users/{uid}/plannerConfig/current`).
- Constraint: Usar Firestore client no frontend para leitura/escrita; nenhuma API custom até que regras RLS estejam prontas.
- Constraint: Validar campos obrigatórios em pt-BR e manter limites (máx 3 objetivos, máx 7 hábitos Farol 3).
- Constraint: Reutilizar hooks existentes (`front/src/hooks/useFirestore.ts`).

# 4) Dependencies

- tasks/google-auth-and-localization.md
- files/front/src/hooks/useFirestore.ts
- files/front/src/lib/firestore.ts

# 5) Context Plan

**Beginning:**

- `front/src/hooks/useFirestore.ts`
- `front/src/lib/firestore.ts`
- `front/src/types/firestore.ts`
- `front/src/app/dashboard/page.tsx`
- `front/src/app/(dashboard)/` directories (if created)
- `back/src/apis/Db.py` _(read-only for schema reference)_

**End state:**

- `front/src/types/planner.ts`
- `front/src/hooks/usePlannerConfig.ts`
- `front/src/app/dashboard/objetivos/Form.tsx`
- `front/src/app/dashboard/page.tsx`
- Firestore rules snippet added to `firestore.rules`
- Optional seed script `front/scripts/populatePlanner.ts`

# 6) Low-Level Steps

1. **Define shared types**

   - Create `front/src/types/planner.ts` with discriminated unions:
     ```ts
     export type FarolType = "farol1" | "farol2" | "farol3" | "tempo-coringa" | "desvio-de-rota";
     export interface Objetivo {
       id: "financeiro" | "saude" | "relacionamentos";
       titulo: string;
       descricao?: string;
       prazoISO: string; // YYYY-MM-DD
       tarefas: string[]; // Farol 1 items, always roxos
     }
     export interface FarolEntry { id: string; tipo: FarolType; label: string; descricao?: string; }
     export interface PlannerConfigDoc {
       objetivos: Record<Objetivo["id"], Objetivo>;
       farol2: FarolEntry[];
       farol3: FarolEntry[];
       tempoCoringa: FarolEntry[];
       desvioDeRota: FarolEntry[];
       updatedAt: Timestamp;
     }
     ```

2. **Firestore helper**

   - Extend `front/src/lib/firestore.ts` with `getPlannerConfigRef(uid: string)` returning doc ref under `users/{uid}/plannerConfig/config`.
   - Add functions `fetchPlannerConfig`, `upsertPlannerConfig`.

3. **Custom hook**

   - Implement `front/src/hooks/usePlannerConfig.ts` using `useAuth()` + Firestore helpers.
   - Expose `{config, isLoading, error, saveConfig}`.

4. **Dashboard forms**

   - Under `front/src/app/dashboard`, create `components/ObjetivoForm.tsx`, `FarolList.tsx`.
   - Use ShadCN `Card`, `Textarea`, `Badge`, `Dialog` for editing.
   - Enforce max 3 tarefas per objetivo (Farol 1) at UI level.
   - Provide color legend (roxo, amarelo, verde, azul claro, azul escuro) consistent with PRD.

5. **Data validation**

   - Add Zod schema (e.g., `front/src/types/plannerSchema.ts`) to validate before save.
   - Trim strings, ensure prazo future date, ensure Farol 3 limited to 7.

6. **Sync to Firestore**

   - When user clicks “Salvar plano base”, call `saveConfig`.
   - Optimistic updates with toast feedback.

7. **Firestore security rules**

   - Update root `firestore.rules` to allow read/write on `users/{uid}/plannerConfig/{doc}` only if `request.auth.uid == uid`.
   - Add tests in `back/tests/integration`? (optional) or manual validation.

8. **README update**

   - Document new data model and manual testing steps.

# 7) Types & Interfaces

```ts
// firestoredoc: users/{uid}/plannerConfig/config
export interface PlannerConfigDoc {
  objetivos: Record<Objetivo["id"], Objetivo>;
  farol2: FarolEntry[];
  farol3: FarolEntry[];
  tempoCoringa: FarolEntry[];
  desvioDeRota: FarolEntry[];
  updatedAt: FirebaseTimestamp;
}

export interface PlannerConfigRequest {
  objetivos: PlannerConfigDoc["objetivos"];
  farol2: PlannerConfigDoc["farol2"];
  farol3: PlannerConfigDoc["farol3"];
  tempoCoringa: PlannerConfigDoc["tempoCoringa"];
  desvioDeRota: PlannerConfigDoc["desvioDeRota"];
}

export interface PlannerConfigResponse {
  docPath: string; // users/{uid}/plannerConfig/config
  config: PlannerConfigDoc;
}
```

# 8) Acceptance Criteria

- Usuário consegue salvar objetivos + Faróis pela UI; recarregar a página mostra dados persistidos do Firestore.
- Firestore rules impedem leitura/escrita entre usuários diferentes (tested via emulator or `firebase emulators:exec`).
- Color legend e labels seguem nomenclatura pt-BR (Farol 1 roxo, Farol 2 amarelo, Farol 3 verde, Tempo Coringa azul claro, Desvio de Rota azul escuro).

# 9) Testing Strategy

- Usar Firebase Emulator Suite: rodar `firebase emulators:start --only firestore` e executar `front/src/hooks/usePlannerConfig` via story/test harness.
- Manual: criar objetivos, atualizar navegador, confirmar persistência.
- Optional unit: test helper functions with Vitest to verify data transforms.

# 10) Notes / Links

- Mindmap & Pergaminho referências (ver imagens no thread do usuário).
- PRD: `@.cursor/rules/PRD.mdc`.

