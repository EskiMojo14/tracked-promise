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

/**
 * Mark a promise (or thenable) as resolved, assigning the `status` and `value` properties.
 * *Will not check if the promise is already resolved.*
 * @param promise Promise to mark as resolved
 * @param value Value to assign to the promise
 * @returns The promise, typed as fulfilled
 * @example
 * const promise = Promise.resolve(1);
 * const trackedPromise = TrackedPromise.resolve(promise, 1);
 * console.log(trackedPromise === promise); // true
 * console.log(trackedPromise.status); // "fulfilled"
 * console.log(trackedPromise.value); // 1
 */
export function resolve<TPromise extends AnyPromiseLike>(
  promise: TPromise,
  value: Awaited<TPromise>,
): Fulfilled.From<TPromise>;
/**
 * Create a resolved promise.
 * @param value Value for the promise to resolve to
 * @returns A fulfilled promise
 * @example
 * const promise = TrackedPromise.resolve(1);
 * console.log(promise.status); // "fulfilled"
 * console.log(promise.value); // 1
 */
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

/**
 * Mark a promise (or thenable) as rejected, assigning the `status` and `reason` properties.
 * *Will not check if the promise is already rejected.*
 * @param promise Promise to mark as rejected
 * @param reason Reason to assign to the promise
 * @returns The promise, typed as rejected
 * @example
 * const promise = Promise.reject(1);
 * const trackedPromise = TrackedPromise.reject(promise, 1);
 * console.log(trackedPromise === promise); // true
 * console.log(trackedPromise.status); // "rejected"
 * console.log(trackedPromise.reason); // 1
 */
export function reject<TPromise extends AnyPromiseLike>(
  promise: TPromise,
  reason: unknown,
): Rejected.From<TPromise>;
/**
 * Create a rejected promise.
 * @param reason Reason for the promise to reject
 * @returns A rejected promise
 * @example
 * const promise = TrackedPromise.reject(1);
 * console.log(promise.status); // "rejected"
 * console.log(promise.reason); // 1
 */
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

/**
 * Create a tracked promise from an existing promise or thenable.
 * _Note that the promise will always be pending until the next tick, even if the existing promise is already settled._
 * @param promise Promise or thenable to track
 * @returns The tracked promise
 * @remarks Calls `promise.then` immediately, which may lead to unexpected behaviour with custom thenables.
 * @example
 * const existingPromise = Promise.resolve(1);
 * const trackedPromise = TrackedPromise.track(existingPromise);
 * console.log(trackedPromise === existingPromise); // true
 * console.log(trackedPromise.status); // "pending"
 *
 * await trackedPromise;
 * console.log(trackedPromise.status); // "fulfilled"
 * console.log(trackedPromise.value); // 1
 */
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

export type Resolver<T> = (value: T | PromiseLike<T>) => void;
export type Rejector = (reason?: unknown) => void;
export type Executor<T> = (resolve: Resolver<T>, reject: Rejector) => void;

/**
 * Create a tracked promise from an executor function. Matches the behavior of `new Promise(executor)`.
 * @param executor Executor function
 * @returns A tracked promise
 * @example
 * const promise = TrackedPromise.create<number>((resolve) => {
 *   resolve(1);
 * });
 * console.log(promise.status); // "pending"
 *
 * await promise;
 * console.log(promise.status); // "fulfilled"
 * console.log(promise.value); // 1
 */
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

/**
 * A wrapper for `TrackedPromise.create` that can optionally be used with the `new` keyword. Matches the behavior of `new Promise(executor)`.
 * *Also overrides the `Symbol.hasInstance` method to allow for type checking with `instanceof`.*
 * @see {@link create}
 * @example
 * const promise = new TrackedPromise.TrackedPromise<number>((resolve) => {
 *   resolve(1);
 * });
 * console.log(promise.status); // "pending"
 *
 * await promise;
 * console.log(promise.status); // "fulfilled"
 * console.log(promise.value); // 1
 *
 * console.log(promise instanceof Promise); // true
 * // equivalent to `promise instanceof Promise && TrackedPromise.isTrackedPromise(promise)`
 * console.log(promise instanceof TrackedPromise.TrackedPromise); // true
 */
// eslint-disable-next-line import-x/export
export const TrackedPromise = /* #__PURE__ */ makeConstructor();

export interface TrackedPromiseWithResolvers<T> {
  promise: TrackedPromise<T>;
  resolve: Resolver<T>;
  reject: Rejector;
}
export { type TrackedPromiseWithResolvers as PromiseWithResolvers };
/**
 * Create a tracked promise with resolvers. Matches the behavior of `Promise.withResolvers`.
 * @returns An object containing the promise and its resolvers
 * @example
 * const { promise, resolve, reject } = TrackedPromise.withResolvers<number>();
 * console.log(promise.status); // "pending"
 * resolve(1);
 * await promise;
 * console.log(promise.status); // "fulfilled"
 * console.log(promise.value); // 1
 */
export function withResolvers<T>(): TrackedPromiseWithResolvers<T> {
  const { promise, ...resolvers } = Promise.withResolvers<T>();
  return {
    promise: track(promise),
    ...resolvers,
  };
}

export interface TrackedPromiseWithOnlyResolve<T> {
  promise: WillResolve<T>;
  resolve: Resolver<T>;
}
export { type TrackedPromiseWithOnlyResolve as PromiseWithOnlyResolve };
/**
 * Create a tracked promise with only a resolver. Matches the behavior of `Promise.withResolvers`, but without the rejector.
 * @returns An object containing the promise and its resolver
 * @example
 * const { promise, resolve } = TrackedPromise.withOnlyResolve<number>();
 * console.log(promise.status); // "pending"
 *
 * resolve(1);
 * await promise;
 * console.log(promise.status); // "fulfilled"
 * console.log(promise.value); // 1
 */
export function withOnlyResolve<T>(): TrackedPromiseWithOnlyResolve<T> {
  const { promise, resolve } = Promise.withResolvers<T>();
  return {
    promise: track(promise) as WillResolve<T>,
    resolve,
  };
}

export interface TrackedPromiseWithOnlyReject<T = never> {
  promise: WillReject<T>;
  reject: Rejector;
}
export { type TrackedPromiseWithOnlyReject as PromiseWithOnlyReject };
/**
 * Create a tracked promise with only a rejector. Matches the behavior of `Promise.withResolvers`, but without the resolver.
 * @returns An object containing the promise and its rejector
 * @example
 * const { promise, reject } = TrackedPromise.withOnlyReject();
 * console.log(promise.status); // "pending"
 *
 * reject(1);
 * await promise.catch(() => {});
 * console.log(promise.status); // "rejected"
 * console.log(promise.reason); // 1
 */
export function withOnlyReject<T = never>(): TrackedPromiseWithOnlyReject<T> {
  const { promise, reject } = Promise.withResolvers<T>();
  return {
    promise: track(promise) as WillReject<T>,
    reject,
  };
}
