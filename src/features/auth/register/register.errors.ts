export class RegisterError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'RegisterError';
  }
}

export const isDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: number }).code === 11000
  );
};
