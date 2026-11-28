import { fakeGenerator } from '../generator';

const inputs = [{ kind: 'text', prompt: 'tree' }, { kind: 'photo', croppedRegionUri: 'file:///region.jpg' }] as const;
const cases = inputs.flatMap((input) => (['succeeded', 'failed', 'rejected'] as const).map((outcome) => ({ input, outcome })));

it.each(cases)('advances a $input.kind job to $outcome and keeps terminal states fixed', ({ input, outcome }) => {
  const generator = fakeGenerator(outcome);
  const queued = generator.submit(input);
  expect(queued.state).toBe('queued');
  const running = generator.poll(queued);
  expect(running.state).toBe('running');
  const result = generator.poll(running);
  expect(result.state).toBe(outcome);
  expect(result).toEqual(outcome === 'succeeded' ? { jobId: 'local', state: 'succeeded', assetId: 'sample-tree', boundingRadius: 0.53 } : { jobId: 'local', state: outcome });
  expect(generator.poll(result)).toEqual(result);
  expect(generator.cancel(result)).toEqual(result);
});

it.each(inputs)('rejects blank input and cancels queued or running $kind work', (input) => {
  const generator = fakeGenerator();
  expect(generator.submit({ kind: 'text', prompt: '  ' }).state).toBe('rejected');
  expect(generator.submit({ kind: 'photo', croppedRegionUri: '' }).state).toBe('rejected');
  const queued = generator.submit(input);
  expect(generator.cancel(queued).state).toBe('cancelled');
  const cancelled = generator.cancel(generator.poll(queued));
  expect(generator.poll(cancelled).state).toBe('cancelled');
});
