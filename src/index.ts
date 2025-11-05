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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isTrackedPromise = <TPromise extends PromiseLike<any>>(
  promise: TPromise,
): promise is TrackedPromise<Awaited<TPromise>, TPromise> =>
  "status" in promise;

const makeStatusGuard =
  <TStatus extends TrackedPromise<unknown>["status"]>(status: TStatus) =>
  <T>(
    promise: TrackedPromise<T, PromiseLike<T>>,
  ): promise is Extract<TrackedPromise<T>, { status: TStatus }> =>
    promise.status === status;

export const isPending = makeStatusGuard("pending");
export const isFulfilled = makeStatusGuard("fulfilled");
export const isRejected = makeStatusGuard("rejected");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isSettled = <TPromise extends PromiseLike<any>>(
  promise: TPromise,
): promise is Settled<Awaited<TPromise>, TPromise> =>
  isTrackedPromise(promise) && !isPending(promise);

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
  if (isTrackedPromise(promise)) return promise;

  const tracked = _pend(promise);
  tracked.then(
    (value) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      if (isPending(tracked)) _fulfill(tracked, value);
    },
    (reason: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      if (isPending(tracked)) _reject(tracked, reason);
    },
  );

  return tracked;
}

export const create = <T>(
  executor: (
    resolve: (value: T | PromiseLike<T>) => void,
    reject: (reason?: unknown) => void,
  ) => void,
): TrackedPromise<T> => from(new Promise(executor));

export interface TrackedPromiseWithResolvers<T> {
  promise: TrackedPromise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}
export { type TrackedPromiseWithResolvers as PromiseWithResolvers };
export function withResolvers<T>(): TrackedPromiseWithResolvers<T> {
  const { promise, ...resolvers } = Promise.withResolvers<T>();
  return {
    promise: from(promise),
    ...resolvers,
  };
}

export interface TrackedPromiseWithOnlyResolve<T> {
  promise: Pending<T> | Fulfilled<T>;
  resolve: (value: T | PromiseLike<T>) => void;
}
export { type TrackedPromiseWithOnlyResolve as PromiseWithOnlyResolve };
export function withOnlyResolve<T>(): TrackedPromiseWithOnlyResolve<T> {
  const { promise, resolve } = Promise.withResolvers<T>();
  return {
    promise: from(promise) as Pending<T> | Fulfilled<T>,
    resolve,
  };
}

export interface TrackedPromiseWithOnlyReject {
  promise: Pending<never> | Rejected<never>;
  reject: (reason?: unknown) => void;
}
export { type TrackedPromiseWithOnlyReject as PromiseWithOnlyReject };
export function withOnlyReject(): TrackedPromiseWithOnlyReject {
  const { promise, reject } = Promise.withResolvers<never>();
  return {
    promise: from(promise) as Pending<never> | Rejected<never>,
    reject,
  };
}
