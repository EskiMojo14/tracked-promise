export type Pending<
  T,
  TPromise extends PromiseLike<T> = Promise<T>,
> = TPromise & { status: "pending" };

export type Fulfilled<
  T,
  TPromise extends PromiseLike<T> = Promise<T>,
> = TPromise & { status: "fulfilled"; value: T };

export type Rejected<
  T,
  TPromise extends PromiseLike<T> = Promise<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = TPromise & { status: "rejected"; reason: any };

export type Settled<T, TPromise extends PromiseLike<T> = Promise<T>> =
  | Fulfilled<T, TPromise>
  | Rejected<T, TPromise>;

export type TrackedPromise<T, TPromise extends PromiseLike<T> = Promise<T>> =
  | Pending<T, TPromise>
  | Settled<T, TPromise>;

export { type TrackedPromise as Promise };

const _pend = <T, TPromise extends PromiseLike<T>>(
  promise: TPromise,
): Pending<T, TPromise> =>
  Object.assign(promise, {
    status: "pending" as const,
  });
const _fulfill = <T, TPromise extends PromiseLike<T>>(
  promise: TPromise,
  value: T,
): Fulfilled<T, TPromise> =>
  Object.assign(promise, {
    status: "fulfilled" as const,
    value,
  });
const _reject = <T, TPromise extends PromiseLike<T>>(
  promise: TPromise,
  reason: unknown,
): Rejected<T, TPromise> =>
  Object.assign(promise, {
    status: "rejected" as const,
    reason,
  });

export const resolve = <T>(value: T): Fulfilled<T> =>
  _fulfill(Promise.resolve(value), value);

export function reject<T = never>(reason?: unknown): Rejected<T> {
  // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
  const promise = Promise.reject(reason);
  promise.catch(() => {
    /* edge cases */
  });

  return _reject(promise, reason);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function from<TPromise extends PromiseLike<any>>(
  promise: TPromise,
): TrackedPromise<Awaited<TPromise>, TPromise> {
  const tracked = _pend(promise);
  tracked.then(
    (value) => _fulfill(tracked, value),
    (reason: unknown) => _reject(tracked, reason),
  );
  return tracked;
}

export const create = <T>(
  executor: (
    resolve: (value: T | PromiseLike<T>) => void,
    reject: (reason?: unknown) => void,
  ) => void,
): TrackedPromise<T> => from(new Promise(executor));

const makeStatusGuard =
  <TStatus extends TrackedPromise<unknown>["status"]>(status: TStatus) =>
  <T>(
    promise: TrackedPromise<T>,
  ): promise is Extract<TrackedPromise<T>, { status: TStatus }> =>
    promise.status === status;

export const isPending = makeStatusGuard("pending");
export const isFulfilled = makeStatusGuard("fulfilled");
export const isRejected = makeStatusGuard("rejected");
