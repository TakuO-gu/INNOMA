/**
 * Job Storage Operations
 * Handles reading and writing fetch job state to the filesystem
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { FetchJob, ServiceJobState } from './types';

const JOBS_DIR = path.join(process.cwd(), 'data', 'artifacts', '_jobs');

/**
 * Ensure jobs directory exists
 */
async function ensureJobsDir(municipalityId: string): Promise<string> {
  const dir = path.join(JOBS_DIR, municipalityId);

  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  return dir;
}

/**
 * Get job file path
 */
function getJobPath(municipalityId: string): string {
  return path.join(JOBS_DIR, municipalityId, 'latest.json');
}

/**
 * Generate unique job ID
 */
function generateJobId(municipalityId: string): string {
  return `${municipalityId}-${Date.now()}`;
}

/**
 * Create a new fetch job
 */
export function createFetchJob(municipalityId: string, serviceIds: string[]): FetchJob {
  const now = new Date().toISOString();

  const services: Record<string, ServiceJobState> = {};
  for (const serviceId of serviceIds) {
    services[serviceId] = {
      status: 'pending',
    };
  }

  return {
    id: generateJobId(municipalityId),
    municipalityId,
    startedAt: now,
    updatedAt: now,
    status: 'running',
    totalServices: serviceIds.length,
    services,
  };
}

/**
 * Get the latest job for a municipality
 */
export async function getLatestJob(municipalityId: string): Promise<FetchJob | null> {
  const filePath = getJobPath(municipalityId);

  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as FetchJob;
  } catch {
    return null;
  }
}

/**
 * Save job state to file
 */
export async function saveJob(job: FetchJob): Promise<void> {
  await ensureJobsDir(job.municipalityId);

  const filePath = getJobPath(job.municipalityId);
  job.updatedAt = new Date().toISOString();

  await writeFile(filePath, JSON.stringify(job, null, 2), 'utf-8');
}

/**
 * Update service status within a job
 */
export function updateServiceStatus(
  job: FetchJob,
  serviceId: string,
  status: ServiceJobState['status'],
  details?: { error?: string; variablesCount?: number }
): FetchJob {
  const now = new Date().toISOString();

  if (!job.services[serviceId]) {
    job.services[serviceId] = { status: 'pending' };
  }

  const serviceState = job.services[serviceId];
  serviceState.status = status;

  if (status === 'running' && !serviceState.startedAt) {
    serviceState.startedAt = now;
  }

  if (status === 'completed' || status === 'failed') {
    serviceState.completedAt = now;
  }

  if (details?.error) {
    serviceState.error = details.error;
  }

  if (details?.variablesCount !== undefined) {
    serviceState.variablesCount = details.variablesCount;
  }

  job.updatedAt = now;

  return job;
}

/**
 * Record an error on the job
 */
export function recordJobError(
  job: FetchJob,
  error: Error | string,
  serviceId?: string
): FetchJob {
  const now = new Date().toISOString();

  job.error = {
    message: typeof error === 'string' ? error : error.message,
    occurredAt: now,
    serviceId,
  };

  job.status = 'failed';
  job.updatedAt = now;

  return job;
}

/**
 * Mark job as completed
 */
export function completeJob(job: FetchJob): FetchJob {
  const now = new Date().toISOString();

  // Check if all services are completed
  const allCompleted = Object.values(job.services).every(
    (s) => s.status === 'completed'
  );

  const anyFailed = Object.values(job.services).some(
    (s) => s.status === 'failed'
  );

  job.status = anyFailed ? 'failed' : allCompleted ? 'completed' : 'paused';
  job.completedAt = now;
  job.updatedAt = now;

  return job;
}

/**
 * Mark job as paused (interrupted)
 */
export function pauseJob(job: FetchJob): FetchJob {
  const now = new Date().toISOString();

  // Mark any running services as failed
  for (const serviceId of Object.keys(job.services)) {
    if (job.services[serviceId].status === 'running') {
      job.services[serviceId].status = 'failed';
      job.services[serviceId].completedAt = now;
      job.services[serviceId].error = 'Job interrupted';
    }
  }

  job.status = 'paused';
  job.updatedAt = now;

  return job;
}

/**
 * Check if job can be resumed
 */
export function canResumeJob(job: FetchJob): boolean {
  // Can resume if there are pending or failed services
  return (
    job.status !== 'completed' &&
    Object.values(job.services).some(
      (s) => s.status === 'pending' || s.status === 'failed'
    )
  );
}

/**
 * Get services that need to be fetched (for resume)
 */
export function getResumableServices(job: FetchJob): string[] {
  return Object.entries(job.services)
    .filter(([, state]) => state.status === 'pending' || state.status === 'failed')
    .map(([serviceId]) => serviceId);
}

/**
 * Update job for resume - reset failed services to pending
 */
export function prepareJobForResume(job: FetchJob): FetchJob {
  const now = new Date().toISOString();

  // Reset failed services to pending
  for (const serviceId of Object.keys(job.services)) {
    if (job.services[serviceId].status === 'failed') {
      job.services[serviceId] = {
        status: 'pending',
      };
    }
  }

  job.status = 'running';
  job.error = undefined;
  job.updatedAt = now;

  return job;
}
