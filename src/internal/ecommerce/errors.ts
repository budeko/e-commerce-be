import { HttpError } from '@/internal/errors';

export class EcommerceError extends HttpError {
  constructor(statusCode: number, message: string) {
    super(statusCode, message);
    this.name = 'EcommerceError';
  }
}
