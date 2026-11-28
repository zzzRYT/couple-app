export type JobState = 'queued' | 'running' | 'succeeded' | 'failed' | 'rejected' | 'cancelled';
// `size` is the bounding radius of the produced object in planet units; the generator does not limit it.
export type GenerationJob = { jobId: string; state: Exclude<JobState, 'succeeded'> } | { jobId: string; state: 'succeeded'; assetId: string; size: number };
// A photo input is the region the user cropped, as a file on this device.
export type GenerationInput = { kind: 'text'; prompt: string } | { kind: 'photo'; uri: string };
export interface Generator {
  submit(input: GenerationInput): GenerationJob;
  poll(job: GenerationJob): GenerationJob;
  cancel(job: GenerationJob): GenerationJob;
}

const terminal = (state: JobState) => !['queued', 'running'].includes(state);
// shortcut: this fake keeps jobs in memory and sends the input nowhere; replace it with the server adapter in S9.
// A real adapter must not receive a photo before consent, safety checks and retention rules exist (V1-F08-AC-01, V1-F08-AC-02, OQ-06).
export function fakeGenerator(outcome: 'succeeded' | 'failed' | 'rejected' = 'succeeded'): Generator {
  return {
    submit: (input) => ({ jobId: 'local', state: (input.kind === 'text' ? input.prompt : input.uri).trim() ? 'queued' : 'rejected' }),
    poll: (job) => terminal(job.state) ? job : job.state === 'queued' ? { ...job, state: 'running' } : outcome === 'succeeded' ? { jobId: job.jobId, state: outcome, assetId: 'sample-tree', size: 0.53 } : { ...job, state: outcome },
    cancel: (job) => terminal(job.state) ? job : { ...job, state: 'cancelled' },
  };
}
