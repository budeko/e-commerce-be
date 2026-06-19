import { HttpError } from '@/internal/errors';

export class CommerceError extends HttpError {
  constructor(statusCode: number, message: string) {
    super(statusCode, message);
    this.name = 'CommerceError';
  }
}
