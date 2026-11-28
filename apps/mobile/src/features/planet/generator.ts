export type JobState = 'queued' | 'running' | 'succeeded' | 'failed' | 'rejected' | 'cancelled';
export type GenerationJob = { jobId: string; state: Exclude<JobState, 'succeeded'> } | { jobId: string; state: 'succeeded'; assetId: string; boundingRadius: number };
export type GenerationInput = { kind: 'text'; prompt: string } | { kind: 'photo'; croppedRegionUri: string };
export interface Generator {
  submit(input: GenerationInput): GenerationJob;
  poll(job: GenerationJob): GenerationJob;
  cancel(job: GenerationJob): GenerationJob;
}

const terminal = (state: JobState) => !['queued', 'running'].includes(state);
// shortcut: this fake runs on the device and sends the input nowhere, replace it with the server adapter in S9.
// A real adapter must not receive a photo before consent, safety checks and retention rules exist (V1-F08-AC-01, V1-F08-AC-02, OQ-06).
export function fakeGenerator(outcome: 'succeeded' | 'failed' | 'rejected' = 'succeeded'): Generator {
  return {
    submit: (input) => ({ jobId: 'local', state: (input.kind === 'text' ? input.prompt : input.croppedRegionUri).trim() ? 'queued' : 'rejected' }),
    poll: (job) => terminal(job.state) ? job : job.state === 'queued' ? { ...job, state: 'running' } : outcome === 'succeeded' ? { jobId: job.jobId, state: outcome, assetId: 'sample-tree', boundingRadius: 0.53 } : { ...job, state: outcome },
    cancel: (job) => terminal(job.state) ? job : { ...job, state: 'cancelled' },
  };
}
