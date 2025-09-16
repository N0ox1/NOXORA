// Mapeamento de códigos de erro para mensagens amigáveis em português
export const ERROR_MESSAGES = {
    // Erros de autenticação
    invalid_credentials: 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.',
    user_not_found: 'Usuário não encontrado. Verifique se o email está correto.',
    invalid_password: 'Senha incorreta. Tente novamente ou use a opção "Esqueci minha senha".',
    account_locked: 'Sua conta foi bloqueada. Entre em contato com o suporte.',
    account_inactive: 'Sua conta está inativa. Entre em contato com o administrador.',

    // Erros de validação
    validation_error: 'Dados inválidos. Verifique os campos preenchidos.',
    email_required: 'Email é obrigatório.',
    password_required: 'Senha é obrigatória.',
    email_invalid: 'Email inválido. Digite um email válido.',
    password_too_short: 'Senha muito curta. Use pelo menos 6 caracteres.',

    // Erros de sistema
    database_error: 'Erro interno do servidor. Tente novamente em alguns minutos.',
    internal_error: 'Erro interno do servidor. Nossa equipe foi notificada.',
    network_error: 'Erro de conexão. Verifique sua internet e tente novamente.',
    timeout_error: 'Tempo limite excedido. Tente novamente.',

    // Erros de registro
    email_already_exists: 'Este email já está em uso. Use outro email ou faça login.',
    weak_password: 'Senha muito fraca. Use uma senha mais segura.',
    invalid_phone: 'Telefone inválido. Use o formato correto.',

    // Erros de sessão
    session_expired: 'Sua sessão expirou. Faça login novamente.',
    unauthorized: 'Você não tem permissão para acessar esta área.',
    forbidden: 'Acesso negado. Entre em contato com o administrador.',
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

/**
 * Converte um código de erro em uma mensagem amigável
 */
export function getErrorMessage(errorCode: string | ErrorCode): string {
    // Se for um código conhecido, retorna a mensagem mapeada
    if (errorCode in ERROR_MESSAGES) {
        return ERROR_MESSAGES[errorCode as ErrorCode];
    }

    // Se for uma mensagem já em português, retorna ela
    if (typeof errorCode === 'string' && errorCode.length > 0) {
        return errorCode;
    }

    // Fallback para erro genérico
    return 'Ocorreu um erro inesperado. Tente novamente.';
}

/**
 * Verifica se um erro é relacionado a credenciais inválidas
 */
export function isCredentialError(errorCode: string): boolean {
    return [
        'invalid_credentials',
        'user_not_found',
        'invalid_password',
        'account_locked',
        'account_inactive'
    ].includes(errorCode);
}

/**
 * Verifica se um erro é relacionado a validação
 */
export function isValidationError(errorCode: string): boolean {
    return [
        'validation_error',
        'email_required',
        'password_required',
        'email_invalid',
        'password_too_short',
        'invalid_phone'
    ].includes(errorCode);
}

/**
 * Verifica se um erro é relacionado ao sistema
 */
export function isSystemError(errorCode: string): boolean {
    return [
        'database_error',
        'internal_error',
        'network_error',
        'timeout_error'
    ].includes(errorCode);
}

