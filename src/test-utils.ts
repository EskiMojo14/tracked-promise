export class DelayedValue<T> implements PromiseLike<T> {
  value: T;
  constructor(value: T) {
    this.value = value;
  }
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return new Promise<T>((resolve) => {
      setTimeout(() => {
        resolve(this.value);
      }, 1000);
    }).then(onfulfilled, onrejected);
  }
}
