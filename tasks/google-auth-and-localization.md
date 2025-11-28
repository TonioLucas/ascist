---
description:
globs:
alwaysApply: false
---

id: "TASK-0001"
title: "Ship Google auth flow + pt-BR localization baseline"
status: "planned"
priority: "P0"
labels: ["frontend", "auth", "localization"]
dependencies: []
created: "2025-11-28"

# 1) High-Level Objective

Usuário brasileiro consegue autenticar com Google, ver a UI inicial em pt-BR e cair direto em um dashboard protegido com o tema ShadCN.

# 2) Background / Context

Referência: `@.cursor/rules/PRD.mdc` (ascist PRD). MVP exige login Google, pt-BR primeira classe e adoção do design system ShadCN.

# 3) Assumptions & Constraints

- ASSUMPTION: Email/password auth fica como fallback opcional mas não obrigatório para MVP; implementar somente Google Sign-In agora.
- Constraint: Manter framework atual (`front/` Next.js 13 app router + TypeScript).
- Constraint: Usar ShadCN UI components e Tailwind; copiar strings em pt-BR (sem inglês na UI pública).
- Constraint: Reutilizar `front/src/auth` modules e `front/src/lib/firebase.ts` para auth wiring.

# 4) Dependencies (Other Tasks or Artifacts)

- files/front/src/lib/firebase.ts
- files/front/src/auth/authOperations.ts
- files/front/src/app/signin/page.tsx
- files/front/src/app/layout.tsx

# 5) Context Plan

**Beginning (add to model context):**

- `front/src/lib/firebase.ts`
- `front/src/auth/authOperations.ts`
- `front/src/auth/AuthProvider.tsx`
- `front/src/app/layout.tsx`
- `front/src/app/page.tsx`
- `front/src/app/signin/page.tsx`
- `front/src/theme/ThemeProvider.tsx`
- `front/src/app/globals.css`
- `front/src/config.ts` _(read-only)_

**End state (must exist after completion):**

- `front/src/app/signin/page.tsx`
- `front/src/app/signup/page.tsx` _(read-only if untouched)_
- `front/src/app/layout.tsx`
- `front/src/app/page.tsx`
- `front/src/app/dashboard/page.tsx`
- `front/src/lib/firebase.ts`
- `front/src/lib/i18n.ts`
- `front/src/auth/authOperations.ts`
- `front/src/auth/AuthProvider.tsx`
- `front/src/components/ui/button.tsx` (ShadCN generated)

# 6) Low-Level Steps (Ordered, information-dense)

1. **Install and scaffold ShadCN base**

   - Run `npx shadcn-ui@latest init` inside `front/`.
   - Configure Tailwind + CSS variables in `front/src/app/globals.css` and `tailwind.config.js`.
   - Generate at least `button`, `card`, `input`, `label` components under `front/src/components/ui/`.

2. **Refactor layout & ThemeProvider**

   - Update `front/src/app/layout.tsx` to import `ThemeProvider` and new ShadCN styles; set `<html lang="pt-BR">`.
   - Ensure fonts/colors match Pergaminho palette (purple/yellow/green/blue palette defined in PRD) via CSS variables.

3. **Implement Google auth operation**

   - In `front/src/auth/authOperations.ts`, add `signInWithGoogle` using `GoogleAuthProvider` + `signInWithPopup`.
   - Wire `AuthProvider` context to expose `loginWithGoogle`, `logout`, `currentUser`, `isLoading`.
   - Persist user profile (uid, displayName, photoURL, email) in context + Firestore `users/{uid}` if not present.

4. **Protect dashboard route**

   - Update `front/src/app/dashboard/page.tsx` to read from `useAuth()`; if no user, redirect to `/signin`.
   - Show stub content “Bem-vinde, {nome}” plus CTA buttons to “Planejar semana” (placeholder for future tasks).

5. **Design signin screen (pt-BR)**

   - `front/src/app/signin/page.tsx`: replace current markup with ShadCN card containing copy in pt-BR, Google sign-in button using `loginWithGoogle`.
   - Include fallback email/password form but hide behind `disabled` state or remove entirely per assumption.
   - Provide error toast using ShadCN `useToast` if login fails.

6. **Localization helper**

   - Add `front/src/lib/i18n.ts` exporting `t(key)` simple map for pt-BR strings used in auth flow.
   - Replace hard-coded English text in `layout.tsx`, `page.tsx`, `signin/page.tsx` with `t(...)`.

7. **Routing & metadata**

   - Ensure `/` checks `currentUser`: if logged in, redirect to `/dashboard`; else to `/signin`.
   - Update `metadata` objects to pt-BR titles/descriptions.

8. **Testing / manual verification**

   - Verify Google sign-in works locally with Firebase config (document `.env` requirements in README section).
   - Confirm UI renders Portuguese copy and ShadCN styling.

# 7) Types & Interfaces

```ts
// front/src/auth/types.ts
export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface GoogleSignInRequest {
  provider: "google";
  prompt?: "consent" | "select_account";
}

export interface GoogleSignInResponse {
  user: AuthUser;
  idToken: string;
  refreshToken: string | null;
  hasProfileDoc: boolean;
}

// Firestore document stored at users/{uid}
export interface UserProfileDoc {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  locale: "pt-BR";
  onboardingCompleted: boolean;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}
```

# 8) Acceptance Criteria

- Usuário consegue clicar em “Entrar com Google” em `/signin` e chegar em `/dashboard` autenticado; estado persiste após refresh (Firebase Auth).
- Toda cópia exibida nos fluxos de login e layout padrão está em pt-BR (verificado ao percorrer `/`, `/signin`, `/dashboard`).
- ShadCN components (`front/src/components/ui/button.tsx` etc.) são usados em todas as páginas tocadas pelo task.

# 9) Testing Strategy

- Exercício manual: iniciar `front` com `yarn dev`, autenticar com Google conta teste, inspecionar redirecionamentos.
- Adicionar teste e2e (Playwright) futuramente; por enquanto documentar passos no README.

# 10) Notes / Links

- PRD: `@.cursor/rules/PRD.mdc`
- Firebase console: ensure OAuth Client ID has `http://localhost:3000` authorized.

