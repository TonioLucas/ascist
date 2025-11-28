const translations: Record<string, string> = {
  // Auth
  "auth.signin": "Entrar",
  "auth.signin.title": "Entrar na sua conta",
  "auth.signin.subtitle": "Bem-vinde de volta! Entre para continuar.",
  "auth.signin.google": "Entrar com Google",
  "auth.signin.email": "Email",
  "auth.signin.email.placeholder": "seu@email.com",
  "auth.signin.password": "Senha",
  "auth.signin.submit": "Entrar",
  "auth.signin.loading": "Entrando...",
  "auth.signin.noAccount": "Não tem uma conta?",
  "auth.signin.createAccount": "Criar conta",
  "auth.signin.forgotPassword": "Esqueceu a senha?",
  "auth.signin.or": "ou",
  "auth.signout": "Sair",
  "auth.signout.loading": "Saindo...",
  "auth.token.label": "Token de acesso",
  "auth.token.placeholder": "Cole seu token aqui",
  "auth.token.submit": "Entrar com token",

  // Errors
  "error.generic": "Ocorreu um erro. Tente novamente.",
  "error.auth.invalidCredentials": "Email ou senha inválidos.",
  "error.auth.googleFailed": "Falha ao entrar com Google. Tente novamente.",
  "error.auth.userNotFound": "Usuário não encontrado.",
  "error.auth.wrongPassword": "Senha incorreta.",
  "error.auth.emailInUse": "Este email já está em uso.",
  "error.auth.weakPassword": "A senha deve ter pelo menos 6 caracteres.",
  "error.auth.popupClosed": "Login cancelado. A janela foi fechada.",
  "error.auth.tokenNotConfigured": "Token de desenvolvimento não configurado.",
  "error.auth.invalidToken": "Token inválido.",

  // Dashboard
  "dashboard.title": "Painel",
  "dashboard.welcome": "Bem-vinde, {name}!",
  "dashboard.planWeek": "Planejar semana",
  "dashboard.planWeek.description": "Organize suas tarefas para os próximos dias",

  // App
  "app.name": "ascist",
  "app.description": "Sistema de gestão de tempo baseado no Método Ascensão",

  // Common
  "common.loading": "Carregando...",
  "common.save": "Salvar",
  "common.cancel": "Cancelar",
  "common.delete": "Excluir",
  "common.edit": "Editar",
  "common.back": "Voltar",
  "common.next": "Próximo",
  "common.confirm": "Confirmar",

  // Planner
  "planner.title": "Meu Plano Base",
  "planner.subtitle": "Configure seus objetivos semestrais e atividades dos Faróis",
  "planner.save": "Salvar plano base",
  "planner.save.success": "Plano base salvo com sucesso!",
  "planner.save.error": "Erro ao salvar plano base",
  "planner.legend": "Legenda",
  "planner.items": "Itens",
  "planner.tabs.objetivos": "Objetivos",
  "planner.tabs.farois": "Faróis",

  // Farol types
  "planner.farol1": "Farol 1",
  "planner.farol2.title": "Farol 2 - Compromissos",
  "planner.farol2.description": "Compromissos externos que você precisa honrar",
  "planner.farol2.placeholder": "Ex: Reunião semanal de equipe",
  "planner.farol3.title": "Farol 3 - Hábitos",
  "planner.farol3.description": "Hábitos diários para manter (máximo 7)",
  "planner.farol3.placeholder": "Ex: Exercício físico",
  "planner.tempoCoringa.title": "Tempo Coringa",
  "planner.tempoCoringa.description": "Blocos flexíveis para imprevistos",
  "planner.tempoCoringa.placeholder": "Ex: Buffer para urgências",
  "planner.desvioDeRota.title": "Desvio de Rota",
  "planner.desvioDeRota.description": "Pausas intencionais e descanso",
  "planner.desvioDeRota.placeholder": "Ex: Tempo de lazer",

  // Objetivo form
  "planner.objetivo.description": "Defina sua meta semestral e as tarefas para alcançá-la",
  "planner.objetivo.titulo": "Título do objetivo",
  "planner.objetivo.titulo.placeholder": "Ex: Aumentar renda em 30%",
  "planner.objetivo.descricao": "Descrição (opcional)",
  "planner.objetivo.descricao.placeholder": "Detalhes adicionais sobre o objetivo...",
  "planner.objetivo.prazo": "Prazo",
  "planner.objetivo.tarefas": "Tarefas (Farol 1)",
  "planner.objetivo.tarefas.placeholder": "Adicionar tarefa...",
};

/**
 * Simple translation function for pt-BR strings
 * @param key Translation key
 * @param params Optional parameters for interpolation (e.g., {name: "João"})
 * @returns Translated string or the key if not found
 */
export function t(key: string, params?: Record<string, string>): string {
  let text = translations[key] || key;

  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(`{${paramKey}}`, value);
    });
  }

  return text;
}

/**
 * Maps Firebase auth error codes to localized error messages
 */
export function getAuthErrorMessage(errorCode: string): string {
  const errorMap: Record<string, string> = {
    "auth/invalid-email": "error.auth.invalidCredentials",
    "auth/user-disabled": "error.auth.userNotFound",
    "auth/user-not-found": "error.auth.userNotFound",
    "auth/wrong-password": "error.auth.wrongPassword",
    "auth/email-already-in-use": "error.auth.emailInUse",
    "auth/weak-password": "error.auth.weakPassword",
    "auth/popup-closed-by-user": "error.auth.popupClosed",
    "auth/cancelled-popup-request": "error.auth.popupClosed",
    "auth/invalid-credential": "error.auth.invalidCredentials",
    "auth/token-not-configured": "error.auth.tokenNotConfigured",
    "auth/invalid-token": "error.auth.invalidToken",
  };

  const translationKey = errorMap[errorCode] || "error.generic";
  return t(translationKey);
}
