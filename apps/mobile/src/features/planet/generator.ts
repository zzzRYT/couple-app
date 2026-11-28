export type JobState = 'queued' | 'running' | 'succeeded' | 'failed' | 'rejected' | 'cancelled';
// `size` is the bounding radius of the produced object in planet units; the generator does not limit it.
export type GenerationJob = { jobId: string; state: Exclude<JobState, 'succeeded'> } | { jobId: string; state: 'succeeded'; assetId: string; size: number };
export interface Generator {
  submit(prompt: string): GenerationJob;
  poll(job: GenerationJob): GenerationJob;
  cancel(job: GenerationJob): GenerationJob;
}

const terminal = (state: JobState) => !['queued', 'running'].includes(state);
// shortcut: this fake keeps jobs in memory; replace it with the server adapter in S9.
export function fakeGenerator(outcome: 'succeeded' | 'failed' | 'rejected' = 'succeeded'): Generator {
  return {
    submit: (prompt) => ({ jobId: 'local', state: prompt.trim() ? 'queued' : 'rejected' }),
    poll: (job) => terminal(job.state) ? job : job.state === 'queued' ? { ...job, state: 'running' } : outcome === 'succeeded' ? { jobId: job.jobId, state: outcome, assetId: 'sample-tree', size: 0.53 } : { ...job, state: outcome },
    cancel: (job) => terminal(job.state) ? job : { ...job, state: 'cancelled' },
  };
}
