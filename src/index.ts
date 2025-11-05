// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPromiseLike = PromiseLike<any>;

export type Pending<
  T,
  TPromise extends PromiseLike<T> = Promise<T>,
> = TPromise & { status: "pending" };

export type Fulfilled<
  T,
  TPromise extends PromiseLike<T> = Promise<T>,
> = TPromise & { status: "fulfilled"; value: T };

export type Rejected<
  T = never,
  TPromise extends PromiseLike<T> = Promise<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = TPromise & { status: "rejected"; reason: any };

export type Settled<T, TPromise extends PromiseLike<T> = Promise<T>> =
  | Fulfilled<T, TPromise>
  | Rejected<T, TPromise>;

export type TrackedPromise<T, TPromise extends PromiseLike<T> = Promise<T>> =
  | Pending<T, TPromise>
  | Settled<T, TPromise>;

export type WillResolve<T, TPromise extends PromiseLike<T> = Promise<T>> =
  | Pending<T, TPromise>
  | Fulfilled<T, TPromise>;

export type WillReject<
  T = never,
  TPromise extends PromiseLike<T> = Promise<T>,
> = Pending<T, TPromise> | Rejected<T, TPromise>;

export { type TrackedPromise as Promise };

const _pend = <TPromise extends AnyPromiseLike>(
  promise: TPromise,
): Pending<Awaited<TPromise>, TPromise> =>
  Object.assign(promise, {
    status: "pending" as const,
  });
const _fulfill = <TPromise extends AnyPromiseLike>(
  promise: TPromise,
  value: Awaited<TPromise>,
): Fulfilled<Awaited<TPromise>, TPromise> =>
  Object.assign(promise, {
    status: "fulfilled" as const,
    value,
  });
const _reject = <TPromise extends AnyPromiseLike>(
  promise: TPromise,
  reason: unknown,
): Rejected<Awaited<TPromise>, TPromise> =>
  Object.assign(promise, {
    status: "rejected" as const,
    reason,
  });

export const isTrackedPromise = <TPromise extends AnyPromiseLike>(
  promise: TPromise,
): promise is TrackedPromise<Awaited<TPromise>, TPromise> =>
  "status" in promise;

const makeStatusGuard =
  <TStatus extends TrackedPromise<unknown>["status"]>(status: TStatus) =>
  <TPromise extends AnyPromiseLike>(
    promise: TPromise & { status?: unknown },
  ): promise is Extract<
    TrackedPromise<Awaited<TPromise>, TPromise>,
    { status: TStatus }
  > =>
    promise.status === status;

export const isPending = makeStatusGuard("pending");
export const isFulfilled = makeStatusGuard("fulfilled");
export const isRejected = makeStatusGuard("rejected");

export const isSettled = <TPromise extends AnyPromiseLike>(
  promise: TPromise,
): promise is Settled<Awaited<TPromise>, TPromise> =>
  isTrackedPromise(promise) && !isPending(promise);

export const resolve = <T>(value: T): Fulfilled<T> =>
  _fulfill(Promise.resolve(value), value as never);

export function reject<T = never>(reason?: unknown): Rejected<T> {
  // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
  const promise = Promise.reject(reason);
  promise.catch(() => {
    /* edge cases */
  });
  return _reject(promise, reason);
}

export function from<TPromise extends AnyPromiseLike>(
  promise: TPromise,
): TrackedPromise<Awaited<TPromise>, TPromise> {
  if (isTrackedPromise(promise)) return promise;

  const tracked = _pend(promise);
  tracked.then(
    (value) => {
      if (isPending(tracked)) _fulfill(tracked, value);
    },
    (reason: unknown) => {
      if (isPending(tracked)) _reject(tracked, reason);
    },
  );

  return tracked;
}

export type Executor<T> = (
  resolve: (value: T | PromiseLike<T>) => void,
  reject: (reason?: unknown) => void,
) => void;

export const create = <T>(executor: Executor<T>): TrackedPromise<T> =>
  from(new Promise(executor));

export interface TrackedPromiseConstructor {
  new <T>(executor: Executor<T>): TrackedPromise<T>;
  <T>(executor: Executor<T>): TrackedPromise<T>;
}

export const TrackedPromise: TrackedPromiseConstructor = function <T>(
  executor: Executor<T>,
) {
  return create(executor);
} as never;

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
  promise: WillResolve<T>;
  resolve: (value: T | PromiseLike<T>) => void;
}
export { type TrackedPromiseWithOnlyResolve as PromiseWithOnlyResolve };
export function withOnlyResolve<T>(): TrackedPromiseWithOnlyResolve<T> {
  const { promise, resolve } = Promise.withResolvers<T>();
  return {
    promise: from(promise) as WillResolve<T>,
    resolve,
  };
}

export interface TrackedPromiseWithOnlyReject<T = never> {
  promise: WillReject<T>;
  reject: (reason?: unknown) => void;
}
export { type TrackedPromiseWithOnlyReject as PromiseWithOnlyReject };
export function withOnlyReject<T = never>(): TrackedPromiseWithOnlyReject<T> {
  const { promise, reject } = Promise.withResolvers<T>();
  return {
    promise: from(promise) as WillReject<T>,
    reject,
  };
}
