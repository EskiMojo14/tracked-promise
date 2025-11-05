import { describe, it, expectTypeOf } from "vitest";
import * as TrackedPromise from ".";

const specialPromise = Object.assign(Promise.resolve(1), { isSpecial: true });

describe("resolve", () => {
  it("should return a fulfilled promise", () => {
    const promise = TrackedPromise.resolve(1);
    expectTypeOf(promise).toEqualTypeOf<TrackedPromise.Fulfilled<number>>();
  });
});

describe("reject", () => {
  it("should return a rejected promise", () => {
    const promise = TrackedPromise.reject(1);
    expectTypeOf(promise).toEqualTypeOf<TrackedPromise.Rejected>();
  });
});

describe("from", () => {
  it("should return a tracked promise", () => {
    const promise = TrackedPromise.from(Promise.resolve(1));
    expectTypeOf(promise).toEqualTypeOf<TrackedPromise.Promise<number>>();
  });
  it("should keep the type of the promise", () => {
    const promise = TrackedPromise.from(specialPromise);
    expectTypeOf(promise).toEqualTypeOf<
      TrackedPromise.Promise<number, typeof specialPromise>
    >();
  });
});

describe("create", () => {
  it("should return a tracked promise", () => {
    const promise = TrackedPromise.create<number>((resolve) => {
      resolve(1);
    });
    expectTypeOf(promise).toEqualTypeOf<TrackedPromise.Promise<number>>();
  });
});

describe("TrackedPromise", () => {
  it("should return a tracked promise", () => {
    const promise = new TrackedPromise.TrackedPromise<number>((resolve) => {
      resolve(1);
    });
    expectTypeOf(promise).toEqualTypeOf<TrackedPromise.Promise<number>>();
  });
});

describe("type guards", () => {
  const normalPromise = Promise.resolve(1);
  const trackedPromise = TrackedPromise.create<number>((resolve) => {
    resolve(1);
  });
  const trackedSpecialPromise = TrackedPromise.from(specialPromise);
  describe("isTrackedPromise", () => {
    it("should narrow type to tracked promise", () => {
      if (TrackedPromise.isTrackedPromise(normalPromise)) {
        expectTypeOf(normalPromise).toEqualTypeOf<
          TrackedPromise.Promise<number>
        >();
      }
      if (TrackedPromise.isTrackedPromise(specialPromise)) {
        expectTypeOf(specialPromise).toEqualTypeOf<
          TrackedPromise.Promise<number, typeof specialPromise>
        >();
      }
    });
  });
  describe("isPending", () => {
    it("should narrow type to pending promise", () => {
      if (TrackedPromise.isPending(normalPromise)) {
        expectTypeOf(normalPromise).toEqualTypeOf<
          TrackedPromise.Pending<number>
        >();
      }
      if (TrackedPromise.isPending(specialPromise)) {
        expectTypeOf(specialPromise).toEqualTypeOf<
          TrackedPromise.Pending<number, typeof specialPromise>
        >();
      }
      if (TrackedPromise.isPending(trackedPromise)) {
        expectTypeOf(trackedPromise).toEqualTypeOf<
          TrackedPromise.Pending<number>
        >();
      }
      if (TrackedPromise.isPending(trackedSpecialPromise)) {
        expectTypeOf(trackedSpecialPromise).toEqualTypeOf<
          TrackedPromise.Pending<number, typeof specialPromise>
        >();
      }
    });
  });
  describe("isFulfilled", () => {
    it("should narrow type to fulfilled promise", () => {
      if (TrackedPromise.isFulfilled(normalPromise)) {
        expectTypeOf(normalPromise).toEqualTypeOf<
          TrackedPromise.Fulfilled<number>
        >();
      }
      if (TrackedPromise.isFulfilled(specialPromise)) {
        expectTypeOf(specialPromise).toEqualTypeOf<
          TrackedPromise.Fulfilled<number, typeof specialPromise>
        >();
      }
      if (TrackedPromise.isFulfilled(trackedPromise)) {
        expectTypeOf(trackedPromise).toEqualTypeOf<
          TrackedPromise.Fulfilled<number>
        >();
      }
      if (TrackedPromise.isFulfilled(trackedSpecialPromise)) {
        expectTypeOf(trackedSpecialPromise).toEqualTypeOf<
          TrackedPromise.Fulfilled<number, typeof specialPromise>
        >();
      }
    });
  });
  describe("isRejected", () => {
    it("should narrow type to rejected promise", () => {
      if (TrackedPromise.isRejected(normalPromise)) {
        expectTypeOf(normalPromise).toEqualTypeOf<
          TrackedPromise.Rejected<number, Promise<number>>
        >();
      }
      if (TrackedPromise.isRejected(specialPromise)) {
        expectTypeOf(specialPromise).toEqualTypeOf<
          TrackedPromise.Rejected<number, typeof specialPromise>
        >();
      }
      if (TrackedPromise.isRejected(trackedPromise)) {
        expectTypeOf(trackedPromise).toEqualTypeOf<
          TrackedPromise.Rejected<number, Promise<number>>
        >();
      }
      if (TrackedPromise.isRejected(trackedSpecialPromise)) {
        expectTypeOf(trackedSpecialPromise).toEqualTypeOf<
          TrackedPromise.Rejected<number, typeof specialPromise>
        >();
      }
    });
  });
  describe("isSettled", () => {
    it("should narrow type to settled promise", () => {
      if (TrackedPromise.isSettled(normalPromise)) {
        expectTypeOf(normalPromise).toEqualTypeOf<
          TrackedPromise.Settled<number>
        >();
      }
      if (TrackedPromise.isSettled(specialPromise)) {
        expectTypeOf(specialPromise).toEqualTypeOf<
          TrackedPromise.Settled<number, typeof specialPromise>
        >();
      }
      if (TrackedPromise.isSettled(trackedPromise)) {
        expectTypeOf(trackedPromise).toEqualTypeOf<
          TrackedPromise.Settled<number>
        >();
      }
      if (TrackedPromise.isSettled(trackedSpecialPromise)) {
        expectTypeOf(trackedSpecialPromise).toEqualTypeOf<
          TrackedPromise.Settled<number, typeof specialPromise>
        >();
      }
    });
  });
});

describe("withResolvers", () => {
  it("should return a tracked promise, resolvers and rejector", () => {
    const { promise, resolve, reject } = TrackedPromise.withResolvers<number>();
    expectTypeOf(promise).toEqualTypeOf<TrackedPromise.Promise<number>>();
    expectTypeOf(resolve).toEqualTypeOf<
      (value: number | PromiseLike<number>) => void
    >();
    expectTypeOf(reject).toEqualTypeOf<(reason?: unknown) => void>();
  });
});

describe("withOnlyResolve", () => {
  it("should return a tracked promise and resolver", () => {
    const { promise, resolve, ...rest } =
      TrackedPromise.withOnlyResolve<number>();
    expectTypeOf(promise).toEqualTypeOf<TrackedPromise.WillResolve<number>>();
    expectTypeOf(resolve).toEqualTypeOf<
      (value: number | PromiseLike<number>) => void
    >();
    expectTypeOf(rest).toEqualTypeOf<{}>();
  });
});

describe("withOnlyReject", () => {
  it("should return a tracked promise and rejector", () => {
    const { promise, reject, ...rest } = TrackedPromise.withOnlyReject();
    expectTypeOf(promise).toEqualTypeOf<TrackedPromise.WillReject>();
    expectTypeOf(reject).toEqualTypeOf<(reason?: unknown) => void>();
    expectTypeOf(rest).toEqualTypeOf<{}>();
  });
});
