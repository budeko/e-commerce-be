type IyzipayCallback<T> = (err: unknown, result: T) => void;

export const promisifyIyzipay = <T>(
  invoke: (request: Record<string, unknown>, callback: IyzipayCallback<T>) => void,
  request: Record<string, unknown>
): Promise<T> =>
  new Promise((resolve, reject) => {
    invoke(request, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(result);
    });
  });
