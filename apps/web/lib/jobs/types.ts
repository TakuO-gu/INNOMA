/**
 * Job Types for Fetch Progress Tracking
 * Tracks the state of municipality information fetch jobs
 */

export type JobStatus = 'running' | 'completed' | 'failed' | 'paused';
export type ServiceJobStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Status of a single service within a fetch job
 */
export interface ServiceJobState {
  status: ServiceJobStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  variablesCount?: number;
}

/**
 * Error information for a fetch job
 */
export interface JobError {
  message: string;
  occurredAt: string;
  serviceId?: string;
}

/**
 * Fetch job state - tracks progress of municipality information fetch
 */
export interface FetchJob {
  id: string;
  municipalityId: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  status: JobStatus;
  totalServices: number;
  services: Record<string, ServiceJobState>;
  error?: JobError;
}

/**
 * Summary of job progress for UI display
 */
export interface JobSummary {
  completedCount: number;
  failedCount: number;
  pendingCount: number;
  totalCount: number;
}

/**
 * Calculate job progress summary
 */
export function getJobSummary(job: FetchJob): JobSummary {
  const services = Object.values(job.services);
  return {
    completedCount: services.filter((s) => s.status === 'completed').length,
    failedCount: services.filter((s) => s.status === 'failed').length,
    pendingCount: services.filter((s) => s.status === 'pending' || s.status === 'running').length,
    totalCount: services.length,
  };
}

/**
 * Check if job has unfinished services
 */
export function hasUnfinishedServices(job: FetchJob): boolean {
  return Object.values(job.services).some(
    (s) => s.status === 'pending' || s.status === 'running' || s.status === 'failed'
  );
}

/**
 * Get list of services that need to be fetched
 */
export function getServicesToFetch(job: FetchJob): string[] {
  return Object.entries(job.services)
    .filter(([, state]) => state.status !== 'completed')
    .map(([serviceId]) => serviceId);
}
