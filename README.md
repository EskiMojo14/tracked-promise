# Tracked Promise

Create promises that can be checked synchronously for their state. Matches how React Suspense [tracks promises](https://bsky.app/profile/sebmarkbage.calyptus.eu/post/3lku7b7xjmk2w).

Functions are exported separately, but we recommend using a namespace import for convenience.

```ts
import * as TrackedPromise from "tracked-promise";

const resolvedPromise = TrackedPromise.resolve(1);
console.log(resolvedPromise.status); // "fulfilled"
console.log(resolvedPromise.value); // 1

const rejectedPromise = TrackedPromise.reject(1);
console.log(rejectedPromise.status); // "rejected"
console.log(rejectedPromise.reason); // 1

const ongoingPromise = TrackedPromise.create((resolve) => {
  setTimeout(() => {
    resolve(1);
  }, 1000);
});
console.log(ongoingPromise.status); // "pending"
```

## `TrackedPromise.resolve`

Returns a fulfilled promise.

```ts
const resolvedPromise = TrackedPromise.resolve(1);
console.log(resolvedPromise.status); // "fulfilled"
console.log(resolvedPromise.value); // 1
```

## `TrackedPromise.reject`

Returns a rejected promise.

```ts
const rejectedPromise = TrackedPromise.reject(1);
console.log(rejectedPromise.status); // "rejected"
console.log(rejectedPromise.reason); // 1
```

## `TrackedPromise.create`

Create a tracked promise from an executor function. Matches the behavior of `new Promise(executor)`.

```ts
const ongoingPromise = TrackedPromise.create((resolve) => {
  setTimeout(() => {
    resolve(1);
  }, 1000);
});
console.log(ongoingPromise.status); // "pending"

await ongoingPromise;
console.log(ongoingPromise.status); // "fulfilled"
console.log(ongoingPromise.value); // 1
```

## `TrackedPromise.TrackedPromise`

A wrapper for `TrackedPromise.create` that can optionally be used with the `new` keyword. Matches the behavior of `new Promise(executor)`.

Also overrides the `Symbol.hasInstance` method to allow for type checking with `instanceof`.

```ts
const ongoingPromise = new TrackedPromise.TrackedPromise((resolve) => {
  setTimeout(() => {
    resolve(1);
  }, 1000);
});
console.log(ongoingPromise.status); // "pending"

await ongoingPromise;
console.log(ongoingPromise.status); // "fulfilled"
console.log(ongoingPromise.value); // 1

// equivalent to `ongoingPromise instanceof Promise && TrackedPromise.isTrackedPromise(ongoingPromise)`
if (ongoingPromise instanceof TrackedPromise.TrackedPromise) {
  console.log(ongoingPromise.status); // "fulfilled"
  console.log(ongoingPromise.value); // 1
}
```

## `TrackedPromise.track`

Create a tracked promise from an existing promise. Note that the promise will always be pending until the next tick, even if the existing promise is already settled.

_Warning: mutates the existing promise by adding the necessary tracked promise properties._

```ts
const existingPromise = Promise.resolve(1);
const trackedPromise = TrackedPromise.track(existingPromise);
console.log(trackedPromise.status); // "pending"

await trackedPromise;
console.log(trackedPromise.status); // "fulfilled"
console.log(trackedPromise.value); // 1
```

Note that `TrackedPromise.track` calls `promise.then` immediately, which may lead to unexpected behaviour with custom thenables.

```ts
const getPosts = db.query.posts.findMany();
// a fetch happens here
const getPostsTracked = TrackedPromise.track(getPosts);

// so if we update posts
await db.update(posts).set({ title: "New Title" }).where(eq(posts.id, 1));

// fetch happens again here
const result = await getPostsTracked;
// but getPostsTracked.value is still the old data
```

## `TrackedPromise.withResolvers`

Create a tracked promise with resolvers. Matches the behavior of `Promise.withResolvers`.

```ts
const { promise, resolve, reject } = TrackedPromise.withResolvers<number>();
console.log(promise.status); // "pending"

resolve(1);
await promise;
console.log(promise.status); // "fulfilled"
console.log(promise.value); // 1
```

## `TrackedPromise.withOnlyResolve`

Create a tracked promise with only a resolver. Matches the behavior of `Promise.withResolvers`, but without the rejector.

```ts
const { promise, resolve } = TrackedPromise.withOnlyResolve<number>();
console.log(promise.status); // "pending"

resolve(1);
await promise;
console.log(promise.status); // "fulfilled"
console.log(promise.value); // 1
```

## `TrackedPromise.withOnlyReject`

Create a tracked promise with only a rejector. Matches the behavior of `Promise.withResolvers`, but without the resolver.

```ts
const { promise, reject } = TrackedPromise.withOnlyReject();
console.log(promise.status); // "pending"

reject(1);
await promise.catch(() => {});
console.log(promise.status); // "rejected"
console.log(promise.reason); // 1
```

### Type Guards

For convenience, we also export a few type guards that can be used to check the state of a promise. These help to narrow the type of the promise to the correct settled state.

The available type guards are:

- `isTrackedPromise`
- `isPending`
- `isFulfilled`
- `isRejected`
- `isSettled`

```ts
import * as TrackedPromise from "tracked-promise";

const promise = TrackedPromise.create((resolve) => {
  setTimeout(() => {
    resolve(1);
  }, 1000);
});

if (TrackedPromise.isPending(promise)) {
  console.log(promise.status); // "pending"
}

await promise;

if (TrackedPromise.isFulfilled(promise)) {
  console.log(promise.status); // "fulfilled"
  console.log(promise.value); // 1
}
```
