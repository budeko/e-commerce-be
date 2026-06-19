import { HttpError } from '@/internal/errors';

type IyzipayCallback<T> = (err: unknown, result: T) => void;

const toIyzipayError = (err: unknown): HttpError => {
  if (err instanceof HttpError) {
    return err;
  }

  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : 'Iyzico isteği başarısız';

  return new HttpError(502, message);
};

export const promisifyIyzipay = <T>(
  invoke: (request: Record<string, unknown>, callback: IyzipayCallback<T>) => void,
  request: Record<string, unknown>
): Promise<T> =>
  new Promise((resolve, reject) => {
    invoke(request, (err, result) => {
      if (err) {
        reject(toIyzipayError(err));
        return;
      }

      resolve(result);
    });
  });
