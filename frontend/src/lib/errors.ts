type ErrorWithMessage = {
  message?: unknown;
};

export function getErrorMessage(error: unknown, fallback = 'Erro inesperado'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;

  if (error && typeof error === 'object') {
    const maybeError = error as ErrorWithMessage;
    if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
      return maybeError.message;
    }
  }

  return fallback;
}
