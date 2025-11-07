// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPromiseLike = PromiseLike<any>;

export type Pending<
  T,
  TPromise extends PromiseLike<T> = Promise<T>,
> = TPromise & { status: "pending" };
export namespace Pending {
  export type From<TPromise extends AnyPromiseLike> = Pending<
    Awaited<TPromise>,
    TPromise
  >;
}

export type Fulfilled<
  T,
  TPromise extends PromiseLike<T> = Promise<T>,
> = TPromise & { status: "fulfilled"; value: T };
export namespace Fulfilled {
  export type From<TPromise extends AnyPromiseLike> = Fulfilled<
    Awaited<TPromise>,
    TPromise
  >;
}

export type Rejected<
  T = never,
  TPromise extends PromiseLike<T> = Promise<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = TPromise & { status: "rejected"; reason: any };
export namespace Rejected {
  export type From<TPromise extends AnyPromiseLike> = Rejected<
    Awaited<TPromise>,
    TPromise
  >;
}

export type Settled<T, TPromise extends PromiseLike<T> = Promise<T>> =
  | Fulfilled<T, TPromise>
  | Rejected<T, TPromise>;
export namespace Settled {
  export type From<TPromise extends AnyPromiseLike> = Settled<
    Awaited<TPromise>,
    TPromise
  >;
}

export type TrackedPromise<T, TPromise extends PromiseLike<T> = Promise<T>> =
  | Pending<T, TPromise>
  | Settled<T, TPromise>;
// eslint-disable-next-line import-x/export
export namespace TrackedPromise {
  export type From<TPromise extends AnyPromiseLike> = TrackedPromise<
    Awaited<TPromise>,
    TPromise
  >;
}

export type WillResolve<T, TPromise extends PromiseLike<T> = Promise<T>> =
  | Pending<T, TPromise>
  | Fulfilled<T, TPromise>;
export namespace WillResolve {
  export type From<TPromise extends AnyPromiseLike> = WillResolve<
    Awaited<TPromise>,
    TPromise
  >;
}

export type WillReject<
  T = never,
  TPromise extends PromiseLike<T> = Promise<T>,
> = Pending<T, TPromise> | Rejected<T, TPromise>;
export namespace WillReject {
  export type From<TPromise extends AnyPromiseLike> = WillReject<
    Awaited<TPromise>,
    TPromise
  >;
}

export { TrackedPromise as Promise };

export const isTrackedPromise = <TPromise extends AnyPromiseLike>(
  promise: TPromise,
): promise is TrackedPromise.From<TPromise> => "status" in promise;

const makeStatusGuard =
  <TStatus extends TrackedPromise<unknown>["status"]>(status: TStatus) =>
  <TPromise extends AnyPromiseLike>(
    promise: TPromise & { status?: unknown },
  ): promise is Extract<TrackedPromise.From<TPromise>, { status: TStatus }> =>
    promise.status === status;

export const isPending: <TPromise extends AnyPromiseLike>(
  promise: TPromise,
) => promise is Pending.From<TPromise> =
  /* #__PURE__ */ makeStatusGuard("pending");
export const isFulfilled: <TPromise extends AnyPromiseLike>(
  promise: TPromise,
) => promise is Fulfilled.From<TPromise> =
  /* #__PURE__ */ makeStatusGuard("fulfilled");
export const isRejected: <TPromise extends AnyPromiseLike>(
  promise: TPromise,
) => promise is Rejected.From<TPromise> =
  /* #__PURE__ */ makeStatusGuard("rejected");

export const isSettled = <TPromise extends AnyPromiseLike>(
  promise: TPromise,
): promise is Settled.From<TPromise> =>
  isTrackedPromise(promise) && !isPending(promise);

export function resolve<TPromise extends AnyPromiseLike>(
  promise: TPromise,
  value: Awaited<TPromise>,
): Fulfilled.From<TPromise>;
export function resolve<T>(value: T): Fulfilled<T>;
export function resolve(
  valueOrPromise: unknown,
  value?: unknown,
): Fulfilled<unknown, AnyPromiseLike> {
  if (arguments.length === 2) {
    return Object.assign(valueOrPromise as AnyPromiseLike, {
      status: "fulfilled" as const,
      value,
    });
  }
  return resolve(Promise.resolve(valueOrPromise), valueOrPromise);
}

export function reject<TPromise extends AnyPromiseLike>(
  promise: TPromise,
  reason: unknown,
): Rejected.From<TPromise>;
export function reject<T = never>(reason?: unknown): Rejected<T>;
export function reject(
  promiseOrReason?: unknown,
  reason?: unknown,
): Rejected<unknown, AnyPromiseLike> {
  if (arguments.length === 2) {
    return Object.assign(promiseOrReason as AnyPromiseLike, {
      status: "rejected" as const,
      reason,
    });
  }
  // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
  const promise = Promise.reject(promiseOrReason);
  promise.catch(() => {
    /* edge cases */
  });
  return reject(promise, promiseOrReason);
}

export function track<TPromise extends AnyPromiseLike>(
  promise: TPromise,
): TrackedPromise.From<TPromise> {
  if (isTrackedPromise(promise)) return promise;

  const tracked = Object.assign(promise, {
    status: "pending" as const,
  });
  tracked.then(
    (value) => {
      if (isPending(tracked)) resolve(tracked, value);
    },
    (reason: unknown) => {
      if (isPending(tracked)) reject(tracked, reason);
    },
  );

  return tracked;
}

export type Executor<T> = (
  resolve: (value: T | PromiseLike<T>) => void,
  reject: (reason?: unknown) => void,
) => void;

export const create = <T>(executor: Executor<T>): TrackedPromise<T> =>
  track(new Promise(executor));

export interface TrackedPromiseConstructor {
  new <T>(executor: Executor<T>): TrackedPromise<T>;
  <T>(executor: Executor<T>): TrackedPromise<T>;
}

function makeConstructor(): TrackedPromiseConstructor {
  function TrackedPromise<T>(executor: Executor<T>): TrackedPromise<T> {
    return create(executor);
  }
  Object.defineProperty(TrackedPromise, Symbol.hasInstance, {
    value: (instance: unknown) =>
      instance instanceof Promise && isTrackedPromise(instance),
  });
  return TrackedPromise as never;
}

// eslint-disable-next-line import-x/export
export const TrackedPromise = /* #__PURE__ */ makeConstructor();

export interface TrackedPromiseWithResolvers<T> {
  promise: TrackedPromise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}
export { type TrackedPromiseWithResolvers as PromiseWithResolvers };
export function withResolvers<T>(): TrackedPromiseWithResolvers<T> {
  const { promise, ...resolvers } = Promise.withResolvers<T>();
  return {
    promise: track(promise),
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
    promise: track(promise) as WillResolve<T>,
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
    promise: track(promise) as WillReject<T>,
    reject,
  };
}
