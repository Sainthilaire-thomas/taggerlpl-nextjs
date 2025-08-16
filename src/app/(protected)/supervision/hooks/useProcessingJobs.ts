import { useState } from "react";
import type { ProcessingJob, ProcessingJobsHook } from "../types";

export const useProcessingJobs = (): ProcessingJobsHook => {
  const [processingJobs, setProcessingJobs] = useState<
    Map<string, ProcessingJob>
  >(new Map());

  const addJob = (callId: string, job: ProcessingJob) => {
    setProcessingJobs((prev) => new Map(prev).set(callId, job));
  };

  const updateJob = (callId: string, updates: Partial<ProcessingJob>) => {
    setProcessingJobs((prev) => {
      const newMap = new Map(prev);
      const existingJob = newMap.get(callId);
      if (existingJob) {
        newMap.set(callId, { ...existingJob, ...updates });
      }
      return newMap;
    });
  };

  const removeJob = (callId: string) => {
    setProcessingJobs((prev) => {
      const newMap = new Map(prev);
      newMap.delete(callId);
      return newMap;
    });
  };

  const getJob = (callId: string) => processingJobs.get(callId);

  const isProcessing = (callId: string) => {
    const job = processingJobs.get(callId);
    return Boolean(job && job.status !== "completed" && job.status !== "error");
  };

  return { processingJobs, addJob, updateJob, removeJob, getJob, isProcessing };
};
