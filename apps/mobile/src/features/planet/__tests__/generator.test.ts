import { fakeGenerator } from '../generator';

it.each(['succeeded', 'failed', 'rejected'] as const)('advances to %s and keeps terminal states fixed', (outcome) => {
  const generator = fakeGenerator(outcome);
  const queued = generator.submit('tree');
  expect(queued.state).toBe('queued');
  const running = generator.poll(queued);
  expect(running.state).toBe('running');
  const result = generator.poll(running);
  expect(result.state).toBe(outcome);
  expect(result.assetId).toBe(outcome === 'succeeded' ? 'sample-tree' : undefined);
  expect(generator.poll(result)).toEqual(result);
  expect(generator.cancel(result)).toEqual(result);
});

it('rejects blank input and cancels queued or running work', () => {
  const generator = fakeGenerator();
  expect(generator.submit('  ').state).toBe('rejected');
  const queued = generator.submit('tree');
  expect(generator.cancel(queued).state).toBe('cancelled');
  const cancelled = generator.cancel(generator.poll(queued));
  expect(generator.poll(cancelled).state).toBe('cancelled');
});
