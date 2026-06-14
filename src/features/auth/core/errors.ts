import { HttpError } from '@/lib/common/errors';

export class AuthError extends HttpError {
  constructor(statusCode: number, message: string) {
    super(statusCode, message);
    this.name = 'AuthError';
  }
}

export { isDuplicateKeyError } from '@/lib/common/errors';
