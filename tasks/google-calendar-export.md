---
description:
globs:
alwaysApply: false
---

id: "TASK-0004"
title: "Exportar planner semanal para Google Calendar"
status: "done"
priority: "P1"
labels: ["backend", "calendar", "integration"]
dependencies: [
  "tasks/google-auth-and-localization.md",
  "tasks/objetivos-farois-data.md",
  "tasks/weekly-planner-ui.md"
]
created: "2025-11-28"

# 1) High-Level Objective

Usuário clica em “Exportar para Google Calendar” e o app cria/atualiza eventos na agenda do próprio usuário para a semana planejada, sobrescrevendo versões anteriores geradas pelo ascist.

# 2) Background / Context

PRD exige sincronização com Google Calendar como critério de sucesso: toda exportação deve sobrescrever eventos da mesma semana previamente criados pelo app.

# 3) Assumptions & Constraints

- ASSUMPTION: Usaremos Google Calendar API via OAuth tokens da sessão Firebase (Identity Provider). Extra escopos: `https://www.googleapis.com/auth/calendar.events`.
- Constraint: Backend Python Cloud Function roda integração para evitar expor service credentials no frontend.
- Constraint: Persistir `calendarEventId` por slot para detectar já exportados.
- Constraint: Exportar apenas slots com entrada (ignorar vazios).

# 4) Dependencies

- tasks/weekly-planner-ui.md
- files/back/src/services/item_service.py _(reference for structure)_
- files/back/src/util/db_auth_wrapper.py
- files/front/src/hooks/useWeeklyPlan.ts

# 5) Context Plan

**Beginning:**

- `back/main.py`
- `back/src/brokers/https/*`
- `back/src/services/*`
- `back/src/util/*`
- `front/src/hooks/useWeeklyPlan.ts`
- `front/src/app/dashboard/page.tsx`

**End state:**

- `back/src/services/calendar_service.py`
- `back/src/brokers/https/export_calendar.py`
- `back/src/models/weekly_plan_types.py`
- `front/src/lib/functions.ts`
- `front/src/hooks/useCalendarExport.ts`
- Updated `firebase.json` (deploy target) and `front/src/app/dashboard/page.tsx` (export button)

# 6) Low-Level Steps

1. **Enable Google Calendar scope**

   - Update Firebase Auth config to request `calendar.events` scope on Google provider.
   - Document required `.env.local` variable `NEXT_PUBLIC_FIREBASE_SCOPES`.

2. **Model definition (backend)**

   - Create `back/src/models/weekly_plan_types.py` mirroring `WeeklyPlanDoc`.
   - Include helper `def slot_to_event(slot, user_tz):` returning dict with start/end datetimes.

3. **Service module**

   - `back/src/services/calendar_service.py`:
     - `def export_week_plan(user_token: str, week_plan: WeeklyPlanDoc, planner_config: PlannerConfigDoc) -> dict:`
     - Use Google API Python client (`google-api-python-client` add to `requirements.txt`).
     - Steps:
       1. Build credentials via `google.oauth2.credentials.Credentials(token=user_token, refresh_token=..., client_id=..., client_secret=...)`.
       2. Query calendar for existing events with `extendedProperties.private["ascistWeek"] == week_plan.weekStartISO`.
       3. Delete or batch update them.
       4. For each slot entry, create event summary `[FAROL 1] Label` and description referencing objetivo.
       5. Set `colorId` mapping per Farol type (document mapping).
     - Return list of event IDs created.

4. **HTTPS callable**

   - New endpoint `back/src/brokers/https/export_calendar.py` with `@https_fn.on_request`.
   - Validate Firebase auth (use `db_auth_wrapper.require_auth`).
   - Fetch Firestore docs: planner config + weekly plan for requested `weekStart`.
   - Call `calendar_service.export_week_plan`.
   - Update Firestore `weeklyPlans/{weekStart}` storing map `calendarEventIds`.

5. **Deploy config**

   - Add route to `firebase.json` hosting rewrites? (if using callable) else ensure function exported in `back/main.py`.

6. **Frontend hook**

   - `front/src/hooks/useCalendarExport.ts` using `useAuth()` to fetch ID token (with scope) and call callable via `front/src/lib/functions.ts`.
   - Expose `exportWeek(weekStartISO): Promise<void>` and state `isExporting`.

7. **Dashboard button**

   - In `front/src/app/dashboard/page.tsx`, add CTA “Exportar para Google Calendar”.
   - Disable button when `plan` dirty? show toast success/failure (pt-BR copy).

8. **Overwrite behavior**

   - Backend ensures events created previously with same `ascistWeek` property are deleted before re-creating.
   - Document in README.

9. **Error handling**

   - Distinguish `insufficientPermissions` (prompt user to reconnect) vs generic failure.
   - Provide UI to re-trigger OAuth consent (maybe `loginWithGoogle({forcePrompt: true})`).

10. **Testing**

   - Write integration test hitting Cloud Function locally (using `functions-framework`) with mocked Google API (use `httpretty`).
   - Manual: plan week, run export, verify events appear in Google Calendar with colors.

# 7) Types & Interfaces

```ts
// HTTPS callable payload front→back
export interface ExportCalendarRequest {
  weekStartISO: string; // YYYY-MM-DD Monday
  timezone: string; // e.g., "America/Sao_Paulo"
}

export interface ExportCalendarResponse {
  weekStartISO: string;
  exportedCount: number;
  overwrittenCount: number;
  calendarEventIds: Record<string, string>; // slotId -> Google eventId
  calendarId: string;
}

// Firestore document stored at users/{uid}/weeklyPlans/{weekStartISO}
export interface WeeklyPlanExportDoc extends WeeklyPlanDoc {
  calendarEventIds: Record<string, string>;
  lastExportedAt: FirebaseTimestamp | null;
}
```

- Hook interface:
  ```ts
  export function useCalendarExport() {
    return { exportWeek, isExporting, lastResult, error };
  }
  ```

# 8) Acceptance Criteria

- Ao clicar em “Exportar para Google Calendar”, eventos são criados (ou substituídos) na agenda associada, com cores mapeadas conforme Farol.
- Exportar novamente a mesma semana substitui eventos anteriores criados pelo app (verificar `extendedProperties.private.ascistWeek`).
- Firestore `weeklyPlans/{week}` guarda `calendarEventIds` e timestamp `lastExportedAt`.

# 9) Testing Strategy

- Backend unit tests para `slot_to_event` (pytest).
- Integration test com mock Google API para garantir sobrescrita.
- Manual QA autenticando com conta de teste Google.

# 10) Notes / Links

- Google Calendar colors: https://developers.google.com/calendar/api/v3/reference/colors
- PRD: `@.cursor/rules/PRD.mdc`.

