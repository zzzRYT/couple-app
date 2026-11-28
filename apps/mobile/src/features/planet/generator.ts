export type JobState = 'queued' | 'running' | 'succeeded' | 'failed' | 'rejected' | 'cancelled';
export type GenerationJob = { jobId: string; state: JobState; assetId?: string };
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
    poll: (job) => terminal(job.state) ? job : job.state === 'queued' ? { ...job, state: 'running' } : { ...job, state: outcome, ...(outcome === 'succeeded' ? { assetId: 'sample-tree' } : {}) },
    cancel: (job) => terminal(job.state) ? job : { ...job, state: 'cancelled' },
  };
}
