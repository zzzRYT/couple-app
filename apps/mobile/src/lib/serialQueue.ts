/** Runs tasks one at a time in call order; a failed task does not stop the ones after it. */
export function serialQueue() {
  let queue: Promise<unknown> = Promise.resolve();
  return function queued<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  };
}
