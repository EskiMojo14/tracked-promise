/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
import { describe, it, expect } from "vitest";
import * as TrackedPromise from ".";

const noop = () => {
  /* noop */
};

describe("resolve", () => {
  it("should return a fulfilled promise", async () => {
    const promise = TrackedPromise.resolve(1);

    expect(promise.status).toBe("fulfilled");
    expect(promise.value).toBe(1);

    await expect(promise).resolves.toBe(1);
  });
});

describe("reject", () => {
  it("should return a rejected promise", async () => {
    const promise = TrackedPromise.reject(1);

    expect(promise.status).toBe("rejected");
    expect(promise.reason).toBe(1);

    await expect(promise).rejects.toBe(1);
  });
});

describe("from", () => {
  it("will handle a pending promise", () => {
    const promise = TrackedPromise.from(new Promise(noop));
    expect(promise.status).toBe("pending");
  });
  it("will handle a fulfilled promise", async () => {
    const promise = TrackedPromise.from(Promise.resolve(1));

    // will be resolved in the next tick
    expect(promise.status).toBe("pending");

    await expect(promise).resolves.toBe(1);
    expect(promise.status).toBe("fulfilled");

    expect.assert(TrackedPromise.isFulfilled(promise));
    expect(promise.value).toBe(1);
  });
  it("will handle a rejected promise", async () => {
    const promise = TrackedPromise.from(Promise.reject(1));

    // will be rejected in the next tick
    expect(promise.status).toBe("pending");

    await expect(promise).rejects.toBe(1);
    expect(promise.status).toBe("rejected");

    expect.assert(TrackedPromise.isRejected(promise));
    expect(promise.reason).toBe(1);
  });
});

describe("create", () => {
  it("should return a pending promise", () => {
    const promise = TrackedPromise.create(noop);
    expect(promise.status).toBe("pending");
  });
  it("should return a fulfilled promise", async () => {
    const promise = TrackedPromise.create((resolve) => {
      resolve(1);
    });
    expect(promise.status).toBe("pending");

    await expect(promise).resolves.toBe(1);
    expect(promise.status).toBe("fulfilled");

    expect.assert(TrackedPromise.isFulfilled(promise));
    expect(promise.value).toBe(1);
  });
  it("should return a rejected promise", async () => {
    const promise = TrackedPromise.create((_, reject) => {
      reject(1);
    });
    expect(promise.status).toBe("pending");

    await expect(promise).rejects.toBe(1);
    expect(promise.status).toBe("rejected");

    expect.assert(TrackedPromise.isRejected(promise));
    expect(promise.reason).toBe(1);
  });
});

describe("TrackedPromise", () => {
  describe.each([
    ["with", true],
    ["without", false],
  ])("%s new keyword", (withNew) => {
    it("should return a pending promise", () => {
      const promise = withNew
        ? new TrackedPromise.TrackedPromise(noop)
        : TrackedPromise.create(noop);
      expect(promise.status).toBe("pending");
    });
    it("should return a fulfilled promise", async () => {
      const promise = withNew
        ? new TrackedPromise.TrackedPromise((resolve) => {
            resolve(1);
          })
        : TrackedPromise.create((resolve) => {
            resolve(1);
          });
      expect(promise.status).toBe("pending");

      await expect(promise).resolves.toBe(1);
      expect(promise.status).toBe("fulfilled");

      expect.assert(TrackedPromise.isFulfilled(promise));
      expect(promise.value).toBe(1);
    });
    it("should return a rejected promise", async () => {
      const promise = withNew
        ? new TrackedPromise.TrackedPromise((_, reject) => {
            reject(1);
          })
        : TrackedPromise.TrackedPromise((_, reject) => {
            reject(1);
          });
      expect(promise.status).toBe("pending");

      await expect(promise).rejects.toBe(1);
      expect(promise.status).toBe("rejected");

      expect.assert(TrackedPromise.isRejected(promise));
      expect(promise.reason).toBe(1);
    });
  });

  it("works with instanceof", () => {
    const promise = new TrackedPromise.TrackedPromise(noop);
    expect(promise instanceof TrackedPromise.TrackedPromise).toBe(true);
    expect(promise instanceof Promise).toBe(true);
  });
});

describe("type guards", () => {
  describe("isTrackedPromise", () => {
    it.each([
      ["pending", TrackedPromise.create(noop)],
      ["fulfilled", TrackedPromise.resolve(1)],
      ["rejected", TrackedPromise.reject(1)],
    ])("should return true for %s promise", (_, promise) => {
      expect(TrackedPromise.isTrackedPromise(promise)).toBe(true);
    });
    it("should return false for a normal promise", () => {
      expect(TrackedPromise.isTrackedPromise(Promise.resolve(1))).toBe(false);
    });
  });
  describe("isPending", () => {
    it("should return true for a pending promise", () => {
      const promise = TrackedPromise.create(noop);
      expect(TrackedPromise.isPending(promise)).toBe(true);
    });
    it.each([
      ["normal", Promise.resolve(1)],
      ["fulfilled", TrackedPromise.resolve(1)],
      ["rejected", TrackedPromise.reject(1)],
    ])("should return false for %s promise", (_, promise) => {
      expect(TrackedPromise.isPending(promise as never)).toBe(false);
    });
  });
  describe("isFulfilled", () => {
    it("should return true for a fulfilled promise", () => {
      const promise = TrackedPromise.resolve(1);
      expect(TrackedPromise.isFulfilled(promise)).toBe(true);
    });
    it.each([
      ["normal", Promise.resolve(1)],
      ["pending", TrackedPromise.create(noop)],
      ["rejected", TrackedPromise.reject(1)],
    ])("should return false for %s promise", (_, promise) => {
      expect(TrackedPromise.isFulfilled(promise as never)).toBe(false);
    });
  });
  describe("isRejected", () => {
    it("should return true for a rejected promise", () => {
      const promise = TrackedPromise.reject(1);
      expect(TrackedPromise.isRejected(promise)).toBe(true);
    });
    it.each([
      ["normal", Promise.reject(1)],
      ["pending", TrackedPromise.create(noop)],
      ["fulfilled", TrackedPromise.resolve(1)],
    ])("should return false for %s promise", (_, promise) => {
      expect(TrackedPromise.isRejected(promise as never)).toBe(false);
    });
  });
  describe("isSettled", () => {
    it.each([
      ["fulfilled", TrackedPromise.resolve(1)],
      ["rejected", TrackedPromise.reject(1)],
    ])("should return true for %s promise", (_, promise) => {
      expect(TrackedPromise.isSettled(promise)).toBe(true);
    });
    it.each([
      ["normal", Promise.resolve(1)],
      ["pending", TrackedPromise.create(noop)],
    ])("should return false for %s promise", (_, promise) => {
      expect(TrackedPromise.isSettled(promise as never)).toBe(false);
    });
  });
});

describe("withResolvers", () => {
  it("should return a pending promise", () => {
    const { promise } = TrackedPromise.withResolvers();
    expect(TrackedPromise.isPending(promise)).toBe(true);
  });
  it("should resolve the promise", async () => {
    const { promise, resolve } = TrackedPromise.withResolvers();
    resolve(1);
    // will be resolved in the next tick
    expect(TrackedPromise.isPending(promise)).toBe(true);

    await expect(promise).resolves.toBe(1);
    expect(TrackedPromise.isFulfilled(promise)).toBe(true);
  });
  it("should reject the promise", async () => {
    const { promise, reject } = TrackedPromise.withResolvers();
    reject(1);
    // will be rejected in the next tick
    expect(TrackedPromise.isPending(promise)).toBe(true);

    await expect(promise).rejects.toBe(1);
    expect(TrackedPromise.isRejected(promise)).toBe(true);
  });
});

describe("withOnlyResolve", () => {
  it("should return a pending promise", () => {
    const { promise } = TrackedPromise.withOnlyResolve();
    expect(TrackedPromise.isPending(promise)).toBe(true);
  });
  it("should resolve the promise", async () => {
    const { promise, resolve } = TrackedPromise.withOnlyResolve();
    resolve(1);
    // will be resolved in the next tick
    expect(TrackedPromise.isPending(promise)).toBe(true);

    await expect(promise).resolves.toBe(1);
    expect(TrackedPromise.isFulfilled(promise)).toBe(true);
  });
});

describe("withOnlyReject", () => {
  it("should return a pending promise", () => {
    const { promise } = TrackedPromise.withOnlyReject();
    expect(TrackedPromise.isPending(promise)).toBe(true);
  });
  it("should reject the promise", async () => {
    const { promise, reject } = TrackedPromise.withOnlyReject();
    reject(1);
    // will be rejected in the next tick
    expect(TrackedPromise.isPending(promise)).toBe(true);

    await expect(promise).rejects.toBe(1);
    expect(TrackedPromise.isRejected(promise)).toBe(true);
  });
});
