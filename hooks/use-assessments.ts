"use client";

import { useState, useEffect, useCallback } from "react";
import { getStudentAssessments } from "@/lib/storage";
import { Assessment } from "@/lib/types";

interface UseAssessmentsResult {
  assessments: Assessment[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAssessments(studentId: string | null): UseAssessmentsResult {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!studentId) {
      setAssessments([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentAssessments(studentId);
      setAssessments(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao carregar avaliações";
      setError(msg);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { assessments, loading, error, refresh };
}
