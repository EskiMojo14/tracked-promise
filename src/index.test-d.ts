import { describe, it, expectTypeOf } from "vitest";
import { DelayedValue } from "./test-utils";
import * as TrackedPromise from ".";

const delayedValue = new DelayedValue(1);

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

describe("track", () => {
  it("should return a tracked promise", () => {
    const promise = TrackedPromise.track(Promise.resolve(1));
    expectTypeOf(promise).toEqualTypeOf<TrackedPromise.Promise<number>>();
  });
  it("should keep the type of the promise", () => {
    const promise = TrackedPromise.track(delayedValue);
    expectTypeOf(promise).toEqualTypeOf<
      TrackedPromise.Promise.From<DelayedValue<number>>
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
  it("can be used with instanceof", () => {
    const promise = new TrackedPromise.TrackedPromise<number>((resolve) => {
      resolve(1);
    });
    if (promise instanceof TrackedPromise.TrackedPromise) {
      expectTypeOf(promise).toEqualTypeOf<TrackedPromise.Promise<number>>();
    }
  });
});

describe("type guards", () => {
  const normalPromise = Promise.resolve(1);
  const trackedPromise = TrackedPromise.create<number>((resolve) => {
    resolve(1);
  });
  const trackedSpecialPromise = TrackedPromise.track(delayedValue);
  describe("isTrackedPromise", () => {
    it("should narrow type to tracked promise", () => {
      if (TrackedPromise.isTrackedPromise(normalPromise)) {
        expectTypeOf(normalPromise).toEqualTypeOf<
          TrackedPromise.Promise<number>
        >();
      }
      if (TrackedPromise.isTrackedPromise(delayedValue)) {
        expectTypeOf(delayedValue).toEqualTypeOf<
          TrackedPromise.Promise.From<DelayedValue<number>>
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
      if (TrackedPromise.isPending(delayedValue)) {
        expectTypeOf(delayedValue).toEqualTypeOf<
          TrackedPromise.Pending.From<DelayedValue<number>>
        >();
      }
      if (TrackedPromise.isPending(trackedPromise)) {
        expectTypeOf(trackedPromise).toEqualTypeOf<
          TrackedPromise.Pending<number>
        >();
      }
      if (TrackedPromise.isPending(trackedSpecialPromise)) {
        expectTypeOf(trackedSpecialPromise).toEqualTypeOf<
          TrackedPromise.Pending.From<DelayedValue<number>>
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
      if (TrackedPromise.isFulfilled(delayedValue)) {
        expectTypeOf(delayedValue).toEqualTypeOf<
          TrackedPromise.Fulfilled.From<DelayedValue<number>>
        >();
      }
      if (TrackedPromise.isFulfilled(trackedPromise)) {
        expectTypeOf(trackedPromise).toEqualTypeOf<
          TrackedPromise.Fulfilled<number>
        >();
      }
      if (TrackedPromise.isFulfilled(trackedSpecialPromise)) {
        expectTypeOf(trackedSpecialPromise).toEqualTypeOf<
          TrackedPromise.Fulfilled.From<DelayedValue<number>>
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
      if (TrackedPromise.isRejected(delayedValue)) {
        expectTypeOf(delayedValue).toEqualTypeOf<
          TrackedPromise.Rejected.From<DelayedValue<number>>
        >();
      }
      if (TrackedPromise.isRejected(trackedPromise)) {
        expectTypeOf(trackedPromise).toEqualTypeOf<
          TrackedPromise.Rejected<number, Promise<number>>
        >();
      }
      if (TrackedPromise.isRejected(trackedSpecialPromise)) {
        expectTypeOf(trackedSpecialPromise).toEqualTypeOf<
          TrackedPromise.Rejected.From<DelayedValue<number>>
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
      if (TrackedPromise.isSettled(delayedValue)) {
        expectTypeOf(delayedValue).toEqualTypeOf<
          TrackedPromise.Settled.From<DelayedValue<number>>
        >();
      }
      if (TrackedPromise.isSettled(trackedPromise)) {
        expectTypeOf(trackedPromise).toEqualTypeOf<
          TrackedPromise.Settled<number>
        >();
      }
      if (TrackedPromise.isSettled(trackedSpecialPromise)) {
        expectTypeOf(trackedSpecialPromise).toEqualTypeOf<
          TrackedPromise.Settled.From<DelayedValue<number>>
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
