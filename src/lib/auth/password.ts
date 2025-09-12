import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';
// import { AUTH_CONFIG } from './jwt'; // Removido - não existe

// Função para hash de senha
export async function hashPassword(password: string): Promise<string> {
  try {
    const saltRounds = 12; // Default bcrypt rounds
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    logger.debug('Senha hasheada com sucesso', {
      saltRounds,
      passwordLength: password.length,
    });

    return hashedPassword;
  } catch (error) {
    logger.error('Erro ao hashear senha', { error: error as Error });
    throw new Error('Falha ao processar senha');
  }
}

// Função para verificar senha
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const isValid = await bcrypt.compare(password, hashedPassword);

    logger.debug('Verificação de senha concluída', {
      isValid,
      passwordLength: password.length,
    });

    return isValid;
  } catch (error) {
    logger.error('Erro ao verificar senha', { error: error as Error });
    throw new Error('Falha ao verificar senha');
  }
}

// Função para verificar se uma senha é forte
export function isPasswordStrong(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Comprimento mínimo
  if (password.length < 8) {
    feedback.push('A senha deve ter pelo menos 8 caracteres');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  // Presença de letras maiúsculas
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Adicione pelo menos uma letra maiúscula');
  }

  // Presença de letras minúsculas
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Adicione pelo menos uma letra minúscula');
  }

  // Presença de números
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Adicione pelo menos um número');
  }

  // Presença de caracteres especiais
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Adicione pelo menos um caractere especial');
  }

  // Verificar padrões comuns
  const commonPatterns = [
    '123456',
    'password',
    'qwerty',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    'master',
    'football',
  ];

  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    score -= 1;
    feedback.push('Evite padrões comuns de senha');
  }

  // Verificar repetição de caracteres
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Evite repetir o mesmo caractere muitas vezes');
  }

  // Verificar sequências
  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
    score -= 1;
    feedback.push('Evite sequências de letras');
  }

  // Verificar sequências numéricas
  if (/123|234|345|456|567|678|789|012|1234|2345|3456|4567|5678|6789|0123/i.test(password)) {
    score -= 1;
    feedback.push('Evite sequências numéricas');
  }

  // Calcular score final
  const maxScore = 6;
  const finalScore = Math.max(0, Math.min(maxScore, score));
  const isValid = finalScore >= 4 && feedback.length === 0;

  return {
    isValid,
    score: finalScore,
    feedback,
  };
}

// Função para gerar senha aleatória
export function generateRandomPassword(length: number = 12): string {
  const charset = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  };

  let password = '';

  // Garantir pelo menos um de cada tipo
  password += charset.uppercase[Math.floor(Math.random() * charset.uppercase.length)];
  password += charset.lowercase[Math.floor(Math.random() * charset.lowercase.length)];
  password += charset.numbers[Math.floor(Math.random() * charset.numbers.length)];
  password += charset.symbols[Math.floor(Math.random() * charset.symbols.length)];

  // Preencher o resto aleatoriamente
  const remainingLength = length - 4;
  const allChars = charset.uppercase + charset.lowercase + charset.numbers + charset.symbols;

  for (let i = 0; i < remainingLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Embaralhar a senha
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

// Função para validar força da senha com feedback detalhado
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  level: 'weak' | 'medium' | 'strong' | 'very-strong';
  feedback: string[];
  suggestions: string[];
} {
  const validation = isPasswordStrong(password);
  const suggestions: string[] = [];

  // Determinar nível baseado no score
  let level: 'weak' | 'medium' | 'strong' | 'very-strong';
  if (validation.score <= 2) {
    level = 'weak';
  } else if (validation.score <= 3) {
    level = 'medium';
  } else if (validation.score <= 4) {
    level = 'strong';
  } else {
    level = 'very-strong';
  }

  // Sugestões para melhorar a senha
  if (password.length < 12) {
    suggestions.push('Aumente o comprimento para pelo menos 12 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    suggestions.push('Adicione letras maiúsculas');
  }

  if (!/[a-z]/.test(password)) {
    suggestions.push('Adicione letras minúsculas');
  }

  if (!/\d/.test(password)) {
    suggestions.push('Adicione números');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    suggestions.push('Adicione caracteres especiais');
  }

  if (validation.score < 4) {
    suggestions.push('Evite padrões previsíveis e sequências');
  }

  return {
    isValid: validation.isValid,
    score: validation.score,
    level,
    feedback: validation.feedback,
    suggestions,
  };
}

// Função para verificar se a senha foi comprometida (simulação)
export async function isPasswordCompromised(password: string): Promise<boolean> {
  try {
    // Em um sistema real, você faria uma chamada para a API do HaveIBeenPwned
    // Por enquanto, simulamos com algumas senhas conhecidas
    const compromisedPasswords = [
      'password123',
      '123456789',
      'qwerty123',
      'admin123',
      'letmein123',
    ];

    const isCompromised = compromisedPasswords.includes(password.toLowerCase());

    if (isCompromised) {
      logger.warn('Senha potencialmente comprometida detectada', {
        passwordLength: password.length,
      });
    }

    return isCompromised;
  } catch (error) {
    logger.error('Erro ao verificar se senha foi comprometida', { error: error as Error });
    // Em caso de erro, assumimos que não foi comprometida para não bloquear o usuário
    return false;
  }
}

// Função para obter estatísticas de força de senha
export function getPasswordStrengthStats(): {
  totalPasswords: number;
  weakPasswords: number;
  mediumPasswords: number;
  strongPasswords: number;
  veryStrongPasswords: number;
  averageScore: number;
} {
  // Em um sistema real, você coletaria essas estatísticas do banco de dados
  // Por enquanto, retornamos dados simulados
  return {
    totalPasswords: 0,
    weakPasswords: 0,
    mediumPasswords: 0,
    strongPasswords: 0,
    veryStrongPasswords: 0,
    averageScore: 0,
  };
}


